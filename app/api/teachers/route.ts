import { db } from "@/lib/db";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

export async function POST(req: Request) {
    try {
        const supabase = createAdminClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        // Only Admin or Receptionist can create teachers
        const userRole = user?.user_metadata?.role as string;
        if (error || !user || (userRole !== Role.ADMIN && userRole !== Role.RECEPTIONIST)) {
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

        // Send password reset email so the teacher can set their own password
        try {
            const origin = req.headers.get("origin") ?? (req.headers.get("x-forwarded-host") ? `https://${req.headers.get("x-forwarded-host")}` : null);
            const redirectTo = origin ? `${origin}/auth/callback?next=/auth/update-password` : undefined;
            const authClient = createClient();
            const { error: resetError } = await authClient.auth.resetPasswordForEmail(email, {
                redirectTo: redirectTo ?? undefined,
            });
            if (resetError) {
                console.warn("[TEACHERS_POST] Password reset email failed:", resetError.message);
            }
        } catch (e) {
            console.warn("[TEACHERS_POST] Password reset email error:", e);
        }

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

export async function PATCH(req: Request) {
    try {
        const supabase = createAdminClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        const userRole = user?.user_metadata?.role as string;
        if (error || !user || (userRole !== Role.ADMIN && userRole !== Role.RECEPTIONIST)) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { id, name, email, qualifications, experience_years, subjects_specialization, isActive } = body;

        if (!id) {
            return new NextResponse("Teacher ID is required", { status: 400 });
        }

        // Check if teacher exists
        const existingTeacher = await db.user.findUnique({
            where: { id },
            include: { teacherProfile: true },
        });

        if (!existingTeacher || existingTeacher.role !== Role.TEACHER) {
            return new NextResponse("Teacher not found", { status: 404 });
        }

        // If email is being changed, update it in Supabase Auth first
        if (email !== undefined && email !== existingTeacher.email) {
            const { error: authUpdateError } = await supabase.auth.admin.updateUserById(id, {
                email,
                email_confirm: true,
            });

            if (authUpdateError) {
                console.error("[TEACHERS_PATCH] Supabase Auth email update error:", authUpdateError);
                return new NextResponse(
                    authUpdateError.message || "Failed to update email in authentication",
                    { status: 500 }
                );
            }
        }

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;

        const profileUpdateData: any = {};
        if (qualifications !== undefined) profileUpdateData.qualifications = qualifications;
        if (experience_years !== undefined) profileUpdateData.experience_years = parseInt(experience_years);
        if (subjects_specialization !== undefined) profileUpdateData.subjects_specialization = subjects_specialization;
        if (isActive !== undefined) profileUpdateData.isActive = isActive;

        // If teacherProfile doesn't exist, create it; otherwise update it
        const teacher = await db.user.update({
            where: { id },
            data: {
                ...updateData,
                teacherProfile: existingTeacher.teacherProfile
                    ? { update: profileUpdateData }
                    : { create: profileUpdateData },
            },
            include: {
                teacherProfile: true,
            },
        });

        return NextResponse.json(teacher);

    } catch (error) {
        console.log("[TEACHERS_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const supabase = createAdminClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        // Only Admin or Receptionist can delete teachers
        const userRole = user?.user_metadata?.role as string;
        if (error || !user || (userRole !== Role.ADMIN && userRole !== Role.RECEPTIONIST)) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { id } = body;

        if (!id) {
            return new NextResponse("Teacher ID is required", { status: 400 });
        }

        // Check if teacher exists
        const existingTeacher = await db.user.findUnique({
            where: { id },
            include: { teacherProfile: true },
        });

        if (!existingTeacher || existingTeacher.role !== Role.TEACHER) {
            return new NextResponse("Teacher not found", { status: 404 });
        }

        // Check if teacher is assigned to any batches
        const assignedBatches = await db.batch.findMany({
            where: { teacherId: id },
            select: { name: true },
        });

        if (assignedBatches.length > 0) {
            const batchNames = assignedBatches.map(b => b.name).join(", ");
            return new NextResponse(
                `Cannot delete teacher. They are assigned to the following batch(es): ${batchNames}. Please reassign or remove them from these batches first.`,
                { status: 400 }
            );
        }

        // Delete from Supabase Auth FIRST (before database)
        // This ensures auth is cleaned up even if database deletion fails
        const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(id);
        if (deleteAuthError) {
            console.error("[TEACHERS_DELETE] Failed to delete from Supabase Auth:", deleteAuthError.message);
            return new NextResponse(
                `Failed to delete teacher authentication: ${deleteAuthError.message}`,
                { status: 500 }
            );
        }

        // Delete from database (this will cascade delete the teacher profile)
        await db.user.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Teacher deleted successfully" });

    } catch (error) {
        console.log("[TEACHERS_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
