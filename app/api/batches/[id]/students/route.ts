import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createAdminClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user || (user.user_metadata.role !== Role.TEACHER && 
            user.user_metadata.role !== Role.ADMIN && 
            user.user_metadata.role !== Role.RECEPTIONIST)) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = params;

        // Verify this batch belongs to the teacher (security check)
        // Only if role is TEACHER. Admin and Receptionist can see all.
        if (user.user_metadata.role === Role.TEACHER) {
            const batch = await db.batch.findUnique({
                where: { id },
                select: { teacherId: true }
            });

            if (!batch || batch.teacherId !== user.id) {
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
