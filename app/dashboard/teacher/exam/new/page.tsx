import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { CreateExamForm } from "@/components/dashboard/exams/CreateExamForm";

export default async function CreateExamPage({
    searchParams,
}: {
    searchParams: Promise<{ batchId?: string }>;
}) {
    const { batchId } = await searchParams;

    if (!batchId) {
        redirect("/dashboard/teacher/exam");
    }

    const batch = await db.batch.findUnique({
        where: { id: batchId },
        select: { id: true, name: true, subject: true },
    });

    if (!batch) {
        notFound();
    }

    return (
        <div className="space-y-6 pt-6">
            <CreateExamForm
                batchId={batch.id}
                batchName={batch.name}
                batchSubject={batch.subject || undefined}
            />
        </div>
    );
}
