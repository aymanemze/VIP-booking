const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envConfig = dotenv.parse(fs.readFileSync(path.resolve(__dirname, '.env.local')));
const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.SUPABASE_SERVICE_ROLE_KEY);

const services = [
    { title: "Haircut", duration: 30, price: 30 },
    { title: "Beard Trim", duration: 25, price: 20 },
    { title: "Hair Wash", duration: 15, price: 10 },
    { title: "Hairdressing", duration: 15, price: 20 },
    { title: "Curly", duration: 10, price: 20 },
    { title: "Kids Haircut", duration: 30, price: 30 }
];

async function seed() {
    console.log("Seeding services...");

    // First, clear existing (optional, but good for clean slate if we had duplicates)
    // Actually safe to just insert

    const { data, error } = await supabase
        .from('services')
        .insert(services)
        .select();

    if (error) {
        console.error("Error seeding:", error);
    } else {
        console.log("Seeded Services:", JSON.stringify(data, null, 2));
    }
}

seed();
