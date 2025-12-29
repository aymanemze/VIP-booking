const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envConfig = dotenv.parse(fs.readFileSync(path.resolve(__dirname, '.env.local')));
const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
    console.log("Checking Appointments Columns...");
    // trick to get columns: select ONE row
    const { data, error } = await supabase.from('appointments').select('*').limit(1);

    if (error) {
        console.error("Error:", error);
    } else {
        if (data.length === 0) {
            // If empty, we can't see keys nicely, but usually error happens on select if column missing?
            // Actually, select * works even if columns are named differently.
            // Let's try to insert a dummy row that we know will fail constraints but check columns
        }
        console.log("Success! Columns likely exist (or we would get error on select *).");
        // But to be sure, let's try to select specific columns we care about
        const { error: colError } = await supabase.from('appointments').select('customer_name, service_id').limit(1);
        if (colError) {
            console.error("COLUMN MISSING:", colError.message);
        } else {
            console.log("Columns 'customer_name' and 'service_id' verified.");
        }
    }
}

checkSchema();
