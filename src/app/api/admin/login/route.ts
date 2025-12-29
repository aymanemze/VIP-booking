import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyPassword } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
    try {
        const { password } = await request.json();

        if (!password) {
            return NextResponse.json({ error: "Password required" }, { status: 400 });
        }

        console.log("Login Attempt: Starting...");

        // Get admin password hash from settings
        const { data: settings, error: dbError } = await supabaseAdmin
            .from("settings")
            .select("value")
            .eq("key", "admin_password_hash")
            .maybeSingle();

        if (dbError) {
            console.error("Login Error: DB Error fetching settings:", dbError);
            return NextResponse.json({ error: "Database error" }, { status: 500 });
        }

        if (!settings) {
            console.error("Login Error: No 'admin_password_hash' found in settings table.");
            return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
        }

        console.log("Login: Found settings entry.");

        const storedHash = settings.value.hash;
        console.log("Login: Verifying password against hash...");

        const isValid = await verifyPassword(password, storedHash);

        if (!isValid) {
            console.warn("Login Failed: Invalid password provided.");
            return NextResponse.json({ error: "Invalid password" }, { status: 401 });
        }

        console.log("Login Success: Password verified.");

        // Set cookie
        const response = NextResponse.json({ success: true });
        response.cookies.set("admin_auth", "true", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        return response;
    } catch (error) {
        console.error("Login Critical Error:", error);
        return NextResponse.json({ error: "Login failed" }, { status: 500 });
    }
}
