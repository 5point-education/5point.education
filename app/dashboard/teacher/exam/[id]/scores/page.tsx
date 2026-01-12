import { db } from "@/lib/db";
import { MarksEntryTable } from "@/components/Dashboard/exams/MarksEntryTable";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";

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
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-sm py-1 px-3 border-primary/20 bg-primary/5 text-primary">
                        {exam.batch?.name}
                    </Badge>
                    <span className="text-muted-foreground text-sm">•</span>
                    <span className="text-muted-foreground text-sm">{exam.date.toLocaleDateString()}</span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight">{exam.name}</h1>
            </div>

            <MarksEntryTable
                examId={exam.id}
                chapters={exam.chapters}
                students={exam.batch?.admissions || []}
            />
        </div>
    );
}
