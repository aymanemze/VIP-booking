import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const start = searchParams.get("start");
        const end = searchParams.get("end");

        if (!start || !end) {
            return NextResponse.json({ error: "Start and end dates required" }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from("blocked_times")
            .select("*")
            .gte("start_time", start)
            .lte("end_time", end);

        if (error) throw error;

        const responseData = Array.isArray(data) ? data : [];
        return NextResponse.json(responseData);
    } catch (error) {
        console.error("Error fetching blocked times:", error);
        return NextResponse.json({ error: "Failed to fetch blocked times" }, { status: 500 });
    }
}
