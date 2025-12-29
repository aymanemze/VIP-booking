"use client";

import { useEffect, useState } from "react";
import { Clock, Save, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

interface WorkingHour {
    id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_active: boolean;
    lunch_start?: string | null;
    lunch_end?: string | null;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function WorkingHoursPage() {
    const [hours, setHours] = useState<WorkingHour[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [globalLunchStart, setGlobalLunchStart] = useState("");
    const [globalLunchEnd, setGlobalLunchEnd] = useState("");

    useEffect(() => {
        if (hours.length > 0) {
            // Initialize global state from the first active day that has lunch set
            const withLunch = hours.find(h => h.is_active && h.lunch_start && h.lunch_start !== "00:00:00");
            if (withLunch) {
                setGlobalLunchStart(withLunch.lunch_start || "");
                setGlobalLunchEnd(withLunch.lunch_end || "");
            }
        }
    }, [hours]); // Only runs when hours are fetched

    const handleGlobalLunchUpdate = async () => {
        if (!globalLunchStart || !globalLunchEnd) {
            alert("Please set both start and end time for lunch break.");
            return;
        }

        setSaving("global");
        try {
            // Update all working hours with new lunch times
            const updates = hours.map(h => ({
                ...h,
                lunch_start: globalLunchStart,
                lunch_end: globalLunchEnd
            }));

            // Use Promise.all to update in parallel
            await Promise.all(updates.map(h =>
                fetch("/api/admin/working-hours", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(h),
                })
            ));

            // Optimistic update
            setHours(updates);
            alert("Lunch break updated for all days!");
        } catch (error) {
            console.error("Error updating global lunch:", error);
            alert("Failed to update lunch break");
        } finally {
            setSaving(null);
        }
    };

    useEffect(() => {
        fetchHours();
    }, []);

    const fetchHours = async () => {
        try {
            const res = await fetch("/api/admin/working-hours");
            const data = await res.json();
            // Sort by day (starting Monday = 1, Sunday = 0)
            // Let's display Monday first
            const sorted = data.sort((a: WorkingHour, b: WorkingHour) => {
                const dayA = a.day_of_week === 0 ? 7 : a.day_of_week;
                const dayB = b.day_of_week === 0 ? 7 : b.day_of_week;
                return dayA - dayB;
            });
            setHours(sorted);
        } catch (error) {
            console.error("Error fetching hours:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (hour: WorkingHour) => {
        setSaving(hour.id);
        try {
            const res = await fetch("/api/admin/working-hours", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(hour),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to update");
            }

            // Update local state to reflect potentially formatted time from server
            const updated = await res.json();
            setHours((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
        } catch (error: any) {
            console.error("Error updating:", error);
            alert(`Error: ${error.message}`);
        } finally {
            setSaving(null);
        }
    };

    const handleChange = (id: string, field: keyof WorkingHour, value: any) => {
        setHours((prev) =>
            prev.map((h) => {
                if (h.id === id) {
                    return { ...h, [field]: value };
                }
                return h;
            })
        );
    };

    if (loading) {
        return <div className="p-8 text-zinc-400">Loading working hours...</div>;
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <header className="mb-8 flex items-center gap-4">
                <div className="bg-purple-500/10 p-3 rounded-xl border border-purple-500/20">
                    <Clock className="text-purple-500" size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white">Working Hours</h1>
                    <p className="text-zinc-400 mt-1">Configure when clients can book appointments.</p>
                </div>
            </header>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mb-8">
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-zinc-800 bg-zinc-900/50 text-sm font-medium text-zinc-400">
                    <div className="col-span-3">Day</div>
                    <div className="col-span-3">Status</div>
                    <div className="col-span-4">Working Hours</div>
                    <div className="col-span-2 text-right">Actions</div>
                </div>

                <div className="divide-y divide-zinc-800">
                    {hours.map((hour) => (
                        <motion.div
                            key={hour.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={`grid grid-cols-12 gap-4 p-4 items-center transition-colors ${!hour.is_active ? "opacity-50 bg-zinc-900/30" : "hover:bg-zinc-800/30"
                                }`}
                        >
                            <div className="col-span-3 font-medium text-white">
                                {DAYS[hour.day_of_week]}
                            </div>

                            <div className="col-span-3">
                                <button
                                    onClick={() => {
                                        const newVal = !hour.is_active;
                                        handleChange(hour.id, "is_active", newVal);
                                        // Auto-save toggle
                                        handleUpdate({ ...hour, is_active: newVal });
                                    }}
                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${hour.is_active
                                        ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                                        : "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                        }`}
                                >
                                    {hour.is_active ? "Open" : "Closed"}
                                </button>
                            </div>

                            <div className="col-span-4 flex items-center gap-2">
                                <input
                                    type="time"
                                    value={hour.start_time.slice(0, 5)}
                                    onChange={(e) => handleChange(hour.id, "start_time", e.target.value)}
                                    disabled={!hour.is_active}
                                    className="bg-zinc-800 border-zinc-700 border rounded-lg px-2 py-1 text-white text-sm w-full focus:ring-2 focus:ring-purple-500 outline-none disabled:opacity-50"
                                />
                                <span className="text-zinc-500">-</span>
                                <input
                                    type="time"
                                    value={hour.end_time.slice(0, 5)}
                                    onChange={(e) => handleChange(hour.id, "end_time", e.target.value)}
                                    disabled={!hour.is_active}
                                    className="bg-zinc-800 border-zinc-700 border rounded-lg px-2 py-1 text-white text-sm w-full focus:ring-2 focus:ring-purple-500 outline-none disabled:opacity-50"
                                />
                            </div>

                            <div className="col-span-2 flex justify-end">
                                <button
                                    onClick={() => handleUpdate(hour)}
                                    disabled={saving === hour.id}
                                    className="p-2 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-zinc-800"
                                    title="Save changes"
                                >
                                    {saving === hour.id ? (
                                        <div className="w-5 h-5 border-2 border-zinc-500 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Save size={20} />
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Global Lunch Settings Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
                <h2 className="text-xl font-bold text-white mb-2">Configure Lunch Break</h2>
                <p className="text-zinc-400 text-sm mb-6">Set a daily lunch break. This will apply to all open days.</p>

                <div className="flex items-end gap-4 max-w-lg">
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-zinc-500 mb-1">Start Time</label>
                        <input
                            type="time"
                            value={globalLunchStart}
                            onChange={(e) => setGlobalLunchStart(e.target.value)}
                            className="bg-zinc-800 border-zinc-700 border rounded-lg px-4 py-2 text-white w-full focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-zinc-500 mb-1">End Time</label>
                        <input
                            type="time"
                            value={globalLunchEnd}
                            onChange={(e) => setGlobalLunchEnd(e.target.value)}
                            className="bg-zinc-800 border-zinc-700 border rounded-lg px-4 py-2 text-white w-full focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                    </div>
                    <button
                        onClick={handleGlobalLunchUpdate}
                        disabled={saving === "global"}
                        className="bg-white text-black font-semibold px-6 py-2.5 rounded-lg hover:bg-zinc-100 transition disabled:opacity-50"
                    >
                        {saving === "global" ? "Saving..." : "Apply to All Days"}
                    </button>
                </div>
            </div>

            <div className="mt-6 flex items-start gap-3 bg-blue-500/5 border border-blue-500/20 p-4 rounded-xl">
                <AlertCircle className="text-blue-500 shrink-0" size={20} />
                <p className="text-sm text-blue-200">
                    Note: Adjusting the global lunch break will overwrite any existing lunch times for all days.
                </p>
            </div>
        </div>
    );
}
