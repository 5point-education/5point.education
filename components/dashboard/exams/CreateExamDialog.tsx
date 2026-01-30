"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { Label } from "@/components/ui/label";

interface CreateExamDialogProps {
    batches: { id: string; name: string }[];
}

export function CreateExamDialog({ batches }: CreateExamDialogProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [selectedBatchId, setSelectedBatchId] = useState("");

    const handleCreate = () => {
        if (!selectedBatchId) return;
        setOpen(false);
        router.push(`/dashboard/teacher/batch/${selectedBatchId}/exams/new`);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Create Exam
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create New Exam</DialogTitle>
                    <DialogDescription>
                        Select the batch. On the next page you’ll set the exam name, date, and marks structure for that batch.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="batch" className="text-right">
                            Batch
                        </Label>
                        <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a batch" />
                            </SelectTrigger>
                            <SelectContent>
                                {batches.map((batch) => (
                                    <SelectItem key={batch.id} value={batch.id}>
                                        {batch.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreate} disabled={!selectedBatchId}>Continue</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
