const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const envConfig = dotenv.parse(fs.readFileSync(path.resolve(__dirname, '.env.local')));
const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.SUPABASE_SERVICE_ROLE_KEY);

async function debugLogin() {
    console.log("--- DEBUGGING LOGIN ---");

    // 1. Fetch Setting
    const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'admin_password_hash')
        .maybeSingle();

    if (error) {
        console.error("DB Error:", error.message);
        return;
    }

    if (!data) {
        console.error("❌ No 'admin_password_hash' found in settings table!");
        console.log("This means the migration script didn't insert the password.");
        return;
    }

    console.log("Found Setting:", JSON.stringify(data, null, 2));

    const storedHash = data.value.hash;
    console.log("Stored Hash:", storedHash);

    const testPass = "admin123";
    console.log(`Comparing '${testPass}' with stored hash...`);

    const isValid = await bcrypt.compare(testPass, storedHash);

    if (isValid) {
        console.log("✅ Password 'admin123' IS VALID locally. The issue might be in network/API?");
    } else {
        console.log("❌ Password 'admin123' IS INVALID against stored hash.");
        console.log("Generating new hash for 'admin123'...");
        const newHash = await bcrypt.hash(testPass, 10);
        console.log("New Hash to use:", newHash);
    }
}

debugLogin();
