"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";

export default function AdminLoginPage() {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });

            const data = await response.json();

            if (data.success) {
                router.push("/admin/dashboard");
            } else {
                setError("Invalid password");
            }
        } catch (err) {
            setError("Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
                    <div className="flex items-center justify-center mb-8">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                            <Lock className="text-black" size={32} />
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold text-white text-center mb-2">Admin Login</h1>
                    <p className="text-zinc-400 text-center mb-8">Enter your password to continue</p>

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-xl text-red-200 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter admin password"
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white"
                                autoFocus
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!password || loading}
                            className="w-full bg-white text-black font-semibold py-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-100 transition"
                        >
                            {loading ? "Logging in..." : "Login"}
                        </button>
                    </form>

                    <p className="text-xs text-zinc-500 text-center mt-6">
                        Barber Booking Admin Panel
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
