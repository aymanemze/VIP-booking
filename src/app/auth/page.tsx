"use client";

import { useState, Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { auth } from "@/lib/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";

function AuthPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const serviceIds = searchParams.get("services")?.split(",") || [];
    const date = searchParams.get("date") || "";
    const time = searchParams.get("time") || "";

    const [step, setStep] = useState<"phone" | "otp" | "success">("phone");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

    const setupRecaptcha = () => {
        if (!(window as any).recaptchaVerifier) {
            (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
                size: "invisible",
                callback: () => {
                    // reCAPTCHA solved
                },
            });
        }
    };

    const handleSendOTP = async () => {
        if (!name || !phone) {
            setError("Please fill in all fields");
            return;
        }

        setLoading(true);
        setError("");

        try {
            setupRecaptcha();
            const appVerifier = (window as any).recaptchaVerifier;
            const result = await signInWithPhoneNumber(auth, phone, appVerifier);
            setConfirmationResult(result);
            setStep("otp");
        } catch (err: any) {
            console.error("Error sending OTP:", err);
            setError(err.message || "Failed to send verification code");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!confirmationResult) {
            setError("Please request a verification code first");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const result = await confirmationResult.confirm(otp);
            const user = result.user;

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
                    firebaseUid: user.uid,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setStep("success");
            } else {
                setError(data.error || "Failed to create booking");
            }
        } catch (err: any) {
            console.error("Error verifying OTP:", err);
            setError(err.message || "Invalid verification code");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-black text-white p-4">
            <div id="recaptcha-container"></div>

            <header className="mb-6 flex items-center gap-4">
                <button onClick={() => router.back()} className="p-2 hover:bg-zinc-800 rounded-full">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold">
                    {step === "phone" && "Your details"}
                    {step === "otp" && "Verify phone"}
                    {step === "success" && "Booking confirmed!"}
                </h1>
            </header>

            {error && (
                <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-xl text-red-200">
                    {error}
                </div>
            )}

            {step === "phone" && (
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
                        onClick={handleSendOTP}
                        disabled={!name || !phone || loading}
                        className="w-full mt-6 bg-white text-black font-semibold py-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-100 transition"
                    >
                        {loading ? "Sending..." : "Send verification code"}
                    </button>
                </motion.div>
            )}

            {step === "otp" && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                >
                    <p className="text-zinc-400 mb-4">
                        We sent a 6-digit code to <span className="text-white font-medium">{phone}</span>
                    </p>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Verification code</label>
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            placeholder="000000"
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-center text-2xl tracking-widest placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white"
                            maxLength={6}
                        />
                    </div>

                    <button
                        onClick={handleVerifyOTP}
                        disabled={otp.length !== 6 || loading}
                        className="w-full mt-6 bg-white text-black font-semibold py-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-100 transition"
                    >
                        {loading ? "Verifying..." : "Verify & Book"}
                    </button>

                    <button
                        onClick={() => setStep("phone")}
                        className="w-full text-zinc-400 text-sm hover:text-white transition"
                    >
                        Change phone number
                    </button>
                </motion.div>
            )}

            {step === "success" && (
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
            )}
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
