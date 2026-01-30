"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";

interface ExamFilterProps {
    batches: { id: string; name: string }[];
}

export function ExamFilter({ batches }: ExamFilterProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentBatchId = searchParams.get("batchId") || "all";

    const handleValueChange = (value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value === "all") {
            params.delete("batchId");
        } else {
            params.set("batchId", value);
        }
        router.push(`/dashboard/teacher/exam?${params.toString()}`);
    };

    return (
        <div className="w-[200px]">
            <Select value={currentBatchId} onValueChange={handleValueChange}>
                <SelectTrigger>
                    <SelectValue placeholder="Filter by Batch" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Batches</SelectItem>
                    {batches.map((batch) => (
                        <SelectItem key={batch.id} value={batch.id}>
                            {batch.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
