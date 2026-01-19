// Credentials - Hardcoded for reliable seeding in this environment
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://snrttwsfxaywbguvqpyp.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucnR0d3NmeGF5d2JndXZxcHlwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjEzMDUxNywiZXhwIjoyMDgxNzA2NTE3fQ.mT3PTT7eScUk1OpI4RE-G6JulplYcKoF_01OAWw8zy4";
process.env.DATABASE_URL = "postgresql://postgres.snrttwsfxaywbguvqpyp:SATWIKdey%402002@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=10";

import { createClient } from "@supabase/supabase-js";
import { PrismaClient, Role } from "@prisma/client";

// Credentials
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const prisma = new PrismaClient();

async function main() {
    // Create Master Admin
    const masterEmail = "reception@gmail.com";
    const masterPassword = "123456";
    const masterName = "Reception Desk";

    console.log(`Seeding Reception Desk: ${masterEmail}`);

    // 1. Create Master Admin User in Supabase Auth
    const { data: masterData, error: masterError } = await supabase.auth.admin.createUser({
        email: masterEmail,
        password: masterPassword,
        email_confirm: true,
        user_metadata: { name: masterName, role: Role.RECEPTIONIST },
    });

    if (masterError) {
        console.log("Reception Desk creation failed/exists:", masterError.message);

        // Try to find the user if they exist
        const { data: userList, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) {
            console.error("Failed to list users:", listError.message);
            return;
        }

        const existingUser = userList.users.find((u) => u.email === masterEmail);

        if (existingUser) {
            console.log(`User ${masterEmail} found. Syncing to Prisma...`);
            await syncToPrisma(existingUser.id, masterEmail, masterName);
        } else {
            console.error("User reported as existing but not found in list.");
        }
    } else if (masterData.user) {
        console.log("Master Admin created:", masterData.user.id);
        await syncToPrisma(masterData.user.id, masterEmail, masterName);
    }

    // Create Additional Admin
    const adminEmail = "admin@gmail.com";
    const adminPassword = "123456";
    const adminName = "Admin User";

    console.log(`Seeding Admin: ${adminEmail}`);

    // 2. Create Additional Admin User in Supabase Auth
    const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: { name: adminName, role: Role.ADMIN },
    });

    if (adminError) {
        console.log("Additional Admin creation failed/exists:", adminError.message);

        // Try to find the user if they exist
        const { data: userList, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) {
            console.error("Failed to list users:", listError.message);
            return;
        }

        const existingUser = userList.users.find((u) => u.email === adminEmail);

        if (existingUser) {
            console.log(`User ${adminEmail} found. Syncing to Prisma...`);
            await syncToPrisma(existingUser.id, adminEmail, adminName);
        } else {
            console.error("User reported as existing but not found in list.");
        }
    } else if (adminData.user) {
        console.log("Additional Admin created:", adminData.user.id);
        await syncToPrisma(adminData.user.id, adminEmail, adminName);
    }
}

async function syncToPrisma(id: string, email: string, name: string) {
    try {
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                id: id, // Ensure ID matches (might fail if IDs differ and are foreign keys, but helpful for fresh seed)
                role: Role.ADMIN,
            },
            create: {
                id: id,
                email,
                name,
                role: Role.ADMIN,
            },
        });
        console.log("Prisma User synced:", user);
    } catch (err) {
        console.error("Prisma Error:", err);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
