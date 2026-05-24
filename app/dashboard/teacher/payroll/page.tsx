"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { AlertCircle, IndianRupee, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface BatchOption {
  id: string;
  name: string;
}

interface PayrollSheet {
  id: string;
  batchId: string;
  batchName: string;
  totalTeacherAmount: number;
  updatedAt: string;
}

interface PayrollData {
  sheets: PayrollSheet[];
  totalTeacherAmount: number;
  totalSheets: number;
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
      const response = await fetch(`/api/teacher/payroll?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to load payroll sheets");
      }
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching payroll:", error);
      setData({
        sheets: [],
        totalTeacherAmount: 0,
        totalSheets: 0,
        batches: [],
      });
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedBatch]);

  useEffect(() => {
    fetchPayroll();
  }, [fetchPayroll]);

  const formatMonthLabel = (month: string) => {
    const [year, monthNumber] = month.split("-");
    const date = new Date(parseInt(year, 10), parseInt(monthNumber, 10) - 1, 1);
    return format(date, "MMMM yyyy");
  };

  return (
    <div className="space-y-8 p-6 md:p-8 pt-20 max-w-7xl mx-auto pb-20">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Payroll</h1>
        <p className="text-muted-foreground text-sm">
          Final payable totals prepared by reception for {formatMonthLabel(selectedMonth)}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="w-full sm:w-[200px]">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Month</label>
          <Input
            type="month"
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
            className="h-10"
          />
        </div>
        {data && data.batches.length > 0 && (
          <div className="w-full sm:w-[260px]">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Batch</label>
            <Select value={selectedBatch} onValueChange={setSelectedBatch}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Filter by batch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Batches</SelectItem>
                {data.batches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id}>
                    {batch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-none border bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payable</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : `Rs ${Math.round(data?.totalTeacherAmount || 0).toLocaleString("en-IN")}`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{formatMonthLabel(selectedMonth)}</p>
          </CardContent>
        </Card>

        <Card className="shadow-none border bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prepared Sheets</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : data?.totalSheets || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Batch-wise monthly sheets</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xl font-semibold tracking-tight">Batch Payable Amounts</h2>
        </div>

        <div className="border rounded-xl bg-card shadow-sm overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center p-12 text-muted-foreground">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mr-3"></div>
              Loading payroll sheets...
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-muted/30">
                  <TableHead className="font-medium">Batch</TableHead>
                  <TableHead className="text-right font-medium">Payable Amount</TableHead>
                  <TableHead className="font-medium">Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!data || data.sheets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="h-6 w-6" />
                        <p>No teacher fee sheet found for {formatMonthLabel(selectedMonth)}.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.sheets.map((sheet) => (
                    <TableRow key={sheet.id} className="group hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium">{sheet.batchName}</TableCell>
                      <TableCell className="text-right font-semibold">
                        Rs {Math.round(sheet.totalTeacherAmount).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(sheet.updatedAt), "MMM dd, yyyy")}
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
