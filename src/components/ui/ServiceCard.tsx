"use client";

import { Service } from "@/types";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

interface ServiceCardProps {
    service: Service;
    selected: boolean;
    onSelect: (service: Service) => void;
}

export function ServiceCard({ service, selected, onSelect }: ServiceCardProps) {
    return (
        <motion.div
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(service)}
            className={cn(
                "relative aspect-square cursor-pointer overflow-hidden rounded-2xl bg-zinc-900 transition-all",
                selected ? "ring-4 ring-white" : "opacity-90 hover:opacity-100"
            )}
        >
            {/* Background Image */}
            <img
                src={service.image}
                alt={service.title}
                className="absolute inset-0 h-full w-full object-cover -z-10"
            />

            {/* Black Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

            {/* Content */}
            <div className="absolute bottom-0 left-0 p-4">
                <h3 className="font-semibold text-white">{service.title}</h3>
                <p className="text-sm text-zinc-300">
                    {service.duration} min • MAD {service.price}
                </p>
            </div>

            {/* Seletion Indicator */}
            {selected && (
                <div className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-white text-black">
                    <Check size={14} strokeWidth={3} />
                </div>
            )}
        </motion.div>
    );
}
