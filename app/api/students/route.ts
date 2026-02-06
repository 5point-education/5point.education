import { db } from "@/lib/db";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Role, Board, ServiceType } from "@prisma/client";


export async function POST(req: Request) {
    try {
        const supabase = createAdminClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user || (user.user_metadata.role !== Role.ADMIN && user.user_metadata.role !== Role.RECEPTIONIST)) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const {
            // User Schema fields
            name,
            email,

            // Student Profile fields
            phone,
            gender,
            dob,
            fatherName,
            motherName,
            parentMobile,
            permanentAddress,
            correspondenceAddress,
            aadharNo,
            nationality,

            // Academic & Course Info
            board,
            class_level,
            stream,
            aspirant_of,
            service_type,
            subjects,
            chosen_courses,
            source_of_enquiry,

            // Academic Records (Array)
            academicRecords, // Expecting array of { qualification, exam, year, institution, percentage }
            age // Keeping age if passed, otherwise calculated from DOB usually
        } = body;

        // Check if user exists
        const existingUser = await db.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return new NextResponse("User with this email already exists", { status: 400 });
        }

        // Generate random 6-char password
        // const generatedPassword = Math.random().toString(36).slice(-8);
        const generatedPassword = '123456';

        // 1. Create user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password: generatedPassword,
            email_confirm: true,
            user_metadata: {
                name,
                role: Role.STUDENT,
            },
        });

        if (authError || !authData.user) {
            console.error("Supabase Auth Error:", authError);
            return new NextResponse(authError?.message || "Failed to create user in Supabase", { status: 500 });
        }

        // Transaction to create User and Profile
        const result = await db.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    id: authData.user!.id, // Sync with Supabase Auth ID
                    name,
                    email,
                    role: Role.STUDENT,
                }
            });

            const profile = await tx.studentProfile.create({
                data: {
                    userId: user.id,
                    // Contact
                    phone,
                    parentMobile,

                    // Personal
                    gender: gender as any, // Cast to match Enum
                    dob: dob ? new Date(dob) : null,
                    fatherName,
                    motherName,
                    permanentAddress,
                    correspondenceAddress,
                    aadharNo,
                    nationality,
                    age: age ? parseInt(age) : undefined,

                    // Academic
                    board: board as Board,
                    class_level: class_level ? parseInt(class_level) : undefined,
                    stream,
                    aspirant_of,
                    service_type: service_type as ServiceType,
                    subjects,
                    chosen_courses, // Json
                    source_of_enquiry,

                    // Relations: Create Academic Records
                    academicRecords: academicRecords && Array.isArray(academicRecords) ? {
                        create: academicRecords.map((rec: any) => ({
                            qualification: rec.qualification,
                            exam: rec.exam,
                            year: rec.year,
                            institution: rec.institution,
                            percentage: rec.percentage
                        }))
                    } : undefined
                }
            });

            return { user, profile };
        });

        // Send password reset email so the student can set their own password
        try {
            const origin = req.headers.get("origin") ?? (req.headers.get("x-forwarded-host") ? `https://${req.headers.get("x-forwarded-host")}` : null);
            const redirectTo = origin ? `${origin}/auth/callback?next=/auth/update-password` : undefined;
            const authClient = createClient();
            const { error: resetError } = await authClient.auth.resetPasswordForEmail(email, {
                redirectTo: redirectTo ?? undefined,
            });
            if (resetError) {
                console.warn("[STUDENTS_POST] Password reset email failed:", resetError.message);
            }
        } catch (e) {
            console.warn("[STUDENTS_POST] Password reset email error:", e);
        }

        return NextResponse.json({
            success: true,
            data: result,
            generatedPassword // Important: Return this so Receptionist can see it once
        });


    } catch (error) {
        console.log("[STUDENTS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}


export async function GET(req: Request) {
    try {
        const supabase = createAdminClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user || (user.user_metadata.role !== Role.ADMIN && user.user_metadata.role !== Role.RECEPTIONIST)) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const users = await db.user.findMany({
            where: {
                role: Role.STUDENT
            },
            include: {
                studentProfile: {
                    include: {
                        admissions: {
                            include: {
                                batch: {
                                    select: {
                                        id: true,
                                        name: true,
                                        subject: true,
                                        isActive: true
                                    }
                                }
                            },
                            where: {
                                status: 'ACTIVE'
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        const formattedStudents = users
            .filter(u => u.studentProfile) // Only return users with a profile
            .map(u => ({
                admissionId: "N/A",
                studentId: u.studentProfile!.id,
                userId: u.id,
                name: u.name,
                email: u.email,
                phone: u.studentProfile!.phone,
                parentName: u.studentProfile!.fatherName,
                joinDate: u.createdAt,
                isActive: u.is_active,
                batches: u.studentProfile!.admissions
                    .filter(adm => adm.batch)
                    .map(adm => ({
                        id: adm.batch!.id,
                        name: adm.batch!.name,
                        subject: adm.batch!.subject,
                        isActive: adm.batch!.isActive
                    }))
            }));

        return NextResponse.json(formattedStudents);

    } catch (error) {
        console.log("[STUDENTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const supabase = createAdminClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user || (user.user_metadata.role !== Role.ADMIN && user.user_metadata.role !== Role.RECEPTIONIST)) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { studentId, isActive } = body;

        if (!studentId) {
            return new NextResponse("Student ID is required", { status: 400 });
        }

        // We receive studentId (profile ID), need to find the user ID
        const studentProfile = await db.studentProfile.findUnique({
            where: { id: studentId },
            select: { userId: true }
        });

        if (!studentProfile) {
            return new NextResponse("Student not found", { status: 404 });
        }

        // Update User active status
        const updatedUser = await db.user.update({
            where: { id: studentProfile.userId },
            data: { is_active: isActive }
        });

        // Sync with Supabase Auth (Ban/Unban)
        try {
            if (isActive) {
                // Enable: Remove ban
                await supabase.auth.admin.updateUserById(studentProfile.userId, {
                    ban_duration: "none"
                });
            } else {
                // Disable: Ban for 100 years
                await supabase.auth.admin.updateUserById(studentProfile.userId, {
                    ban_duration: "876600h" // ~100 years
                });
            }
        } catch (authError) {
            console.error("Failed to sync auth status:", authError);
            // We continue even if auth sync fails, though ideally we should handle this better
        }

        return NextResponse.json(updatedUser);

    } catch (error) {
        console.log("[STUDENTS_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
