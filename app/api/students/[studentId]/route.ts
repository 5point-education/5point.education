import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

export async function GET(
    _req: Request,
    { params }: { params: { studentId: string } }
) {
    try {
        const { studentId } = params;

        const studentProfile = await db.studentProfile.findUnique({
            where: { id: studentId },
            include: { user: true },
        });

        if (!studentProfile || studentProfile.user.role !== Role.STUDENT) {
            return new NextResponse("Student not found", { status: 404 });
        }

        return NextResponse.json({
            name: studentProfile.user.name,
            email: studentProfile.user.email,
            phone: studentProfile.phone,
            parentName: studentProfile.fatherName,
            gender: studentProfile.gender,
            dob: studentProfile.dob,
            fatherName: studentProfile.fatherName,
            motherName: studentProfile.motherName,
            parentMobile: studentProfile.parentMobile,
            permanentAddress: studentProfile.permanentAddress,
            classLevel: studentProfile.class_level,
            age: studentProfile.age,
            stream: studentProfile.stream,
            board: studentProfile.board,
        });
    } catch (error) {
        console.log("[STUDENT_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: { studentId: string } }
) {
    try {
        const supabase = createAdminClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user || (user.user_metadata.role !== Role.ADMIN && user.user_metadata.role !== Role.RECEPTIONIST)) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { studentId } = params;

        // Find the student profile
        const studentProfile = await db.studentProfile.findUnique({
            where: { id: studentId },
            include: { user: true },
        });

        if (!studentProfile || studentProfile.user.role !== Role.STUDENT) {
            return new NextResponse("Student not found", { status: 404 });
        }

        // Check if student has active admissions
        const activeAdmissions = await db.admission.findMany({
            where: {
                studentId: studentId,
                endDate: null,
                status: 'ACTIVE'
            }
        });

        if (activeAdmissions.length > 0) {
            return new NextResponse("Cannot delete student with active admissions", { status: 400 });
        }

        if (activeAdmissions.length > 0) {
            return new NextResponse("Cannot delete student with active admissions", { status: 400 });
        }

        // Delete the student profile (this will cascade to related records)
        await db.studentProfile.delete({
            where: { id: studentId },
        });

        // Optionally delete the user account
        // await db.user.delete({
        //     where: { id: studentProfile.userId },
        // });

        return NextResponse.json({ message: "Student deleted successfully" });
    } catch (error) {
        console.log("[STUDENT_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

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
        const { name, email, phone, parentName, ...profileFields } = body;

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

        if (profileFields.gender) profileUpdateData.gender = profileFields.gender;
        if (profileFields.dob) profileUpdateData.dob = new Date(profileFields.dob);
        if (profileFields.fatherName) profileUpdateData.fatherName = profileFields.fatherName;
        if (profileFields.motherName) profileUpdateData.motherName = profileFields.motherName;
        if (profileFields.parentMobile) profileUpdateData.parentMobile = profileFields.parentMobile;
        if (profileFields.permanentAddress) profileUpdateData.permanentAddress = profileFields.permanentAddress;
        if (profileFields.classLevel) profileUpdateData.class_level = parseInt(profileFields.classLevel);
        if (profileFields.age) profileUpdateData.age = parseInt(profileFields.age);
        if (profileFields.stream) profileUpdateData.stream = profileFields.stream;
        if (profileFields.board) profileUpdateData.board = profileFields.board;

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
