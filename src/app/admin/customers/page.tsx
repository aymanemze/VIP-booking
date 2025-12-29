"use client";

import { useEffect, useState } from "react";
import { Search, User, Phone, Calendar, Star } from "lucide-react";
import { format } from "date-fns";

interface Customer {
    id: string;
    name: string;
    phone: string;
    total_bookings: number;
    last_visit: string | null;
    is_vip: boolean;
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchCustomers();
        }, 300); // Debounce
        return () => clearTimeout(timeout);
    }, [search]);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/customers${search ? `?search=${search}` : ""}`);
            const data = await res.json();

            if (Array.isArray(data)) {
                setCustomers(data);
            } else {
                console.error("Customers API Error:", data);
                setCustomers([]);
            }
        } catch (error) {
            console.error("Error fetching customers:", error);
            setCustomers([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Customers</h1>
                    <p className="text-zinc-400 mt-1">Manage your client base.</p>
                </div>
            </div>

            {/* Search */}
            <div className="mb-6 relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                <input
                    type="text"
                    placeholder="Search by name or phone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition"
                />
            </div>

            {/* Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-zinc-800 bg-zinc-900/50 text-sm font-medium text-zinc-400">
                    <div className="col-span-4">Customer</div>
                    <div className="col-span-3">Contact</div>
                    <div className="col-span-2 text-center">Bookings</div>
                    <div className="col-span-3 text-right">Last Visit</div>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-zinc-500">Loading customers...</div>
                ) : customers.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500">No customers found.</div>
                ) : (
                    <div className="divide-y divide-zinc-800">
                        {customers.map((customer) => (
                            <div key={customer.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-zinc-800/30 transition-colors">
                                <div className="col-span-4 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <div className="text-white font-medium flex items-center gap-2">
                                            {customer.name}
                                            {customer.is_vip && <Star size={14} className="text-yellow-500 fill-yellow-500" />}
                                        </div>
                                    </div>
                                </div>

                                <div className="col-span-3 text-zinc-400 text-sm flex items-center gap-2">
                                    <Phone size={14} />
                                    {customer.phone}
                                </div>

                                <div className="col-span-2 text-center">
                                    <span className="bg-zinc-800 text-white px-2 py-1 rounded-md text-xs font-medium">
                                        {customer.total_bookings}
                                    </span>
                                </div>

                                <div className="col-span-3 text-right text-zinc-400 text-sm">
                                    {customer.last_visit ? format(new Date(customer.last_visit), "MMM d, yyyy") : "Never"}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
