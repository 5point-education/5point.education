import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

/**
 * GET /api/student/profile
 * Returns the logged-in student's profile (academic info, batches) and optional performance summary.
 */
export async function GET() {
    try {
        const supabase = createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user || user.user_metadata?.role !== Role.STUDENT) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const studentProfile = await db.studentProfile.findUnique({
            where: { userId: user.id },
            include: {
                admissions: {
                    where: { status: "ACTIVE", batchId: { not: null } },
                    include: { batch: true },
                },
            },
        });

        if (!studentProfile) {
            return new NextResponse("Student profile not found", { status: 404 });
        }

        const batches = studentProfile.admissions
            .filter((a) => a.batch)
            .map((a) => ({
                id: a.batch!.id,
                name: a.batch!.name,
                subject: a.batch!.subject,
                schedule: a.batch!.schedule,
            }));

        const results = await db.result.findMany({
            where: { studentId: studentProfile.id },
            include: { exam: true },
        });
        const totalExams = results.length;
        const totalPercentage =
            results.length > 0
                ? results.reduce((sum, r) => sum + (r.score / r.exam.total_marks) * 100, 0) / results.length
                : 0;

        return NextResponse.json({
            profile: {
                stream: studentProfile.stream,
                aspirant_of: studentProfile.aspirant_of,
                board: studentProfile.board,
                class_level: studentProfile.class_level,
                subjects: studentProfile.subjects,
                service_type: studentProfile.service_type,
                phone: studentProfile.phone,
                fatherName: studentProfile.fatherName,
                motherName: studentProfile.motherName,
                parentMobile: studentProfile.parentMobile,
            },
            batches,
            performanceSummary: {
                totalExams,
                averageScore: totalExams > 0 ? Number(totalPercentage.toFixed(1)) : null,
            },
        });
    } catch (err) {
        console.log("[STUDENT_PROFILE_GET]", err);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
