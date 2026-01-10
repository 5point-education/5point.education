import { db } from "@/lib/db";
import { MarksEntryTable } from "@/components/dashboard/exams/MarksEntryTable";
import { notFound } from "next/navigation";

export default async function ScoreEntryPage({ params }: { params: { id: string } }) {
    const exam: any = await db.exam.findUnique({
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
        } as any
    });

    if (!exam) {
        notFound();
    }

    // Format students from batch admissions
    // The exam.batch.admissions contains the students enrolled in this batch
    // We pass this list to the table. 
    // Types need to align.

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{exam.name}</h1>
                    <p className="text-muted-foreground">
                        Date: {exam.date.toLocaleDateString()} | Batch: {exam.batch?.name}
                    </p>
                </div>
            </div>

            <MarksEntryTable
                examId={exam.id}
                chapters={exam.chapters}
                students={exam.batch?.admissions || []}
            />
        </div>
    );
}
