const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envConfig = dotenv.parse(fs.readFileSync(path.resolve(__dirname, '.env.local')));
const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.SUPABASE_SERVICE_ROLE_KEY);

async function checkStatus() {
    console.log("--- CHECKING DB STATUS ---");

    // 1. Check Service IDs
    const { data: services, error: serviceError } = await supabase.from('services').select('id, title');
    if (serviceError) {
        console.error("Services Error:", serviceError.message);
    } else {
        const haircut = services.find(s => s.title === 'Haircut');
        if (haircut) {
            console.log(`Haircut ID: ${haircut.id}`);
            const expected = "2fe91aac-69d9-4cd4-9662-7c6096655d3a";
            if (haircut.id === expected) {
                console.log("✅ Service IDs MATCH configuration.");
            } else {
                console.error(`❌ Service ID MISMATCH. Expected ${expected}, got ${haircut.id}`);
            }
        } else {
            console.error("❌ 'Haircut' service not found.");
        }
    }

    // 2. Check Appointments Schema
    // We try to select customer_name. If it fails, column is missing.
    const { error: colError } = await supabase.from('appointments').select('customer_name').limit(1);
    if (colError) {
        console.error(`❌ Appointments Table Issue: ${colError.message}`);
    } else {
        console.log("✅ Appointments table has 'customer_name' column.");
    }
}

checkStatus();
