import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
    try {
        // Test Supabase connection
        const { data: workingHours, error } = await supabaseAdmin
            .from("working_hours")
            .select("*");

        if (error) {
            return NextResponse.json({
                error: error.message,
                hint: "Check your Supabase credentials in .env.local"
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            working_hours_count: workingHours?.length || 0,
            working_hours: workingHours
        });
    } catch (error: any) {
        return NextResponse.json({
            error: error.message
        }, { status: 500 });
    }
}
