"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Search, AlertCircle, IndianRupee, Hash, Download } from "lucide-react";

interface Payment {
    id: string;
    amount: number;
    date: string;
    mode: string;
    receipt_no: string;
    coveredMonths: string[];
    notes: string | null;
    batchName: string;
}

interface PaymentsData {
    payments: Payment[];
    summary: {
        totalPaid: number;
        totalPayments: number;
    };
}

export default function StudentPaymentsPage() {
    const [data, setData] = useState<PaymentsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [modeFilter, setModeFilter] = useState("all");
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            const response = await fetch("/api/student/payments");
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error("Error fetching payments:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportPDF = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center py-12">
                <h3 className="text-xl font-semibold text-slate-700">Unable to load payment data</h3>
                <p className="text-slate-500 mt-2">Please try refreshing the page</p>
            </div>
        );
    }

    // Get unique payment modes for filter
    const modes = Array.from(new Set(data.payments.map(p => p.mode)));

    // Filter logic
    const filteredPayments = data.payments.filter(p => {
        const matchesSearch =
            p.receipt_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.batchName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesMode = modeFilter === "all" || p.mode === modeFilter;
        return matchesSearch && matchesMode;
    });

    const formatCoveredMonths = (months: string[]) => {
        if (!months || months.length === 0) return "—";
        return months.map(m => {
            const [year, month] = m.split("-");
            const date = new Date(parseInt(year), parseInt(month) - 1);
            return format(date, "MMM yyyy");
        }).join(", ");
    };

    return (
        <>
            {/* Print-specific styles */}
            <style jsx global>{`
        @media print {
          @page {
            size: landscape;
            margin: 10mm;
          }
          /* Reset everything */
          html, body {
            visibility: hidden;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            overflow: visible !important;
          }
          /* Hide sidebar, nav, and any layout wrappers */
          nav, aside, header,
          [class*="Sidebar"], [class*="sidebar"],
          .no-print {
            display: none !important;
          }
          /* Show only the print area */
          #payment-print-area,
          #payment-print-area * {
            visibility: visible;
          }
          #payment-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 10px;
            margin: 0;
          }
          /* Remove card shadows/borders for clean print */
          #payment-print-area [class*="Card"],
          #payment-print-area [class*="card"] {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
          }
          /* Clean table styling */
          table {
            width: 100% !important;
            border-collapse: collapse;
            table-layout: fixed;
          }
          th, td {
            border: 1px solid #d1d5db;
            padding: 10px 14px;
            text-align: left;
            font-size: 13px;
            word-break: break-word;
            white-space: normal;
            line-height: 1.5;
          }
          tr {
            min-height: 40px;
          }
          th {
            background-color: #f1f5f9 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.03em;
          }
          /* Ensure truncated text shows fully */
          .truncate {
            overflow: visible !important;
            text-overflow: unset !important;
            white-space: normal !important;
          }
          /* Remove inner card padding that squeezes content */
          #payment-print-area div[class*="CardContent"],
          #payment-print-area div[class*="cardContent"] {
            padding: 0 !important;
          }
        }
      `}</style>

            <div className="space-y-6" id="payment-print-area" ref={printRef}>
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Payment History</h1>
                        <p className="text-muted-foreground">
                            View and export your complete payment records
                        </p>
                    </div>
                    <Button onClick={handleExportPDF} className="no-print gap-2 bg-primary hover:bg-primary/90">
                        <Download className="h-4 w-4" />
                        Export PDF
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 no-print">
                    <Card className="border-none shadow-sm rounded-2xl bg-white">
                        <div className="p-5 flex items-center">
                            <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mr-4">
                                <IndianRupee className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-800">
                                    ₹{data.summary.totalPaid.toLocaleString('en-IN')}
                                </p>
                                <p className="text-sm text-slate-500 font-medium">Total Paid</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="border-none shadow-sm rounded-2xl bg-white">
                        <div className="p-5 flex items-center">
                            <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mr-4">
                                <Hash className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-800">
                                    {data.summary.totalPayments}
                                </p>
                                <p className="text-sm text-slate-500 font-medium">Total Payments</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Print-only summary header */}
                <div className="hidden print:block mb-4">
                    <h2 className="text-lg font-bold">Payment Summary</h2>
                    <p>Total Paid: ₹{data.summary.totalPaid.toLocaleString('en-IN')} | Total Payments: {data.summary.totalPayments}</p>
                    <hr className="my-2" />
                </div>

                {/* Payments Table */}
                <Card className="border-none shadow-sm rounded-2xl">
                    <CardHeader>
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                            <CardTitle>All Payments</CardTitle>
                            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto no-print">
                                {/* Search */}
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search receipt or batch..."
                                        className="pl-8"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                {/* Mode Filter */}
                                <Select value={modeFilter} onValueChange={setModeFilter}>
                                    <SelectTrigger className="w-full sm:w-[150px]">
                                        <SelectValue placeholder="Payment Mode" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Modes</SelectItem>
                                        {modes.map(mode => (
                                            <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Reset */}
                                {(searchTerm || modeFilter !== "all") && (
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            setSearchTerm("");
                                            setModeFilter("all");
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
                                    <TableHead>Date</TableHead>
                                    <TableHead>Batch</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead>Mode</TableHead>
                                    <TableHead>Receipt No.</TableHead>
                                    <TableHead>Covered Months</TableHead>
                                    <TableHead>Notes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPayments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                                                <AlertCircle className="h-6 w-6" />
                                                <p>No payments found.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredPayments.map((payment) => (
                                        <TableRow key={payment.id} className="hover:bg-muted/50">
                                            <TableCell className="text-muted-foreground whitespace-nowrap">
                                                {format(new Date(payment.date), "MMM dd, yyyy")}
                                            </TableCell>
                                            <TableCell>
                                                <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                                                    {payment.batchName}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold text-slate-800">
                                                ₹{payment.amount.toLocaleString('en-IN')}
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
                                            <TableCell className="text-sm text-muted-foreground">
                                                {formatCoveredMonths(payment.coveredMonths)}
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate text-muted-foreground text-sm italic">
                                                {payment.notes || "—"}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
