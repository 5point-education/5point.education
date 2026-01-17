"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Search, Filter, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Result {
    id: string;
    examName: string;
    subject: string;
    score: number;
    totalMarks: number;
    percentage: string;
    date: string;
    remarks: string;
}

export default function StudentResultsPage() {
    const [results, setResults] = useState<Result[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [subjectFilter, setSubjectFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        fetchResults();
    }, []);

    const fetchResults = async () => {
        try {
            const response = await fetch("/api/student/results");
            const data = await response.json();
            setResults(data);
        } catch (error) {
            console.error("Error fetching results:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Get unique subjects for filter
    const subjects = Array.from(new Set(results.map(r => r.subject)));

    // Filter logic
    const filteredResults = results.filter(result => {
        const matchesSearch = result.examName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSubject = subjectFilter === "all" || result.subject === subjectFilter;

        const percentage = parseFloat(result.percentage);
        const passed = percentage >= 40; // Assuming 40% passing
        const matchesStatus = statusFilter === "all" ||
            (statusFilter === "passed" && passed) ||
            (statusFilter === "failed" && !passed);

        return matchesSearch && matchesSubject && matchesStatus;
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Exam Results</h1>
                <p className="text-muted-foreground">
                    View your complete academic performance history
                </p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                        <CardTitle>Results History</CardTitle>
                        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                            {/* Search */}
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search exams..."
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            {/* Subject Filter */}
                            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                                <SelectTrigger className="w-full sm:w-[150px]">
                                    <SelectValue placeholder="Subject" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Subjects</SelectItem>
                                    {subjects.map(subject => (
                                        <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Status Filter */}
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full sm:w-[150px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="passed">Passed</SelectItem>
                                    <SelectItem value="failed">Failed</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Reset Filters */}
                            {(searchTerm || subjectFilter !== "all" || statusFilter !== "all") && (
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setSearchTerm("");
                                        setSubjectFilter("all");
                                        setStatusFilter("all");
                                    }}
                                    className="px-2 lg:px-4"
                                >
                                    Reset
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead>Exam Name</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Score</TableHead>
                                <TableHead className="text-right">Percentage</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Remarks</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredResults.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                                            <AlertCircle className="h-6 w-6" />
                                            <p>No results found matching your filters.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredResults.map((result) => {
                                    const percentage = parseFloat(result.percentage);
                                    let gradeColor = "text-slate-600";
                                    let statusBadge = <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">Pending</span>;

                                    if (percentage >= 40) {
                                        statusBadge = <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Passed</span>;
                                        if (percentage >= 80) gradeColor = "text-green-600 font-bold";
                                        else if (percentage >= 60) gradeColor = "text-blue-600 font-bold";
                                    } else {
                                        statusBadge = <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Failed</span>;
                                        gradeColor = "text-red-600 font-bold";
                                    }

                                    return (
                                        <TableRow key={result.id} className="hover:bg-muted/50">
                                            <TableCell className="font-medium">{result.examName}</TableCell>
                                            <TableCell>
                                                <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                                                    {result.subject}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {format(new Date(result.date), "MMM dd, yyyy")}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {result.score} <span className="text-muted-foreground">/ {result.totalMarks}</span>
                                            </TableCell>
                                            <TableCell className={`text-right ${gradeColor}`}>
                                                {result.percentage}%
                                            </TableCell>
                                            <TableCell>{statusBadge}</TableCell>
                                            <TableCell className="max-w-[200px] truncate text-muted-foreground text-sm italic">
                                                {result.remarks}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
