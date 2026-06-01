import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

export async function GET(req: Request) {
    try {
        const supabase = createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user || user.user_metadata.role !== Role.STUDENT) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const studentProfile = await db.studentProfile.findUnique({
            where: { userId: user.id }
        });

        if (!studentProfile) {
            return new NextResponse("Student profile not found", { status: 404 });
        }

        const results = await db.result.findMany({
            where: { studentId: studentProfile.id },
            include: {
                exam: {
                    include: {
                        batch: true
                    }
                }
            },
            orderBy: {
                exam: { date: 'desc' }
            }
        });

        const formattedResults = results.map(r => ({
            id: r.id,
            examName: r.exam.name,
            subject: r.exam.batch.subject,
            score: r.score,
            totalMarks: r.exam.total_marks,
            percentage: ((r.score / r.exam.total_marks) * 100).toFixed(1),
            date: r.exam.date.toISOString(),
            remarks: r.remarks || "No remarks"
        }));

        return NextResponse.json(formattedResults);

    } catch (error) {
        console.log("[STUDENT_RESULTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
