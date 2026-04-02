import { createClient } from "@supabase/supabase-js";
import { PrismaClient, Role } from "@prisma/client";

// Credentials
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const prisma = new PrismaClient();

async function main() {
    await seedUser("reception@gmail.com", "123456", "Reception Desk", Role.RECEPTIONIST);
    await seedUser("admin@gmail.com", "123456", "Admin User", Role.ADMIN);
}

async function seedUser(email: string, password: string, name: string, role: Role) {
    console.log(`Seeding ${role}: ${email}`);

    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role },
    });

    if (error) {
        console.log(`${role} creation failed/exists:`, error.message);

        const { data: userList, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) {
            console.error("Failed to list users:", listError.message);
            return;
        }

        const existingUser = userList.users.find((u) => u.email === email);

        if (existingUser) {
            console.log(`User ${email} found. Syncing to Prisma...`);
            await syncToPrisma(existingUser.id, email, name, role);
        } else {
            console.error("User reported as existing but not found in list.");
        }
    } else if (data.user) {
        console.log(`${role} created:`, data.user.id);
        await syncToPrisma(data.user.id, email, name, role);
    }
}

async function syncToPrisma(id: string, email: string, name: string, role: Role) {
    try {
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                role, // ✅ correct role update
            },
            create: {
                id,
                email,
                name,
                role,
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