"use client";

import { useEffect, useState } from "react";
import { Calendar, Users, DollarSign, Clock } from "lucide-react";

interface Stats {
    todayBookings: number;
    todayRevenue: number;
    totalCustomers: number;
    upcomingToday: number;
}

import { useRouter } from "next/navigation";
import { services } from "@/data/services";
import { X } from "lucide-react";

export default function AdminDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<Stats>({
        todayBookings: 0,
        todayRevenue: 0,
        totalCustomers: 0,
        upcomingToday: 0,
    });
    const [loading, setLoading] = useState(true);

    // Modal States
    const [isWalkInOpen, setIsWalkInOpen] = useState(false);
    const [isBlockTimeOpen, setIsBlockTimeOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form States
    const [walkInForm, setWalkInForm] = useState({
        name: "",
        phone: "",
        serviceId: services[0]?.id || "",
        date: new Date().toISOString().split("T")[0],
        time: "10:00",
    });

    const [blockTimeForm, setBlockTimeForm] = useState({
        start: "",
        end: "",
        reason: "",
    });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await fetch("/api/admin/stats");
            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleWalkInSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch("/api/book", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customerName: walkInForm.name,
                    customerPhone: walkInForm.phone,
                    serviceIds: [walkInForm.serviceId],
                    date: walkInForm.date,
                    time: walkInForm.time,
                }),
            });

            if (res.ok) {
                alert("Walk-in booked successfully!");
                setIsWalkInOpen(false);
                fetchStats(); // Refresh stats
                setWalkInForm({ ...walkInForm, name: "", phone: "" }); // Reset PII
            } else {
                const err = await res.json();
                alert(`Error: ${err.error}`);
            }
        } catch (error) {
            console.error(error);
            alert("Failed to book walk-in");
        } finally {
            setSubmitting(false);
        }
    };

    const handleBlockTimeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // Convert local datetime to ISO
            const startISO = new Date(blockTimeForm.start).toISOString();
            const endISO = new Date(blockTimeForm.end).toISOString();

            const res = await fetch("/api/admin/block-time", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    start_time: startISO,
                    end_time: endISO,
                    reason: blockTimeForm.reason,
                }),
            });

            if (res.ok) {
                alert("Time blocked successfully!");
                setIsBlockTimeOpen(false);
                setBlockTimeForm({ start: "", end: "", reason: "" });
            } else {
                alert("Failed to block time");
            }
        } catch (error) {
            console.error(error);
            alert("Error blocking time");
        } finally {
            setSubmitting(false);
        }
    };

    const statCards = [
        {
            title: "Today's Bookings",
            value: stats.todayBookings,
            icon: Calendar,
            color: "bg-blue-500",
        },
        {
            title: "Today's Revenue",
            value: `MAD ${stats.todayRevenue}`,
            icon: DollarSign,
            color: "bg-green-500",
        },
        {
            title: "Total Customers",
            value: stats.totalCustomers,
            icon: Users,
            color: "bg-purple-500",
        },
        {
            title: "Upcoming (2h)",
            value: stats.upcomingToday,
            icon: Clock,
            color: "bg-orange-500",
        },
    ];

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                <p className="text-zinc-400 mt-2">Welcome back! Here's your overview for today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={stat.title}
                            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`${stat.color} w-12 h-12 rounded-xl flex items-center justify-center`}>
                                    <Icon className="text-white" size={24} />
                                </div>
                            </div>
                            <p className="text-zinc-400 text-sm mb-1">{stat.title}</p>
                            <p className="text-3xl font-bold text-white">
                                {loading ? "..." : stat.value}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => setIsWalkInOpen(true)}
                        className="bg-white text-black font-semibold py-3 px-6 rounded-xl hover:bg-zinc-100 transition"
                    >
                        Add Walk-in Customer
                    </button>
                    <button
                        onClick={() => setIsBlockTimeOpen(true)}
                        className="bg-zinc-800 text-white font-semibold py-3 px-6 rounded-xl hover:bg-zinc-700 transition"
                    >
                        Block Time
                    </button>
                    <button
                        onClick={() => router.push("/admin/calendar")}
                        className="bg-zinc-800 text-white font-semibold py-3 px-6 rounded-xl hover:bg-zinc-700 transition"
                    >
                        View Calendar
                    </button>
                </div>
            </div>

            {/* Walk-in Modal */}
            {isWalkInOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 relative">
                        <button
                            onClick={() => setIsWalkInOpen(false)}
                            className="absolute top-4 right-4 text-zinc-400 hover:text-white"
                        >
                            <X size={24} />
                        </button>
                        <h2 className="text-xl font-bold text-white mb-6">Add Walk-in Customer</h2>

                        <form onSubmit={handleWalkInSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Customer Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-white"
                                    value={walkInForm.name}
                                    onChange={e => setWalkInForm({ ...walkInForm, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    required
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-white"
                                    value={walkInForm.phone}
                                    onChange={e => setWalkInForm({ ...walkInForm, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Service</label>
                                <select
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-white"
                                    value={walkInForm.serviceId}
                                    onChange={e => setWalkInForm({ ...walkInForm, serviceId: e.target.value })}
                                >
                                    {services.map(s => (
                                        <option key={s.id} value={s.id}>{s.title} ({s.duration} min)</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-white"
                                        value={walkInForm.date}
                                        onChange={e => setWalkInForm({ ...walkInForm, date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">Time</label>
                                    <input
                                        type="time"
                                        required
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-white"
                                        value={walkInForm.time}
                                        onChange={e => setWalkInForm({ ...walkInForm, time: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition mt-2"
                            >
                                {submitting ? "Booking..." : "Confirm Booking"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Block Time Modal */}
            {isBlockTimeOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 relative">
                        <button
                            onClick={() => setIsBlockTimeOpen(false)}
                            className="absolute top-4 right-4 text-zinc-400 hover:text-white"
                        >
                            <X size={24} />
                        </button>
                        <h2 className="text-xl font-bold text-white mb-6">Block Time</h2>

                        <form onSubmit={handleBlockTimeSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Start Time</label>
                                <input
                                    type="datetime-local"
                                    required
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-white"
                                    value={blockTimeForm.start}
                                    onChange={e => setBlockTimeForm({ ...blockTimeForm, start: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">End Time</label>
                                <input
                                    type="datetime-local"
                                    required
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-white"
                                    value={blockTimeForm.end}
                                    onChange={e => setBlockTimeForm({ ...blockTimeForm, end: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Reason</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Lunch, Personal, Maintenance"
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-white"
                                    value={blockTimeForm.reason}
                                    onChange={e => setBlockTimeForm({ ...blockTimeForm, reason: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition mt-2"
                            >
                                {submitting ? "Blocking..." : "Block Time"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
