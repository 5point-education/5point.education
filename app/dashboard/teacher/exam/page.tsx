import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, ArrowRight } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { ExamFilter } from "@/components/dashboard/exams/ExamFilter";
import { CreateExamDialog } from "@/components/dashboard/exams/CreateExamDialog";

export default async function TeacherExamListPage({ searchParams }: { searchParams: { batchId?: string } }) {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user || user.user_metadata.role !== Role.TEACHER) {
        // Handle unauthorized or redirect
    }

    if (!user) {
        return redirect("/login");
    }

    // Fetch batches for filter and create dialog
    const batches = await db.batch.findMany({
        where: { teacherId: user.id },
        select: { id: true, name: true, subject: true },
        orderBy: { name: 'asc' }
    });

    const whereClause: any = {
        batch: {
            teacherId: user.id
        }
    };

    if (searchParams.batchId) {
        whereClause.batchId = searchParams.batchId;
    }

    const exams = await db.exam.findMany({
        where: whereClause,
        include: {
            batch: {
                select: {
                    name: true,
                    subject: true
                }
            },
            _count: {
                select: { results: true }
            }
        },
        orderBy: { date: 'desc' }
    });

    return (
        <div className="space-y-6 pt-20 md:pt-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">All Exams</h1>
                    <p className="text-muted-foreground">Manage exams across all your batches</p>
                </div>
                <div className="flex items-center gap-2">
                    <ExamFilter batches={batches} />
                    <CreateExamDialog batches={batches} />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Exam List</CardTitle>
                    <CardDescription>Select an exam to view details or enter marks</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Exam Name</TableHead>
                                <TableHead>Batch</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Marks</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {exams.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No exams found.{searchParams.batchId ? " Try selecting a different batch." : " Exams are created within specific batches."}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                exams.map((exam) => (
                                    <TableRow key={exam.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                                                    <FileText className="h-4 w-4" />
                                                </div>
                                                {exam.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{exam.batch.name}</span>
                                                <span className="text-xs text-muted-foreground">{exam.batch.subject}</span>
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
