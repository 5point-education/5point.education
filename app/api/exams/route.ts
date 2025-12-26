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

        const { batchId, name, date, total_marks } = await req.json();

        const exam = await db.exam.create({
            data: {
                batchId,
                name,
                date: new Date(date),
                total_marks: parseInt(total_marks),
            }
        });

        return NextResponse.json(exam);
    } catch (error) {
        console.log("[EXAMS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const batchId = searchParams.get("batchId");

        if (!batchId) {
            return new NextResponse("Batch ID required", { status: 400 });
        }

        const exams = await db.exam.findMany({
            where: { batchId },
            orderBy: { date: 'desc' },
            include: {
                _count: {
                    select: { results: true }
                }
            }
        });

        return NextResponse.json(exams);
    } catch (error) {
        console.log("[EXAMS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
