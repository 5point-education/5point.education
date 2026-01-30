import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

/**
 * GET /api/teacher/students
 * Returns all students enrolled in any of the current teacher's batches.
 * Used when teacher selects "All Students" on the students page.
 */
export async function GET(req: Request) {
    try {
        const supabase = createAdminClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user || user.user_metadata.role !== Role.TEACHER) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const teacherBatchIds = await db.batch.findMany({
            where: { teacherId: user.id },
            select: { id: true, name: true, subject: true, isActive: true },
        });
        const batchIdSet = new Set(teacherBatchIds.map((b) => b.id));

        if (batchIdSet.size === 0) {
            return NextResponse.json([]);
        }

        const admissions = await db.admission.findMany({
            where: {
                batchId: { in: Array.from(batchIdSet) },
                status: "ACTIVE",
            },
            include: {
                student: {
                    include: {
                        user: {
                            select: { name: true, email: true },
                        },
                    },
                },
                batch: {
                    select: { id: true, name: true, subject: true, isActive: true },
                },
            },
        });

        // Group by student: one row per student with all their batches (from teacher's batches)
        const byStudent = new Map<
            string,
            {
                admissionId: string;
                studentId: string;
                name: string;
                email: string;
                phone: string;
                parentName: string | null;
                joinDate: string;
                batches: { id: string; name: string; subject: string; isActive: boolean }[];
            }
        >();

        for (const adm of admissions) {
            if (!adm.batch || !adm.student?.user) continue;
            const sid = adm.student.id;
            const existing = byStudent.get(sid);
            const batchInfo = {
                id: adm.batch.id,
                name: adm.batch.name,
                subject: adm.batch.subject,
                isActive: adm.batch.isActive,
            };

            if (existing) {
                if (!existing.batches.some((b) => b.id === batchInfo.id)) {
                    existing.batches.push(batchInfo);
                }
                const existingJoin = new Date(existing.joinDate).getTime();
                if (adm.admission_date.getTime() < existingJoin) {
                    existing.joinDate = adm.admission_date.toISOString();
                }
            } else {
                byStudent.set(sid, {
                    admissionId: adm.id,
                    studentId: adm.student.id,
                    name: adm.student.user.name,
                    email: adm.student.user.email,
                    phone: adm.student.phone,
                    parentName: adm.student.fatherName ?? null,
                    joinDate: adm.admission_date.toISOString(),
                    batches: [batchInfo],
                });
            }
        }

        const formatted = Array.from(byStudent.values());
        return NextResponse.json(formatted);
    } catch (err) {
        console.log("[TEACHER_STUDENTS_GET]", err);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
