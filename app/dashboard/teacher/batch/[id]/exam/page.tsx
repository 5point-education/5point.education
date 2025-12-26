"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Calendar as CalendarIcon, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

export default function ExamManagerPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { toast } = useToast();
    const [exams, setExams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newExam, setNewExam] = useState({ name: "", date: "", total_marks: "100" });

    useEffect(() => {
        fetchExams();
    }, [params.id]);

    const fetchExams = async () => {
        try {
            const response = await fetch(`/api/exams?batchId=${params.id}`);
            if (response.ok) {
                setExams(await response.json());
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateExam = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch("/api/exams", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    batchId: params.id,
                    ...newExam,
                    date: new Date(newExam.date), // Ensure date format
                }),
            });

            if (!response.ok) throw new Error("Failed to create exam");

            toast({ title: "Success", description: "Exam created" });
            setIsCreateOpen(false);
            fetchExams();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Could not create exam" });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/teacher/batch/${params.id}`)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Exam Management</h1>
                        <p className="text-muted-foreground">Create exams and enter results</p>
                    </div>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            New Exam
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Exam</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateExam} className="space-y-4">
                            <div>
                                <Label>Exam Name</Label>
                                <Input
                                    placeholder="e.g. Midterm Physics"
                                    value={newExam.name}
                                    onChange={(e) => setNewExam({ ...newExam, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label>Date</Label>
                                <Input
                                    type="date"
                                    value={newExam.date}
                                    onChange={(e) => setNewExam({ ...newExam, date: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label>Total Marks</Label>
                                <Input
                                    type="number"
                                    value={newExam.total_marks}
                                    onChange={(e) => setNewExam({ ...newExam, total_marks: e.target.value })}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full">Create Exam</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Exam List</CardTitle>
                    <CardDescription>Select an exam to enter student scores</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">Loading...</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Exam Name</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Total Marks</TableHead>
                                    <TableHead>Results Entered</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {exams.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            No exams created yet.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    exams.map((exam) => (
                                        <TableRow key={exam.id}>
                                            <TableCell className="font-medium">{exam.name}</TableCell>
                                            <TableCell>{format(new Date(exam.date), "MMM dd, yyyy")}</TableCell>
                                            <TableCell>{exam.total_marks}</TableCell>
                                            <TableCell>{exam._count.results}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => router.push(`/dashboard/teacher/exam/${exam.id}/scores?batchId=${params.id}`)}
                                                >
                                                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                                                    Enter Scores
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
