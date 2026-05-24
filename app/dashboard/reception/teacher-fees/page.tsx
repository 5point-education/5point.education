"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle, Loader2, Save, User, Users } from "lucide-react";

interface TeacherOption {
  id: string;
  name: string;
}

interface BatchOption {
  id: string;
  name: string;
  subject: string;
  teacherId: string;
  teacherName: string;
}

interface SheetRow {
  studentId: string | null;
  admissionId: string | null;
  studentName: string;
  totalReceived: number;
  fivePointFees: number;
  developmentFees: number;
  discount: number;
  teacherAmount: number;
  isArchived?: boolean;
}

interface Totals {
  totalReceived: number;
  totalDeductions: number;
  totalTeacherAmount: number;
}

function formatCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(month: string) {
  const [year, monthNumber] = month.split("-");
  return new Date(parseInt(year, 10), parseInt(monthNumber, 10) - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function safeRound(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function calculateTeacherAmount(row: Pick<SheetRow, "totalReceived" | "fivePointFees" | "developmentFees" | "discount">) {
  return safeRound(row.totalReceived - row.fivePointFees - row.developmentFees - row.discount);
}

export default function ReceptionTeacherFeesPage() {
  const { toast } = useToast();
  const [month, setMonth] = useState(formatCurrentMonth());
  const [teacherId, setTeacherId] = useState("all");
  const [batchId, setBatchId] = useState("");
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [rows, setRows] = useState<SheetRow[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [headerInfo, setHeaderInfo] = useState<{ batchName: string; teacherName: string } | null>(null);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [sheetError, setSheetError] = useState<string | null>(null);

  const selectedTeacherId = teacherId === "all" ? undefined : teacherId;
  const hasHardFailure = Boolean(metaError || sheetError);

  const buildApiError = (status: number, endpointLabel: string, serverMessage?: string) => {
    const fallback = `${endpointLabel} failed (${status}).`;
    const details = serverMessage?.trim() ? ` ${serverMessage.trim()}` : "";
    if (status >= 500) {
      return `${fallback} Server/API error. Check DATABASE_URL and restart the dev server.${details}`;
    }
    return `${fallback}${details}`;
  };

  const fetchMeta = useCallback(async () => {
    setLoadingMeta(true);
    setMetaError(null);
    try {
      const params = new URLSearchParams({ month });
      if (selectedTeacherId) params.set("teacherId", selectedTeacherId);

      const response = await fetch(`/api/teacher-fee-sheets?${params.toString()}`);
      if (!response.ok) {
        const serverText = await response.text();
        throw new Error(buildApiError(response.status, "Filter metadata request", serverText));
      }
      const data = await response.json();

      setTeachers(data.teachers || []);
      setBatches(data.batches || []);
      const batchIds = (data.batches || []).map((item: BatchOption) => item.id);
      if (!batchId || !batchIds.includes(batchId)) {
        setBatchId(batchIds[0] || "");
      }
    } catch (error: any) {
      console.error(error);
      const message = error.message || "Failed to load teacher fees metadata";
      setMetaError(message);
      setTeachers([]);
      setBatches([]);
      setRows([]);
      setHeaderInfo(null);
      setBatchId("");
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoadingMeta(false);
    }
  }, [month, selectedTeacherId, batchId, toast]);

  const fetchSheet = useCallback(async () => {
    if (loadingMeta) return;
    if (metaError) {
      setRows([]);
      setHeaderInfo(null);
      return;
    }

    if (!batchId) {
      setRows([]);
      setHeaderInfo(null);
      setSheetError(null);
      return;
    }

    setLoadingSheet(true);
    setSheetError(null);
    try {
      const params = new URLSearchParams({ month, batchId });
      if (selectedTeacherId) params.set("teacherId", selectedTeacherId);

      const response = await fetch(`/api/teacher-fee-sheets?${params.toString()}`);
      if (!response.ok) {
        const serverText = await response.text();
        throw new Error(buildApiError(response.status, "Teacher fee sheet request", serverText));
      }
      const data = await response.json();

      setRows(data.rows || []);
      if (data.batch) {
        setHeaderInfo({
          batchName: `${data.batch.name} - ${data.batch.subject}`,
          teacherName: data.batch.teacherName,
        });
      } else {
        setHeaderInfo(null);
      }
    } catch (error: any) {
      console.error(error);
      const message = error.message || "Failed to load sheet details";
      setSheetError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      setRows([]);
      setHeaderInfo(null);
    } finally {
      setLoadingSheet(false);
    }
  }, [month, batchId, selectedTeacherId, toast, loadingMeta, metaError]);

  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);

  useEffect(() => {
    fetchSheet();
  }, [fetchSheet]);

  const handleNumericEdit = (
    rowIndex: number,
    field: "fivePointFees" | "developmentFees" | "discount",
    value: string
  ) => {
    const parsed = Number(value);
    const normalizedValue = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;

    setRows((previousRows) =>
      previousRows.map((row, index) => {
        if (index !== rowIndex) return row;
        const updatedRow = {
          ...row,
          [field]: safeRound(normalizedValue),
        };
        return {
          ...updatedRow,
          teacherAmount: calculateTeacherAmount(updatedRow),
        };
      })
    );
  };

  const totals: Totals = useMemo(() => {
    const totalReceived = rows.reduce((sum, row) => sum + row.totalReceived, 0);
    const totalDeductions = rows.reduce(
      (sum, row) => sum + row.fivePointFees + row.developmentFees + row.discount,
      0
    );
    const totalTeacherAmount = rows.reduce((sum, row) => sum + row.teacherAmount, 0);
    return {
      totalReceived: safeRound(totalReceived),
      totalDeductions: safeRound(totalDeductions),
      totalTeacherAmount: safeRound(totalTeacherAmount),
    };
  }, [rows]);

  const handleSave = async () => {
    if (!batchId) {
      toast({
        title: "Batch required",
        description: "Please select a batch before saving.",
        variant: "destructive",
      });
      return;
    }

    const invalidRow = rows.find(
      (row) => row.fivePointFees + row.developmentFees + row.discount > row.totalReceived
    );
    if (invalidRow) {
      toast({
        title: "Invalid row",
        description: `Deductions exceed total received for ${invalidRow.studentName}.`,
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/teacher-fee-sheets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          month,
          batchId,
          rows: rows.map((row) => ({
            studentId: row.studentId,
            admissionId: row.admissionId,
            studentName: row.studentName,
            totalReceived: row.totalReceived,
            fivePointFees: row.fivePointFees,
            developmentFees: row.developmentFees,
            discount: row.discount,
          })),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to save teacher fee sheet");
      }

      toast({
        title: "Saved",
        description: "Teacher fee sheet saved successfully.",
      });
      fetchSheet();
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: error.message || "Failed to save teacher fee sheet",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Teachers Fees</h1>
        <p className="text-muted-foreground">Prepare manual teacher fee sheets month-wise and batch-wise.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Select month, teacher, and batch to prepare the sheet.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="month">Month</Label>
            <Input id="month" type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Teacher</Label>
            <Select value={teacherId} onValueChange={setTeacherId}>
              <SelectTrigger>
                <SelectValue placeholder="All teachers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All teachers</SelectItem>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Batch</Label>
            <Select value={batchId} onValueChange={setBatchId} disabled={loadingMeta || batches.length === 0 || hasHardFailure}>
              <SelectTrigger>
                <SelectValue placeholder={loadingMeta ? "Loading batches..." : "Select batch"} />
              </SelectTrigger>
              <SelectContent>
                {batches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id}>
                    {batch.name} - {batch.subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {metaError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 text-red-800">
              <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Could not load filter data</p>
                <p className="text-sm mt-1">{metaError}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {headerInfo && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">{headerInfo.batchName}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  {headerInfo.teacherName}
                </div>
              </div>
              <Badge variant="secondary">{monthLabel(month)}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Teacher Fee Sheet
          </CardTitle>
          <CardDescription>
            Teacher amount = Total Received - (5 Point Fees + Development Fees + Discount)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sheetError && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3 text-red-800">
                  <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold">Could not load teacher fee sheet</p>
                    <p className="text-sm mt-1">{sheetError}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {loadingSheet ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading sheet...
            </div>
          ) : rows.length === 0 && !sheetError ? (
            <div className="text-center py-10 text-muted-foreground">
              {batchId ? "No student rows found for this batch." : "Select a batch to load teacher fee rows."}
            </div>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead className="text-right">Total Received</TableHead>
                    <TableHead className="text-right">5 Point Fees</TableHead>
                    <TableHead className="text-right">Development Fees</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead className="text-right">Teacher Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, index) => (
                    <TableRow key={`${row.admissionId || row.studentId || row.studentName}-${index}`}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {row.studentName}
                          {row.isArchived && (
                            <Badge variant="outline" className="text-xs">
                              Archived
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">Rs {row.totalReceived.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={row.fivePointFees}
                          onChange={(event) => handleNumericEdit(index, "fivePointFees", event.target.value)}
                          className="w-28 ml-auto text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={row.developmentFees}
                          onChange={(event) => handleNumericEdit(index, "developmentFees", event.target.value)}
                          className="w-28 ml-auto text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={row.discount}
                          onChange={(event) => handleNumericEdit(index, "discount", event.target.value)}
                          className="w-28 ml-auto text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        Rs {row.teacherAmount.toLocaleString("en-IN")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border">
              <CardHeader className="pb-2">
                <CardDescription>Total Received</CardDescription>
                <CardTitle className="text-xl">Rs {totals.totalReceived.toLocaleString("en-IN")}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border">
              <CardHeader className="pb-2">
                <CardDescription>Total Deductions</CardDescription>
                <CardTitle className="text-xl">Rs {totals.totalDeductions.toLocaleString("en-IN")}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border">
              <CardHeader className="pb-2">
                <CardDescription>Teacher Payable</CardDescription>
                <CardTitle className="text-xl text-green-700">
                  Rs {totals.totalTeacherAmount.toLocaleString("en-IN")}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving || loadingSheet || !batchId || hasHardFailure}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Sheet
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
