import { db } from "@/lib/db";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();

        if (!session || !session.user || (session.user.role !== Role.TEACHER && session.user.role !== Role.ADMIN)) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = params;

        // Verify this batch belongs to the teacher (security check)
        // Only if role is TEACHER. Admin can see all.
        if (session.user.role === Role.TEACHER) {
            const batch = await db.batch.findUnique({
                where: { id },
                select: { teacherId: true }
            });

            if (!batch || batch.teacherId !== session.user.id) {
                return new NextResponse("Unauthorized access to batch", { status: 403 });
            }
        }

        // Fetch admissions for this batch, including student details
        const admissions = await db.admission.findMany({
            where: {
                batchId: id,
            },
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true,
                                image: true
                            }
                        }
                    }
                }
            }
        });

        const students = admissions.map(admission => ({
            admissionId: admission.id,
            studentId: admission.student.id,
            name: admission.student.user.name,
            email: admission.student.user.email,
            phone: admission.student.phone,
            parentName: admission.student.fatherName, // Mapped for frontend compatibility
            joinDate: admission.admission_date
        }));

        return NextResponse.json(students);

    } catch (error) {
        console.log("[BATCH_STUDENTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
