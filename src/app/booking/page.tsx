"use client";

import { useState, useEffect, Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { services } from "@/data/services";
import { TimeSlot } from "@/types";
import { motion } from "framer-motion";

function BookingPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const serviceIds = searchParams.get("services")?.split(",") || [];

    const selectedServices = services.filter((s) => serviceIds.includes(s.id));
    const totalDuration = selectedServices.reduce((acc, s) => acc + s.duration, 0);
    const totalPrice = selectedServices.reduce((acc, s) => acc + s.price, 0);

    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [loading, setLoading] = useState(false);

    const dates = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i);
        return date;
    });

    // Fetch availability when date changes
    useEffect(() => {
        const fetchAvailability = async () => {
            setLoading(true);
            setSelectedTime(null);

            try {
                const dateStr = selectedDate.toISOString().split("T")[0];
                const response = await fetch(`/api/availability?date=${dateStr}`);
                const data = await response.json();

                if (data.slots) {
                    const slots: TimeSlot[] = data.slots;

                    // Ensure totalDuration is a number (handle potential string issues)
                    const durationNum = Number(totalDuration);
                    const slotsNeeded = Math.ceil(durationNum / 15);

                    console.log(`Debug: Duration=${durationNum}, SlotsNeeded=${slotsNeeded}`);

                    const processedSlots = slots.map((slot, index) => {
                        if (!slot.available) return slot;

                        // If we don't need extra slots, it's available
                        if (slotsNeeded <= 1) return slot;

                        // Check if we have enough consecutive slots
                        let consecutiveSlots = 1; // Start with current slot (already checked available)

                        for (let i = 1; i < slotsNeeded; i++) {
                            const nextSlot = slots[index + i];

                            // 1. Check existence and availability
                            if (!nextSlot || !nextSlot.available || nextSlot.is_lunch) {
                                return { ...slot, available: false, reason: "Insufficient duration" };
                            }

                            // 2. Check strict continuity (15 min gap)
                            const prevSlot = slots[index + i - 1]; // Use previous in chain
                            const [prevH, prevM] = prevSlot.time.split(":").map(Number);
                            const [currH, currM] = nextSlot.time.split(":").map(Number);
                            const prevMinutes = prevH * 60 + prevM;
                            const currMinutes = currH * 60 + currM;

                            if (currMinutes - prevMinutes !== 15) {
                                return { ...slot, available: false, reason: "break in continuity" };
                            }

                            consecutiveSlots++;
                        }

                        return slot;
                    });

                    setTimeSlots(processedSlots);
                }
            } catch (error) {
                console.error("Error fetching availability:", error);
                // Fallback to mock data
                const mockSlots: TimeSlot[] = [];
                for (let hour = 9; hour < 18; hour++) {
                    for (let min = 0; min < 60; min += 15) {
                        const time = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
                        mockSlots.push({ time, available: Math.random() > 0.3 });
                    }
                }
                setTimeSlots(mockSlots);
            } finally {
                setLoading(false);
            }
        };

        fetchAvailability();
    }, [selectedDate, totalDuration]); // Re-run when totalDuration changes

    const isSameDay = (date1: Date, date2: Date) => {
        return date1.toDateString() === date2.toDateString();
    };

    return (
        <main className="min-h-screen bg-black text-white p-4 pb-24">
            <header className="mb-6 flex items-center gap-4">
                <button onClick={() => router.back()} className="p-2 hover:bg-zinc-800 rounded-full">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold">Select time</h1>
            </header>

            {/* Date Selector */}
            <div className="mb-6">
                <h2 className="mb-3 text-sm font-medium text-zinc-400">
                    {selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </h2>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {dates.map((date, idx) => {
                        const isSelected = isSameDay(date, selectedDate);
                        return (
                            <motion.button
                                key={idx}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setSelectedDate(date)}
                                className={`flex-shrink-0 flex flex-col items-center justify-center w-14 h-16 rounded-full transition-all ${isSelected
                                    ? "bg-indigo-600 text-white"
                                    : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                                    }`}
                            >
                                <span className="text-xs">{date.toLocaleDateString("en-US", { weekday: "short" })}</span>
                                <span className="text-lg font-semibold">{date.getDate()}</span>
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Time Slots */}
            <div className="mb-6">
                <h2 className="mb-3 text-sm font-medium text-zinc-400">
                    {loading ? "Loading..." : "Available times"}
                </h2>
                <div className="grid grid-cols-3 gap-3">
                    {timeSlots.map((slot) => {
                        if (slot.is_lunch) {
                            return (
                                <div
                                    key={slot.time}
                                    className="p-3 rounded-xl text-sm font-medium bg-zinc-900/50 text-zinc-600 flex items-center justify-center italic border border-zinc-800/50"
                                >
                                    Lunch
                                </div>
                            );
                        }

                        const isSelected = selectedTime === slot.time;
                        return (
                            <motion.button
                                key={slot.time}
                                whileTap={slot.available ? { scale: 0.95 } : {}}
                                onClick={() => slot.available && setSelectedTime(slot.time)}
                                disabled={!slot.available}
                                className={`p-3 rounded-xl text-sm font-medium transition-all ${!slot.available
                                    ? "bg-zinc-900 text-zinc-600 line-through cursor-not-allowed opacity-50"
                                    : isSelected
                                        ? "bg-white text-black ring-4 ring-white"
                                        : "bg-zinc-900 text-white hover:bg-zinc-800"
                                    }`}
                            >
                                {slot.time}
                            </motion.button>
                        );
                    })}
                </div>
            </div>


            {/* Bottom Bar */}
            {/* Bottom Bar */}
            {selectedTime && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="fixed bottom-6 left-4 right-4"
                >
                    <div className="flex items-center justify-between rounded-full bg-white p-4 pl-6 text-black shadow-lg">
                        <div className="flex flex-col">
                            <span className="text-xs text-zinc-500">MAD {totalPrice}</span>
                            <span className="font-semibold">{selectedServices.length} service • {totalDuration} min</span>
                        </div>
                        <button
                            onClick={() => router.push(`/auth?services=${serviceIds.join(",")}&date=${selectedDate.toISOString()}&time=${selectedTime}`)}
                            className="rounded-full bg-black px-6 py-2 text-sm font-medium text-white transition-transform hover:scale-105"
                        >
                            Continue
                        </button>
                    </div>
                </motion.div>
            )}
        </main>
    );
}

export default function BookingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black text-white p-4">Loading...</div>}>
            <BookingPageContent />
        </Suspense>
    );
}
