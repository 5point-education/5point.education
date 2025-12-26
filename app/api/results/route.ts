import { db } from "@/lib/db";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

export async function POST(req: Request) {
    try {
        const session = await auth();

        if (!session || !session.user || (session.user.role !== Role.TEACHER && session.user.role !== Role.ADMIN)) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { examId, results } = await req.json(); // results: [{ studentId, score, remarks }]

        // Transactional bulk upsert
        // Prisma doesn't strictly have "bulk upsert" in one query easily for diverse data, 
        // but we can loop in transaction or use delete+create (dangerous for logs)
        // or iteration. Iteration in transaction is safest for now.

        await db.$transaction(
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
                    }
                })
            )
        );

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
