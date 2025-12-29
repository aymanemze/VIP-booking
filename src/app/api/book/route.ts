import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { services } from "@/data/services";
import { sendSMS } from "@/lib/sms";
import { format } from "date-fns";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { serviceIds, date, time, customerName, customerPhone, firebaseUid } = body;

        // Validate input
        if (!serviceIds || !date || !time || !customerName || !customerPhone) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Calculate total duration
        const selectedServices = services.filter((s) => serviceIds.includes(s.id));
        const totalDuration = selectedServices.reduce((acc, s) => acc + s.duration, 0);

        const serviceNames = selectedServices.map(s => s.title).join(", ");

        // Parse start time
        const [hours, minutes] = time.split(":").map(Number);
        const startTime = new Date(date);
        startTime.setHours(hours, minutes, 0, 0);

        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + totalDuration);

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
