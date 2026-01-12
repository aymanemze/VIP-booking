const services = [
    { id: "1", duration: 30 },
    { id: "2", duration: 15 }
];

// Mock selected services: 45 mins total
const selectedServices = services;
const totalDuration = selectedServices.reduce((acc, s) => acc + s.duration, 0);
const slotsNeeded = Math.ceil(totalDuration / 15);

console.log(`Total Duration: ${totalDuration}`);
console.log(`Slots Needed: ${slotsNeeded}`);

// Mock slots: 09:00 to 10:00 available
const slots = [
    { time: "09:00", available: true, is_lunch: false },
    { time: "09:15", available: true, is_lunch: false },
    { time: "09:30", available: true, is_lunch: false },
    { time: "09:45", available: true, is_lunch: false }, // 3 slots from here? 9:45, 10:00 (missing), ... failure expected
    { time: "10:00", available: false, is_lunch: false }, // Booked
    { time: "10:15", available: true, is_lunch: false },
];

console.log("--- Processing Slots ---");

const processedSlots = slots.map((slot, index) => {
    if (!slot.available) return slot;

    // Check if we have enough consecutive slots
    let consecutiveSlots = 0;
    for (let i = 0; i < slotsNeeded; i++) {
        const nextSlot = slots[index + i];
        // Check if next slot exists, is available, and is not a lunch break
        if (nextSlot && nextSlot.available && !nextSlot.is_lunch) {
            // Also check if slots are consecutive in time
            if (i > 0) {
                const prevSlot = slots[index + i - 1];
                const [prevH, prevM] = prevSlot.time.split(":").map(Number);
                const [currH, currM] = nextSlot.time.split(":").map(Number);
                const prevTime = prevH * 60 + prevM;
                const currTime = currH * 60 + currM;

                if (currTime - prevTime === 15) {
                    consecutiveSlots++;
                } else {
                    console.log(`[Slot ${slot.time}] Break in continuity at i=${i}: ${prevSlot.time} -> ${nextSlot.time}`);
                }
            } else {
                consecutiveSlots++;
            }
        } else {
            console.log(`[Slot ${slot.time}] Failed at i=${i} (avail=${nextSlot?.available})`);
        }
    }

    if (consecutiveSlots < slotsNeeded) {
        console.log(`[Slot ${slot.time}] Unavailable: ${consecutiveSlots}/${slotsNeeded} consecutive`);
        return { ...slot, available: false, reason: "Insufficient duration" };
    }

    console.log(`[Slot ${slot.time}] AVAILABLE`);
    return slot;
});

// console.log(JSON.stringify(processedSlots, null, 2));
