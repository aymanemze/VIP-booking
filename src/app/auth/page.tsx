"use client";

import { useState, Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

function AuthPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const serviceIds = searchParams.get("services")?.split(",") || [];
    const date = searchParams.get("date") || "";
    const time = searchParams.get("time") || "";

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleConfirmBooking = async () => {
        if (!name || !phone) {
            setError("Please fill in all fields");
            return;
        }

        setLoading(true);
        setError("");

        try {
            // Create booking via API
            const response = await fetch("/api/book", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    serviceIds,
                    date: date.split("T")[0], // Extract YYYY-MM-DD
                    time,
                    customerName: name,
                    customerPhone: phone,
                    firebaseUid: null, // No longer using Firebase Auth
                }),
            });

            const data = await response.json();

            if (data.success) {
                setSuccess(true);
            } else {
                setError(data.error || "Failed to create booking");
            }
        } catch (err: any) {
            console.error("Error creating booking:", err);
            setError(err.message || "Failed to create booking");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <main className="min-h-screen bg-black text-white p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                >
                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
                    <p className="text-zinc-400 mb-2">
                        Your appointment has been added to the calendar
                    </p>
                    <p className="text-sm text-zinc-500 mb-8">
                        {new Date(date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} at {time}
                    </p>

                    <button
                        onClick={() => router.push("/")}
                        className="bg-white text-black font-semibold px-8 py-3 rounded-full hover:bg-zinc-100 transition"
                    >
                        Back to Home
                    </button>
                </motion.div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-black text-white p-4">
            <header className="mb-6 flex items-center gap-4">
                <button onClick={() => router.back()} className="p-2 hover:bg-zinc-800 rounded-full">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold">Your details</h1>
            </header>

            {error && (
                <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-xl text-red-200">
                    {error}
                </div>
            )}

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
            >
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Phone number</label>
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+212 6XX XXX XXX"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white"
                    />
                    <p className="mt-2 text-xs text-zinc-500">Include country code (e.g., +212 for Morocco)</p>
                </div>

                <button
                    onClick={handleConfirmBooking}
                    disabled={!name || !phone || loading}
                    className="w-full mt-6 bg-white text-black font-semibold py-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-100 transition"
                >
                    {loading ? "Confirming..." : "Confirm Booking"}
                </button>
            </motion.div>
        </main>
    );
}

export default function AuthPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black text-white p-4">Loading...</div>}>
            <AuthPageContent />
        </Suspense>
    );
}
