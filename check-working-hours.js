const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envConfig = dotenv.parse(fs.readFileSync(path.resolve(__dirname, '.env.local')));
const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
    console.log("Checking working_hours table structure...");

    // Attempt to select the new columns. If they don't exist, this should error or return nothing.
    const { data, error } = await supabase
        .from('working_hours')
        .select('id, lunch_start, lunch_end')
        .limit(1);

    if (error) {
        console.error("❌ Error selecting lunch columns:", error.message);
        console.log("This means the columns 'lunch_start' and 'lunch_end' likely DO NOT EXIST.");
    } else {
        console.log("✅ Columns exist! Sample data:", data);
    }
}

checkSchema();
