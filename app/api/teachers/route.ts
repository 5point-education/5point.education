import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

export async function POST(req: Request) {
    try {
        const supabase = createAdminClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        // Only Admin or Receptionist can create teachers
        if (error || !user || (user.user_metadata.role !== Role.ADMIN && user.user_metadata.role !== Role.RECEPTIONIST)) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { name, email, password, qualifications, experience_years, subjects_specialization } = body;

        if (!name || !email || !password || !qualifications || !experience_years || !subjects_specialization) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const existingUser = await db.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return new NextResponse("User already exists", { status: 409 });
        }

        // Create user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                name,
                role: Role.TEACHER,
            },
        });

        if (authError || !authData.user) {
            console.error("Supabase Auth Error:", authError);
            return new NextResponse(authError?.message || "Failed to create user in Supabase", { status: 500 });
        }

        const teacher = await db.user.create({
            data: {
                id: authData.user.id,
                name,
                email,
                role: Role.TEACHER,
                teacherProfile: {
                    create: {
                        qualifications,
                        experience_years: parseInt(experience_years),
                        subjects_specialization,
                    },
                },
            },
        });

        return NextResponse.json(teacher);

    } catch (error) {
        console.log("[TEACHERS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const supabase = createAdminClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const teachers = await db.user.findMany({
            where: {
                role: Role.TEACHER,
            },
            include: {
                teacherProfile: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(teachers);

    } catch (error) {
        console.log("[TEACHERS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
