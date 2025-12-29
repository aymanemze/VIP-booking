const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envConfig = dotenv.parse(fs.readFileSync(path.resolve(__dirname, '.env.local')));
const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.SUPABASE_SERVICE_ROLE_KEY);

async function checkTables() {
    console.log("--- CHECKING TABLES ---");

    // Check Services
    const { error: sError } = await supabase.from('services').select('id').limit(1);
    console.log("Services Table:", sError ? "MISSING" : "EXISTS");

    // Check Customers
    const { error: cError } = await supabase.from('customers').select('id').limit(1);
    console.log("Customers Table:", cError ? "MISSING" : "EXISTS");

    // Check Appointments
    const { error: aError } = await supabase.from('appointments').select('id').limit(1);
    console.log("Appointments Table:", aError ? "MISSING" : "EXISTS");

    // Check Working Hours
    const { error: wError } = await supabase.from('working_hours').select('id').limit(1);
    console.log("Working Hours Table:", wError ? "MISSING" : "EXISTS");

    // Check Blocked Times
    const { error: bError } = await supabase.from('blocked_times').select('id').limit(1);
    console.log("Blocked Times Table:", bError ? "MISSING" : "EXISTS");

    // Check Settings
    const { error: settError } = await supabase.from('settings').select('id').limit(1);
    console.log("Settings Table:", settError ? "MISSING" : "EXISTS");
}

checkTables();
