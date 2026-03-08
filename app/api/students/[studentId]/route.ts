import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

export async function PATCH(
    req: Request,
    { params }: { params: { studentId: string } }
) {
    try {
        const supabase = createAdminClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user || (user.user_metadata.role !== Role.ADMIN && user.user_metadata.role !== Role.RECEPTIONIST)) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { studentId } = params;
        const body = await req.json();
        const { name, email, phone, parentName } = body;

        // studentId is the studentProfile ID, find the associated user
        const studentProfile = await db.studentProfile.findUnique({
            where: { id: studentId },
            include: { user: true },
        });

        if (!studentProfile || studentProfile.user.role !== Role.STUDENT) {
            return new NextResponse("Student not found", { status: 404 });
        }

        const userId = studentProfile.userId;

        // If email is being changed, update it in Supabase Auth first
        if (email !== undefined && email !== studentProfile.user.email) {
            // Check if the new email is already in use
            const existingUser = await db.user.findUnique({
                where: { email },
            });

            if (existingUser) {
                return new NextResponse("A user with this email already exists", { status: 409 });
            }

            const { error: authUpdateError } = await supabase.auth.admin.updateUserById(userId, {
                email,
                email_confirm: true,
            });

            if (authUpdateError) {
                console.error("[STUDENT_PATCH] Supabase Auth email update error:", authUpdateError);
                return new NextResponse(
                    authUpdateError.message || "Failed to update email in authentication",
                    { status: 500 }
                );
            }
        }

        // Build update objects
        const userUpdateData: any = {};
        if (name !== undefined) userUpdateData.name = name;
        if (email !== undefined) userUpdateData.email = email;

        const profileUpdateData: any = {};
        if (phone !== undefined) profileUpdateData.phone = phone;
        if (parentName !== undefined) profileUpdateData.fatherName = parentName;

        // Update user and profile in a transaction
        const result = await db.$transaction(async (tx) => {
            let updatedUser = studentProfile.user;

            if (Object.keys(userUpdateData).length > 0) {
                updatedUser = await tx.user.update({
                    where: { id: userId },
                    data: userUpdateData,
                });
            }

            let updatedProfile = studentProfile;
            if (Object.keys(profileUpdateData).length > 0) {
                updatedProfile = await tx.studentProfile.update({
                    where: { id: studentId },
                    data: profileUpdateData,
                    include: { user: true },
                });
            }

            return { user: updatedUser, profile: updatedProfile };
        });

        return NextResponse.json(result);

    } catch (error) {
        console.log("[STUDENT_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
