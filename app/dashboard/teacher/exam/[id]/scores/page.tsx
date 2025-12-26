"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface StudentResult {
    studentId: string;
    name: string;
    score: string;
    remarks: string;
}

export default function ScoreEntryPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const batchId = searchParams.get("batchId");
    const { toast } = useToast();

    const [students, setStudents] = useState<StudentResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (batchId) {
            loadData();
        }
    }, [batchId, params.id]);

    const loadData = async () => {
        try {
            // 1. Fetch Students in Batch
            const studentsRes = await fetch(`/api/batches/${batchId}/students`);
            const studentsData = await studentsRes.json();

            // 2. Fetch Existing Results for Exam
            const resultsRes = await fetch(`/api/results?examId=${params.id}`);
            const resultsData = await resultsRes.json();

            // 3. Merge Data
            // Map results by studentId for O(1) lookup
            const resultsMap = new Map<string, any>(resultsData.map((r: any) => [r.studentId, r]));

            const mergedData = studentsData.map((s: any) => ({
                studentId: s.studentId, // admission.student.id from API
                name: s.name,
                score: resultsMap.get(s.studentId)?.score?.toString() || "",
                remarks: resultsMap.get(s.studentId)?.remarks || ""
            }));

            setStudents(mergedData);
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Error", description: "Failed to load data" });
        } finally {
            setLoading(false);
        }
    };

    const handleScoreChange = (index: number, value: string) => {
        const updated = [...students];
        updated[index].score = value;
        setStudents(updated);
    };

    const handleRemarksChange = (index: number, value: string) => {
        const updated = [...students];
        updated[index].remarks = value;
        setStudents(updated);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Filter out empty scores? Or send all?
            // Send only those with scores to save specific data, or send all to clear if emptied?
            // Logic: Send valid numeric scores.

            const payload = students
                .filter(s => s.score !== "") // Only send entries with scores
                .map(s => ({
                    studentId: s.studentId,
                    score: s.score,
                    remarks: s.remarks
                }));

            const res = await fetch("/api/results", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    examId: params.id,
                    results: payload
                }),
            });

            if (!res.ok) throw new Error("Failed to save");

            toast({ title: "Success", description: "Scores saved successfully" });
            router.back();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Could not save scores" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Enter Scores</h1>
                        <p className="text-muted-foreground">Input marks for all students</p>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="h-4 w-4 mr-2" />
                    Save Results
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student Name</TableHead>
                                <TableHead className="w-[150px]">Score</TableHead>
                                <TableHead>Remarks</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {students.map((student, index) => (
                                <TableRow key={student.studentId}>
                                    <TableCell className="font-medium">{student.name}</TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            value={student.score}
                                            onChange={(e) => handleScoreChange(index, e.target.value)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            placeholder="Excellent, Good, Needs Improvement..."
                                            value={student.remarks}
                                            onChange={(e) => handleRemarksChange(index, e.target.value)}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
