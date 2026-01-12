export interface Service {
    id: string;
    title: string;
    duration: number; // in minutes
    price: number;
    image: string; // URL or path
    category?: 'featured' | 'barbering'; // Optional if we merge them
}

export interface Appointment {
    id: string;
    serviceId: string;
    date: Date;
    timeSlot: string; // e.g. "14:00"
    customerName: string;
    customerPhone: string;
    status: 'pending' | 'confirmed' | 'cancelled';
}

export interface TimeSlot {
    time: string; // "13:45"
    available: boolean;
    is_lunch?: boolean;
    reason?: string;
}
