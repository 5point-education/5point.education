import { db } from "@/lib/db";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { Role, Board, ServiceType } from "@prisma/client";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const session = await auth();

        if (!session || !session.user || (session.user.role !== Role.ADMIN && session.user.role !== Role.RECEPTIONIST)) {
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
        const generatedPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(generatedPassword, 10);

        // Transaction to create User and Profile
        const result = await db.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    name,
                    email,
                    password_hash: hashedPassword,
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
