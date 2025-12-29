"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { services } from "@/data/services";
import { Service } from "@/types";
import { ServiceCard } from "@/components/ui/ServiceCard";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);

  const toggleService = (service: Service) => {
    setSelectedServices((prev) => {
      const isSelected = prev.some((s) => s.id === service.id);
      if (isSelected) {
        return prev.filter((s) => s.id !== service.id);
      } else {
        return [...prev, service];
      }
    });
  };

  const handleContinue = () => {
    const serviceIds = selectedServices.map((s) => s.id).join(",");
    router.push(`/booking?services=${serviceIds}`);
  };

  return (
    <main className="min-h-screen bg-black text-white p-4 pb-24">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">Official Booking – Ahmed El Mrabet Barber</h1>
      </header>

      <div className="grid grid-cols-2 gap-4">
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            selected={selectedServices.some((s) => s.id === service.id)}
            onSelect={toggleService}
          />
        ))}
      </div>

      {/* Sticky Bottom Notification/Button */}
      <AnimatePresence>
        {selectedServices.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-4 right-4"
          >
            <div className="flex items-center justify-between rounded-full bg-white p-4 pl-6 text-black shadow-lg">
              <div className="flex flex-col">
                <span className="font-semibold">{selectedServices.length} selected</span>
                <span className="text-xs text-zinc-500">
                  {selectedServices.reduce((acc, s) => acc + s.price, 0)} MAD • {selectedServices.reduce((acc, s) => acc + s.duration, 0)} min
                </span>
              </div>
              <button
                onClick={handleContinue}
                className="flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition-transform hover:scale-105"
              >
                Continue <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
