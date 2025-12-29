import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { start_time, end_time, reason } = body;

        if (!start_time || !end_time) {
            return NextResponse.json({ error: "Start and end times required" }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from("blocked_times")
            .insert({
                start_time,
                end_time,
                reason: reason || "Admin Blocked",
            })
            .select()
            .single();

        if (error) {
            console.error("Supabase error:", error);
            return NextResponse.json({ error: "Failed to block time" }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error blocking time:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
