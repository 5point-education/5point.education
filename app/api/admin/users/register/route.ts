import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.nativeEnum(Role),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validatedFields = registerSchema.safeParse(body);

        if (!validatedFields.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Please fix the errors below.",
                    errors: validatedFields.error.flatten().fieldErrors,
                },
                { status: 400 }
            );
        }

        const { name, email, password, role } = validatedFields.data;

        // 1. Check if user already exists in Prisma (to fail fast)
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                {
                    success: false,
                    message: "User with this email already exists in the database.",
                },
                { status: 409 }
            );
        }

        // 2. Create user in Supabase Auth
        const supabase = createAdminClient();
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                name,
                role,
            },
        });

        if (authError) {
            console.error("Supabase Auth Error:", authError);
            return NextResponse.json(
                {
                    success: false,
                    message: authError.message,
                },
                { status: 500 }
            );
        }

        if (!authData.user) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Failed to create user in Supabase.",
                },
                { status: 500 }
            );
        }

        // 3. Create user in Prisma Database
        await prisma.user.create({
            data: {
                id: authData.user.id, // VITAL: Sync UUID
                email,
                name,
                role,
                image: null,
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: `User ${name} created successfully as ${role}.`,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Registration Error:", error);
        return NextResponse.json(
            {
                success: false,
                message: "An unexpected error occurred during registration.",
            },
            { status: 500 }
        );
    }
}
