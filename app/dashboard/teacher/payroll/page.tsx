"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { IndianRupee, Users, AlertCircle } from "lucide-react";

interface PayrollPayment {
    id: string;
    studentName: string;
    batchName: string;
    amount: number;
    date: string;
    mode: string;
    receipt_no: string;
}

interface BatchOption {
    id: string;
    name: string;
}

interface PayrollData {
    payments: PayrollPayment[];
    totalCollected: number;
    totalPayments: number;
    batches: BatchOption[];
}

export default function TeacherPayrollPage() {
    const [data, setData] = useState<PayrollData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    });
    const [selectedBatch, setSelectedBatch] = useState("all");

    const fetchPayroll = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ month: selectedMonth, batchId: selectedBatch });
            const response = await fetch(`/api/teacher/payroll?${params}`);
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error("Error fetching payroll:", error);
        } finally {
            setLoading(false);
        }
    }, [selectedMonth, selectedBatch]);

    useEffect(() => {
        fetchPayroll();
    }, [fetchPayroll]);

    // Format month label
    const formatMonthLabel = (monthStr: string) => {
        const [year, month] = monthStr.split("-");
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return format(date, "MMMM yyyy");
    };

    return (
        <div className="space-y-8 p-6 md:p-8 pt-20 max-w-7xl mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Payroll</h1>
                <p className="text-muted-foreground text-sm">
                    Fees collected from your students for {formatMonthLabel(selectedMonth)}
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="w-full sm:w-[200px]">
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Month</label>
                    <Input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="h-10"
                    />
                </div>
                {data && data.batches.length > 0 && (
                    <div className="w-full sm:w-[250px]">
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Batch</label>
                        <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                            <SelectTrigger className="h-10">
                                <SelectValue placeholder="Filter by batch" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Batches</SelectItem>
                                {data.batches.map(batch => (
                                    <SelectItem key={batch.id} value={batch.id}>{batch.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-none border bg-card/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {loading ? "..." : `₹${(data?.totalCollected || 0).toLocaleString('en-IN')}`}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            For {formatMonthLabel(selectedMonth)}
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-none border bg-card/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {loading ? "..." : (data?.totalPayments || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Individual transactions
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Payments Table */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-xl font-semibold tracking-tight">Payment Details</h2>
                </div>

                <div className="border rounded-xl bg-card shadow-sm overflow-x-auto">
                    {loading ? (
                        <div className="flex items-center justify-center p-12 text-muted-foreground">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mr-3"></div>
                            Loading payroll data...
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="hover:bg-muted/30">
                                    <TableHead className="font-medium">Student Name</TableHead>
                                    <TableHead className="font-medium">Batch</TableHead>
                                    <TableHead className="text-right font-medium">Amount</TableHead>
                                    <TableHead className="font-medium">Date</TableHead>
                                    <TableHead className="font-medium">Mode</TableHead>
                                    <TableHead className="font-medium">Receipt No.</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {!data || data.payments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <AlertCircle className="h-6 w-6" />
                                                <p>No payments found for {formatMonthLabel(selectedMonth)}.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.payments.map((payment) => (
                                        <TableRow key={payment.id} className="group hover:bg-muted/30 transition-colors">
                                            <TableCell className="font-medium">{payment.studentName}</TableCell>
                                            <TableCell>
                                                <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                                                    {payment.batchName}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">
                                                ₹{payment.amount.toLocaleString('en-IN')}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {format(new Date(payment.date), "MMM dd, yyyy")}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${payment.mode === 'CASH' ? 'bg-green-100 text-green-700' :
                                                        payment.mode === 'UPI' ? 'bg-purple-100 text-purple-700' :
                                                            'bg-slate-100 text-slate-700'
                                                    }`}>
                                                    {payment.mode}
                                                </span>
                                            </TableCell>
                                            <TableCell className="font-mono text-sm text-muted-foreground">
                                                {payment.receipt_no}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </div>
        </div>
    );
}
