
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const supabase = createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const exam = await db.exam.findUnique({
            where: { id: params.id },
            include: {
                chapters: {
                    orderBy: { order: 'asc' },
                    include: {
                        scores: true
                    }
                },
                batch: {
                    include: {
                        admissions: {
                            include: {
                                student: {
                                    include: {
                                        user: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!exam) {
            return new NextResponse("Exam not found", { status: 404 });
        }

        return NextResponse.json(exam);
    } catch (error) {
        console.log("[EXAM_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
