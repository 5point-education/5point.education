import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default async function ExamListPage({ params }: { params: any }) {
    const exams = await db.exam.findMany({
        where: { batchId: params.id },
        include: {
            chapters: {
                orderBy: { order: 'asc' }
            },
            _count: {
                select: { results: true }
            }
        } as any,
        orderBy: { date: 'desc' }
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Exams</h1>
                    <p className="text-muted-foreground">Manage exams and marks for this batch</p>
                </div>
                <Link href={`/dashboard/teacher/batch/${params.id}/exams/new`}>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Create Exam
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Exam List</CardTitle>
                    <CardDescription>Select an exam to enter marks</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Exam Name</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Total Marks</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {exams.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                        No exams found. Create one to get started.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                exams.map((exam: any) => (
                                    <TableRow key={exam.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                                                    <FileText className="h-4 w-4" />
                                                </div>
                                                {exam.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>{format(exam.date, "MMM dd, yyyy")}</TableCell>
                                        <TableCell>{exam.total_marks}</TableCell>
                                        <TableCell>
                                            <Link href={`/dashboard/teacher/exam/${exam.id}/scores`}>
                                                <Button variant="outline" size="sm">
                                                    Enter Marks <ArrowRight className="ml-2 h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
