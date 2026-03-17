import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { WhatsAppService } from "@/lib/whatsapp-service";

export async function POST(req: Request) {
    try {
        const supabase = createAdminClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user || (user.user_metadata.role !== Role.TEACHER && user.user_metadata.role !== Role.ADMIN)) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { examId, results } = await req.json(); // results: [{ studentId, score, remarks }]

        // Transactional bulk upsert
        const updatedRecords = await db.$transaction(
            results.map((result: any) =>
                db.result.upsert({
                    where: {
                        examId_studentId: {
                            examId,
                            studentId: result.studentId
                        }
                    },
                    update: {
                        score: parseFloat(result.score),
                        remarks: result.remarks
                    },
                    create: {
                        examId,
                        studentId: result.studentId,
                        score: parseFloat(result.score),
                        remarks: result.remarks
                    },
                    include: {
                        student: {
                            include: { user: true }
                        },
                        exam: true
                    }
                })
            )
        );

        // Send WhatsApp notifications asynchronously
        Promise.all(updatedRecords.map(async (record) => {
            const phone = record.student.parentMobile || record.student.phone;
            if (phone) {
                await WhatsAppService.sendMarksUpdated(
                    phone,
                    record.student.user.name,
                    record.exam.name,
                    record.score
                ).catch(console.error);
            }
        })).catch(console.error); // Catch any top-level errors in the Promise.all

        return NextResponse.json({ success: true });
    } catch (error) {
        console.log("[RESULTS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const examId = searchParams.get("examId");

        if (!examId) {
            return new NextResponse("Exam ID required", { status: 400 });
        }

        const results = await db.result.findMany({
            where: { examId },
            include: {
                student: {
                    include: {
                        user: { select: { name: true } }
                    }
                }
            }
        });

        return NextResponse.json(results);
    } catch (error) {
        console.log("[RESULTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
