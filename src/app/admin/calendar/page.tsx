"use client";

import { useEffect, useState } from "react";
import {
    format,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    addWeeks,
    subWeeks,
    isSameDay,
    parseISO,
    differenceInMinutes,
} from "date-fns";
import { ChevronLeft, ChevronRight, Clock, Ban, Lock } from "lucide-react";
import { motion } from "framer-motion";

interface Appointment {
    id: string;
    customer_name: string;
    start_time: string;
    end_time: string;
    status: string;
    services: {
        title: string;
        price: number;
    };
}

interface BlockedTime {
    id: string;
    start_time: string;
    end_time: string;
    reason: string;
}

const START_HOUR = 9;
const END_HOUR = 21; // 9 PM
const HOUR_HEIGHT = 80; // px per hour

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
    const [loading, setLoading] = useState(true);
    const [isBlockMode, setIsBlockMode] = useState(false);
    const [now, setNow] = useState<Date | null>(null);

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
    const timeSlots = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

    useEffect(() => {
        setNow(new Date());
        const interval = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        fetchData();
    }, [currentDate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const start = weekStart.toISOString();
            const end = weekEnd.toISOString();

            // Fetch Appointments
            const aptRes = await fetch(`/api/admin/appointments?start=${start}&end=${end}`);
            const aptData = await aptRes.json();

            if (Array.isArray(aptData)) {
                setAppointments(aptData);
            } else {
                setAppointments([]);
            }

            // Fetch Blocked Times
            const blockRes = await fetch(`/api/admin/blocked-times?start=${start}&end=${end}`);
            const blockData = await blockRes.json();

            if (Array.isArray(blockData)) {
                setBlockedTimes(blockData);
            } else {
                setBlockedTimes([]);
            }

        } catch (error) {
            console.error("Error fetching calendar data:", error);
            setAppointments([]);
            setBlockedTimes([]);
        } finally {
            setLoading(false);
        }
    };

    const blockTimeSlot = async (day: Date, hour: number) => {
        if (!isBlockMode) return;

        // Define block range
        const start = new Date(day);
        start.setHours(hour, 0, 0, 0);
        const end = new Date(start);
        end.setHours(hour + 1);

        const confirmBlock = window.confirm(`Block time ${format(start, "HH:mm")} - ${format(end, "HH:mm")}?`);
        if (!confirmBlock) return;

        try {
            const res = await fetch("/api/admin/block-time", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    start_time: start.toISOString(),
                    end_time: end.toISOString(),
                    reason: "Admin Blocked"
                }),
            });

            if (res.ok) {
                fetchData(); // Refresh
            } else {
                alert("Failed to block time");
            }
        } catch (error) {
            console.error("Error blocking time:", error);
        }
    };

    const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
    const prevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
    const goToToday = () => setCurrentDate(new Date());

    // Filter items for a specific day
    const getDayAppointments = (day: Date) => {
        return appointments.filter(apt => isSameDay(parseISO(apt.start_time), day));
    };

    const getDayBlockedTimes = (day: Date) => {
        return blockedTimes.filter(block => isSameDay(parseISO(block.start_time), day));
    };

    // Calculate position and height
    const getItemStyle = (startStr: string, endStr: string) => {
        const start = parseISO(startStr);
        const end = parseISO(endStr);

        const startMinutes = start.getHours() * 60 + start.getMinutes();
        const startOffset = startMinutes - (START_HOUR * 60);
        const duration = differenceInMinutes(end, start);

        return {
            top: `${(startOffset / 60) * HOUR_HEIGHT}px`,
            height: `${(duration / 60) * HOUR_HEIGHT}px`,
        };
    };

    return (
        <div className="h-full flex flex-col bg-black text-white p-2 md:p-6">
            {/* Header Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold whitespace-nowrap">
                        {format(weekStart, "MMMM yyyy")}
                    </h1>
                    <div className="flex items-center gap-1 bg-zinc-900 rounded-lg p-1 border border-zinc-800 shadow-sm">
                        <button onClick={prevWeek} className="p-1.5 hover:bg-zinc-800 rounded-md transition text-zinc-400 hover:text-white">
                            <ChevronLeft size={18} />
                        </button>
                        <button onClick={goToToday} className="px-3 py-1.5 text-xs font-semibold hover:bg-zinc-800 rounded-md transition text-zinc-300 hover:text-white uppercase tracking-wider">
                            Today
                        </button>
                        <button onClick={nextWeek} className="p-1.5 hover:bg-zinc-800 rounded-md transition text-zinc-400 hover:text-white">
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-xs text-zinc-500 mr-2">
                        <div className="w-3 h-3 rounded bg-purple-600/20 border border-purple-500/50"></div>
                        <span>Booked</span>
                        <div className="w-3 h-3 rounded bg-zinc-800 border border-zinc-600 ml-2"></div>
                        <span>Blocked</span>
                    </div>
                    <button
                        onClick={() => setIsBlockMode(!isBlockMode)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm font-medium border ${isBlockMode
                            ? "bg-red-500/10 border-red-500/50 text-red-500"
                            : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
                            }`}
                    >
                        <Ban size={16} />
                        {isBlockMode ? "Exit Block Mode" : "Block Time"}
                    </button>
                </div>
            </div>

            {/* Calendar Container - Handles Scroll */}
            <div className="flex-1 bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col relative">

                {/* Scrollable Area for Grid */}
                <div className="flex-1 overflow-auto">
                    <div className="min-w-[1000px] relative">

                        {/* Sticky Header Row */}
                        <div className="sticky top-0 z-40 flex border-b border-zinc-800 bg-zinc-950 shadow-sm">
                            {/* Sticky Time Corner */}
                            <div className="w-20 sticky left-0 z-50 bg-zinc-950 border-r border-zinc-800 flex-shrink-0"></div>

                            {/* Day Headers */}
                            <div className="flex-1 grid grid-cols-7 divide-x divide-zinc-800">
                                {weekDays.map((day) => (
                                    <div
                                        key={day.toString()}
                                        className={`p-3 text-center transition-colors ${isSameDay(day, new Date()) ? "bg-purple-900/10" : ""
                                            }`}
                                    >
                                        <div className="text-xs font-semibold text-zinc-500 uppercase mb-1">
                                            {format(day, "EEE")}
                                        </div>
                                        <div className={`text-lg font-bold ${isSameDay(day, new Date()) ? "text-purple-400" : "text-white"
                                            }`}>
                                            {format(day, "d")}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Main Grid Body */}
                        <div className="flex">

                            {/* Time Column (Sticky Left) */}
                            <div className="w-20 sticky left-0 z-30 bg-zinc-900/80 backdrop-blur-sm border-r border-zinc-800 flex-shrink-0">
                                <div style={{ height: (END_HOUR - START_HOUR + 1) * HOUR_HEIGHT }} className="relative">
                                    {timeSlots.map(hour => (
                                        <div
                                            key={hour}
                                            className="absolute w-full text-center text-xs text-zinc-500 font-mono -translate-y-1/2"
                                            style={{ top: (hour - START_HOUR) * HOUR_HEIGHT }}
                                        >
                                            {hour}:00
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Days Columns */}
                            <div className="flex-1 grid grid-cols-7 divide-x divide-zinc-800 relative bg-zinc-900/20">
                                {/* Horizontal Guidelines (Global) */}
                                <div className="absolute inset-0 z-0 pointer-events-none">
                                    {timeSlots.map(hour => (
                                        <div
                                            key={hour}
                                            className="absolute w-full border-t border-zinc-800/30"
                                            style={{ top: (hour - START_HOUR) * HOUR_HEIGHT }}
                                        />
                                    ))}
                                </div>

                                {weekDays.map((day) => (
                                    <div key={day.toString()} className="relative z-10 group min-h-[960px]">
                                        {/* Clickable Time Slots for Blocking */}
                                        {timeSlots.map(hour => (
                                            <div
                                                key={hour}
                                                onClick={() => blockTimeSlot(day, hour)}
                                                className={`absolute w-full h-[80px] z-10 ${isBlockMode
                                                        ? "hover:bg-red-500/10 cursor-pointer"
                                                        : ""
                                                    }`}
                                                style={{ top: (hour - START_HOUR) * HOUR_HEIGHT }}
                                            >
                                                {isBlockMode && (
                                                    <div className="hidden group-hover:flex items-center justify-center h-full text-red-500/40 text-xs font-medium uppercase tracking-widest">
                                                        Block
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {/* Blocked Times Layer */}
                                        {getDayBlockedTimes(day).map(block => (
                                            <div
                                                key={block.id}
                                                className="absolute left-1 right-1 rounded bg-zinc-800 border-l-2 border-l-red-500 border-y border-r border-zinc-700 p-2 flex flex-col justify-center gap-1 z-20 shadow-sm cursor-not-allowed overflow-hidden"
                                                style={getItemStyle(block.start_time, block.end_time)}
                                            >
                                                <div className="flex items-center gap-1.5 text-zinc-400">
                                                    <Lock size={12} />
                                                    <span className="text-[10px] font-bold uppercase tracking-wide">Blocked</span>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Appointments Layer */}
                                        {getDayAppointments(day).map(apt => (
                                            <motion.div
                                                key={apt.id}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="absolute left-1 right-1 rounded-md bg-purple-600/10 border-l-2 border-l-purple-500 border-y border-r border-purple-500/20 p-2 z-30 shadow-sm hover:shadow-md hover:bg-purple-600/20 transition-all cursor-pointer overflow-hidden group/card"
                                                style={getItemStyle(apt.start_time, apt.end_time)}
                                            >
                                                <div className="flex flex-col h-full gap-0.5">
                                                    <span className="font-semibold text-xs text-purple-100 truncate group-hover/card:whitespace-normal leading-tight">
                                                        {apt.customer_name}
                                                    </span>
                                                    <div className="flex items-center gap-1 text-[10px] text-purple-300/80">
                                                        <Clock size={10} />
                                                        <span>
                                                            {format(parseISO(apt.start_time), "HH:mm")} - {format(parseISO(apt.end_time), "HH:mm")}
                                                        </span>
                                                    </div>
                                                    {Number(apt.services?.price) > 0 && (
                                                        <div className="mt-auto text-[10px] text-purple-400 font-mono">
                                                            {apt.services.price} MAD
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}

                                        {/* Red Current Time Line */}
                                        {now && isSameDay(day, now) && (
                                            <div
                                                className="absolute w-full border-t border-red-500 z-50 pointer-events-none flex items-center"
                                                style={{
                                                    top: ((now.getHours() * 60 + now.getMinutes()) - (START_HOUR * 60)) / 60 * HOUR_HEIGHT
                                                }}
                                            >
                                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full -ml-0.5" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
