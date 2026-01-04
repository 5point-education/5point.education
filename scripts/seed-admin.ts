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
    const email = "master_admin@5point.com";
    const password = "masterpassword123";
    const name = "Master Admin";

    console.log(`Seeding Admin: ${email}`);

    // 1. Create User in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role: Role.ADMIN },
    });

    if (error) {
        console.log("Supabase User creation failed/exists:", error.message);

        // Try to find the user if they exist
        const { data: userList, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) {
            console.error("Failed to list users:", listError.message);
            return;
        }

        const existingUser = userList.users.find((u) => u.email === email);

        if (existingUser) {
            console.log(`User ${email} found. Syncing to Prisma...`);
            await syncToPrisma(existingUser.id, email, name);
        } else {
            console.error("User reported as existing but not found in list.");
        }
    } else if (data.user) {
        console.log("Supabase Auth created:", data.user.id);
        await syncToPrisma(data.user.id, email, name);
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
