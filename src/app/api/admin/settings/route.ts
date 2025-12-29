import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { type, value } = body;

        if (type === "password") {
            if (!value || value.length < 6) {
                return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
            }

            const hash = await bcrypt.hash(value, 10);

            const { error } = await supabaseAdmin
                .from("settings")
                .upsert({
                    key: "admin_password_hash",
                    value: { hash }
                });

            if (error) throw error;

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Invalid setting type" }, { status: 400 });
    } catch (error) {
        console.error("Error updating settings:", error);
        return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }
}
