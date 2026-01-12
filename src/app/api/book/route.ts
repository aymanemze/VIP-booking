import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { services } from "@/data/services";
import { sendSMS } from "@/lib/sms";
import { format } from "date-fns";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { serviceIds, date, time, customerName, customerPhone, firebaseUid, startTimeISO } = body;

        // Validate input
        if (!serviceIds || (!startTimeISO && (!date || !time)) || !customerName || !customerPhone) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Calculate total duration
        const selectedServices = services.filter((s) => serviceIds.includes(s.id));
        const totalDuration = selectedServices.reduce((acc, s) => acc + s.duration, 0);

        const serviceNames = selectedServices.map(s => s.title).join(", ");

        // Parse start time
        // Parse start time
        let startTime: Date;

        // Prioritize date and time based construction to ensure correct timezone (GMT+1) and zero seconds
        if (date && time) {
            const dateStr = date.split('T')[0]; // Ensure we just get the YYYY-MM-DD part
            const dateTimeStr = `${dateStr}T${time}:00+01:00`;
            startTime = new Date(dateTimeStr);
        } else if (startTimeISO) {
            startTime = new Date(startTimeISO);
            startTime.setSeconds(0, 0); // Ensure seconds are zeroed out
        } else {
            return NextResponse.json({ error: "Missing date/time information" }, { status: 400 });
        }

        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + totalDuration);

        // --- VALIDATION: Check for conflicts ---
        // Check if the requested time range overlaps with any existing appointments
        // or blocked times.

        const { data: conflictingAppointments, error: conflictError } = await supabaseAdmin
            .from("appointments")
            .select("id")
            .filter("status", "eq", "confirmed")
            .or(`and(start_time.lte.${startTime.toISOString()},end_time.gt.${startTime.toISOString()}),and(start_time.lt.${endTime.toISOString()},end_time.gte.${endTime.toISOString()}),and(start_time.gte.${startTime.toISOString()},end_time.lte.${endTime.toISOString()})`)
            .maybeSingle();

        if (conflictError) {
            console.error("Error checking conflicts:", conflictError);
            return NextResponse.json({ error: "Failed to check availability" }, { status: 500 });
        }

        if (conflictingAppointments) {
            return NextResponse.json({ error: "Selected time slot is no longer available" }, { status: 409 });
        }

        const { data: blockedTimes, error: blockedError } = await supabaseAdmin
            .from("blocked_times")
            .select("id")
            .or(`and(start_time.lte.${startTime.toISOString()},end_time.gt.${startTime.toISOString()}),and(start_time.lt.${endTime.toISOString()},end_time.gte.${endTime.toISOString()}),and(start_time.gte.${startTime.toISOString()},end_time.lte.${endTime.toISOString()})`)
            .maybeSingle();

        if (blockedError) {
            console.error("Error checking blocked times:", blockedError);
            return NextResponse.json({ error: "Failed to check availability" }, { status: 500 });
        }

        if (blockedTimes) {
            return NextResponse.json({ error: "Selected time slot is blocked" }, { status: 409 });
        }


        // Create or get customer
        let customerId = null;
        const { data: existingCustomer } = await supabaseAdmin
            .from("customers")
            .select("id")
            .eq("phone", customerPhone)
            .single();

        if (existingCustomer) {
            customerId = existingCustomer.id;
            // Update customer name if changed
            await supabaseAdmin
                .from("customers")
                .update({ name: customerName })
                .eq("id", customerId);
        } else {
            // Create new customer
            const { data: newCustomer } = await supabaseAdmin
                .from("customers")
                .insert({
                    name: customerName,
                    phone: customerPhone,
                    total_bookings: 0,
                })
                .select("id")
                .single();

            if (newCustomer) {
                customerId = newCustomer.id;
            }
        }

        // Create appointment in Supabase
        const { data: appointment, error } = await supabaseAdmin
            .from("appointments")
            .insert({
                customer_name: customerName,
                customer_phone: customerPhone,
                customer_id: customerId,
                service_id: serviceIds[0], // Store first service ID
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
                status: "confirmed",
            })
            .select()
            .single();

        if (error) {
            console.error("Supabase error:", error);
            return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
        }

        // --- SEND SMS CONFIRMATION ---
        const formattedDate = format(startTime, "MMM d, yyyy 'at' h:mm a");
        const message = `Hi ${customerName}, your appointment for ${serviceNames} is confirmed for ${formattedDate}. See you soon!`;

        // Fire and forget (don't block response)
        sendSMS(customerPhone, message).then(result => {
            if (!result.success) console.warn("SMS Failed:", result.error);
        });

        return NextResponse.json({
            success: true,
            appointmentId: appointment.id,
            message: "Booking confirmed!",
        });
    } catch (error: any) {
        console.error("Error creating booking:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create booking" },
            { status: 500 }
        );
    }
}
