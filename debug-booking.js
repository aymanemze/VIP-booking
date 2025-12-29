const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envConfig = dotenv.parse(fs.readFileSync(path.resolve(__dirname, '.env.local')));
const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.SUPABASE_SERVICE_ROLE_KEY);

async function debug() {
    console.log("--- DEBUGGING SERVICES ---");
    // 1. Check if services exist
    const { data: services, error: serviceError } = await supabase.from('services').select('*');

    if (serviceError) {
        console.error("CRITICAL: Error fetching services:", serviceError);
        return;
    }

    if (!services || services.length === 0) {
        console.error("CRITICAL: 'services' table is empty! You must run the SQL to insert services.");
        return;
    }

    console.log(`Found ${services.length} services in DB.`);
    console.log("Sample ID:", services[0].id);

    // 2. Simulate Booking Failure (Invalid UUID)
    console.log("\n--- SIMULATING BOOKING WITH ID '1' ---");
    const { error: bookingError } = await supabase.from('appointments').insert({
        customer_name: "Debug User",
        customer_phone: "+1234567890",
        service_id: "1", // This is what the frontend currently sends
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString()
    });

    if (bookingError) {
        console.log("Expected Error (ID '1'):", bookingError.message);
        console.log("CONFIIRED: The frontend is sending '1' but DB expects UUID.");
    } else {
        console.log("Surprise! ID '1' worked?");
    }

    // 3. Output IDs for valid config
    console.log("\n--- VALID IDs FOR CONFIG ---");
    services.forEach(s => {
        console.log(`${s.title}: "${s.id}"`);
    });
}

debug();
