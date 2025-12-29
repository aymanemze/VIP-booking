"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
    Calendar,
    Users,
    Clock,
    Settings,
    LayoutDashboard,
    LogOut,
    Menu,
    X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(true);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Skip layout for login page
    if (pathname === "/admin/login") {
        return children;
    }

    const navigation = [
        { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
        { name: "Calendar", href: "/admin/calendar", icon: Calendar },
        { name: "Customers", href: "/admin/customers", icon: Users },
        { name: "Working Hours", href: "/admin/working-hours", icon: Clock },
        { name: "Settings", href: "/admin/settings", icon: Settings },
    ];

    const handleLogout = async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        router.push("/admin/login");
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col lg:flex-row">

            {/* Mobile Header */}
            <header className="lg:hidden flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900">
                <div className="font-bold text-lg">Admin Panel</div>
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 text-zinc-400 hover:text-white"
                >
                    <Menu size={24} />
                </button>
            </header>

            {/* Sidebar (Desktop: Static, Mobile: Drawer) */}
            <AnimatePresence mode="wait">
                {(isSidebarOpen || !isMobile) && (
                    <>
                        {/* Mobile Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsSidebarOpen(false)}
                            className={`fixed inset-0 bg-black/80 z-40 lg:hidden ${isSidebarOpen ? "block" : "hidden"}`}
                        />

                        <motion.aside
                            initial={{ x: -300 }}
                            animate={{ x: 0 }}
                            exit={{ x: -300 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className={`
                                fixed lg:static inset-y-0 left-0 z-50 w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col
                                ${isSidebarOpen ? "flex" : "hidden lg:flex"}
                            `}
                        >
                            <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                                <div>
                                    <h1 className="text-xl font-bold">Admin Panel</h1>
                                    <p className="text-sm text-zinc-400 mt-1">Barber Booking</p>
                                </div>
                                <button
                                    onClick={() => setIsSidebarOpen(false)}
                                    className="lg:hidden text-zinc-400 hover:text-white"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                                {navigation.map((item) => {
                                    const isActive = pathname === item.href;
                                    const Icon = item.icon;

                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={() => setIsSidebarOpen(false)} // Close on navigate (mobile)
                                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive
                                                ? "bg-white text-black"
                                                : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                                                }`}
                                        >
                                            <Icon size={20} />
                                            <span className="font-medium">{item.name}</span>
                                        </Link>
                                    );
                                })}
                            </nav>

                            <div className="p-4 border-t border-zinc-800">
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors w-full"
                                >
                                    <LogOut size={20} />
                                    <span className="font-medium">Logout</span>
                                </button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 overflow-auto h-[calc(100vh-65px)] lg:h-screen">
                {children}
            </main>
        </div>
    );
}
