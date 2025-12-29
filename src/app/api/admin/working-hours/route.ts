import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from("working_hours")
            .select("*")
            .order("day_of_week");

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching working hours:", error);
        return NextResponse.json({ error: "Failed to fetch working hours" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, start_time, end_time, is_active, lunch_start, lunch_end } = body;

        // Sanitize times: Ensure empty strings become null for nullable columns
        // For required columns (start_time, end_time), ensure they are valid or keep as is (DB will error if null)
        const updateData = {
            start_time,
            end_time,
            is_active,
            lunch_start: lunch_start === "" ? null : lunch_start,
            lunch_end: lunch_end === "" ? null : lunch_end
        };

        const { data, error } = await supabaseAdmin
            .from("working_hours")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error updating working hours:", error);
        return NextResponse.json({ error: "Failed to update working hours" }, { status: 500 });
    }
}
