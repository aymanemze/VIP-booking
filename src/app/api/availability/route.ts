import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get("date"); // Format: YYYY-MM-DD

        if (!date) {
            return NextResponse.json({ error: "Date parameter is required" }, { status: 400 });
        }

        const selectedDate = new Date(date);
        const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 6 = Saturday

        // Check if this day has working hours
        const { data: workingHours } = await supabaseAdmin
            .from("working_hours")
            .select("*")
            .eq("day_of_week", dayOfWeek)
            .eq("is_active", true)
            .maybeSingle();

        // If no working hours or day is closed, return all slots as unavailable
        if (!workingHours) {
            const slots = [];
            for (let hour = 9; hour < 18; hour++) {
                for (let min = 0; min < 60; min += 15) {
                    const time = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
                    slots.push({ time, available: false });
                }
            }
            return NextResponse.json({ slots });
        }

        // Parse working hours
        const [startHour, startMin] = workingHours.start_time.split(":").map(Number);
        const [endHour, endMin] = workingHours.end_time.split(":").map(Number);

        // Get existing appointments for this date
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const { data: appointments } = await supabaseAdmin
            .from("appointments")
            .select("start_time, end_time")
            .gte("start_time", startOfDay.toISOString())
            .lte("start_time", endOfDay.toISOString())
            .eq("status", "confirmed");

        // Get blocked times for this date
        const { data: blockedTimes } = await supabaseAdmin
            .from("blocked_times")
            .select("start_time, end_time")
            .gte("start_time", startOfDay.toISOString())
            .lte("end_time", endOfDay.toISOString());

        // Generate time slots
        const slots = [];

        // Use working hours for the loop bounds
        for (let hour = startHour; hour < endHour; hour++) {
            for (let min = 0; min < 60; min += 15) {
                // If we are at the very first hour, start from startMin
                if (hour === startHour && min < startMin) continue;
                // If we are at the very last hour (which is not included in loop condition usually, but just in case logic changes)
                // Actually the loop < endHour avoids the last hour's minutes unless endMin > 0... 
                // Let's stick to the standard logic: loop entire hours, check minutes inside.

                const slotMinutes = hour * 60 + min;
                const workStartMinutes = startHour * 60 + startMin;
                const workEndMinutes = endHour * 60 + endMin;

                // Stop if we exceeded working hours
                if (slotMinutes >= workEndMinutes) break;

                // Skip if before start time (handled by continue above but good to be safe)
                if (slotMinutes < workStartMinutes) continue;

                const time = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
                let isLunch = false;

                // Check lunch break
                if (workingHours.lunch_start && workingHours.lunch_end) {
                    const [lStartH, lStartM] = workingHours.lunch_start.split(":").map(Number);
                    const [lEndH, lEndM] = workingHours.lunch_end.split(":").map(Number);
                    const lunchStartMinutes = lStartH * 60 + lStartM;
                    const lunchEndMinutes = lEndH * 60 + lEndM;

                    if (slotMinutes >= lunchStartMinutes && slotMinutes < lunchEndMinutes) {
                        isLunch = true;
                    }
                }

                if (isLunch) {
                    slots.push({ time, available: false, is_lunch: true });
                    continue;
                }

                // Check if slot overlaps with existing appointments
                const slotStart = new Date(date);
                slotStart.setHours(hour, min, 0, 0);
                const slotEnd = new Date(slotStart);
                slotEnd.setMinutes(slotEnd.getMinutes() + 15);

                let isAvailable = true;

                // Check appointments
                if (appointments) {
                    isAvailable = !appointments.some((apt) => {
                        const aptStart = new Date(apt.start_time);
                        const aptEnd = new Date(apt.end_time);
                        return slotStart < aptEnd && slotEnd > aptStart;
                    });
                }

                // Check blocked times
                if (isAvailable && blockedTimes) {
                    isAvailable = !blockedTimes.some((block) => {
                        const blockStart = new Date(block.start_time);
                        const blockEnd = new Date(block.end_time);
                        return slotStart < blockEnd && slotEnd > blockStart;
                    });
                }

                slots.push({ time, available: isAvailable, is_lunch: false });
            }
        }

        return NextResponse.json({ slots });
    } catch (error) {
        console.error("Error fetching availability:", error);
        return NextResponse.json(
            { error: "Failed to fetch availability" },
            { status: 500 }
        );
    }
}
