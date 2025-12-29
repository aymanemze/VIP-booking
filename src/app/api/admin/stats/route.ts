import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Today's bookings count
        const { count: todayBookings } = await supabaseAdmin
            .from("appointments")
            .select("*", { count: "exact", head: true })
            .gte("start_time", today.toISOString())
            .lt("start_time", tomorrow.toISOString())
            .eq("status", "confirmed");

        // Today's revenue
        const { data: todayAppointments } = await supabaseAdmin
            .from("appointments")
            .select("service_id")
            .gte("start_time", today.toISOString())
            .lt("start_time", tomorrow.toISOString())
            .eq("status", "confirmed");

        // Calculate revenue (simplified - assumes single service per booking)
        const { data: services } = await supabaseAdmin
            .from("services")
            .select("id, price");

        let todayRevenue = 0;
        if (todayAppointments && services) {
            todayAppointments.forEach((apt) => {
                const service = services.find((s) => s.id === apt.service_id);
                if (service) todayRevenue += Number(service.price);
            });
        }

        // Total customers
        const { count: totalCustomers } = await supabaseAdmin
            .from("customers")
            .select("*", { count: "exact", head: true });

        // Upcoming in next 2 hours
        const twoHoursLater = new Date();
        twoHoursLater.setHours(twoHoursLater.getHours() + 2);

        const { count: upcomingToday } = await supabaseAdmin
            .from("appointments")
            .select("*", { count: "exact", head: true })
            .gte("start_time", new Date().toISOString())
            .lte("start_time", twoHoursLater.toISOString())
            .eq("status", "confirmed");

        return NextResponse.json({
            todayBookings: todayBookings || 0,
            todayRevenue,
            totalCustomers: totalCustomers || 0,
            upcomingToday: upcomingToday || 0,
        });
    } catch (error) {
        console.error("Error fetching stats:", error);
        return NextResponse.json(
            { error: "Failed to fetch stats" },
            { status: 500 }
        );
    }
}
