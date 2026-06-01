"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

// Types for props
type Student = {
    id: string;
    studentProfile: {
        id: string;
        user: { name: string };
    } | null;
};

type Chapter = {
    id: string;
    name: string;
    max_marks: number;
    scores: { studentId: string; marks: number }[];
};

type Props = {
    examId: string;
    chapters: Chapter[];
    students: any[]; // We'll refine this type based on actual data
};

export function MarksEntryTable({ examId, chapters, students }: Props) {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    // We keep local state for edits before saving
    // Structure: { [studentId_chapterId]: marks }
    const [marksData, setMarksData] = useState<Record<string, number>>(() => {
        const initial: Record<string, number> = {};
        chapters.forEach(ch => {
            ch.scores.forEach(s => {
                initial[`${s.studentId}_${ch.id}`] = s.marks;
            });
        });
        return initial;
    });

    const handleMarkChange = (studentId: string, chapterId: string, val: string) => {
        if (val === '') {
            const newData = { ...marksData };
            delete newData[`${studentId}_${chapterId}`];
            setMarksData(newData);
            return;
        }
        const num = parseFloat(val);
        if (isNaN(num)) return;
        setMarksData(prev => ({ ...prev, [`${studentId}_${chapterId}`]: num }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const scoresToSave = Object.entries(marksData).map(([key, marks]) => {
                const [studentId, chapterId] = key.split('_');
                return { studentId, chapterId, marks };
            });

            const res = await fetch(`/api/exams/${examId}/scores`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ scores: scoresToSave }),
            });

            if (!res.ok) throw new Error("Failed");
            toast({ title: "Saved", description: "Marks updated successfully" });
        } catch (error) {
            toast({ title: "Error", description: "Failed to save marks", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Marks Entry</h2>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save All
                </Button>
            </div>

            <div className="border rounded-md overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b bg-muted/50">
                            <th className="p-3 text-left">Student Name</th>
                            {chapters.map(ch => (
                                <th key={ch.id} className="p-3 text-left">
                                    {ch.name} <br />
                                    <span className="text-xs text-muted-foreground">(Max: {ch.max_marks})</span>
                                </th>
                            ))}
                            <th className="p-3 text-left">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map((admission) => {
                            const student = admission.student;
                            if (!student) return null;
                            const studentId = student.id;

                            // Calculate total for this student
                            let totalObtained = 0;
                            chapters.forEach(ch => {
                                totalObtained += marksData[`${studentId}_${ch.id}`] || 0;
                            });

                            return (
                                <tr key={student.id} className="border-b hover:bg-slate-50">
                                    <td className="p-3 font-medium">
                                        {student.user.name}
                                    </td>
                                    {chapters.map(ch => (
                                        <td key={ch.id} className="p-3">
                                            <Input
                                                type="number"
                                                step="any"
                                                min={0}
                                                max={ch.max_marks}
                                                className="w-20"
                                                value={marksData[`${studentId}_${ch.id}`] ?? ''}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value);
                                                    handleMarkChange(studentId, ch.id, e.target.value)
                                                }}
                                            />
                                        </td>
                                    ))}
                                    <td className="p-3 font-bold">
                                        {totalObtained}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
