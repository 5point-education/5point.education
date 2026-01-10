"use client";

import { CreateExamForm } from "@/components/dashboard/exams/CreateExamForm";

export default function CreateExamPage({ params }: { params: any }) {
    // params.id is the batchId based on the route folder structure
    return (
        <div className="max-w-2xl mx-auto py-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Create New Exam</h1>
                <p className="text-muted-foreground">Define chapters and max marks.</p>
            </div>

            <CreateExamForm batchId={params.id} />
        </div>
    );
}
