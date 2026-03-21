"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import {
  History,
  Loader2,
  Pencil,
  Search,
  Trash2,
  Calendar,
  Receipt,
  BookOpen,
  Ticket,
  CreditCard,
} from "lucide-react";
import { MonthBasedPaymentDialog } from "@/components/dashboard/MonthBasedPaymentDialog";

// ==================== TYPES ====================

interface AdmissionInfo {
  id: string;
  batchId: string | null;
  batchName: string;
  total_fees: number;
  fees_pending: number;
  admission_charge: number;
  admission_charge_pending: number;
  feeModel: string | null;
  admission_date: string;
  monthlyFee?: number;
  totalMonths?: number;
  pendingMonths?: number;
}

interface PaymentInfo {
  id: string;
  amount: number;
  date: string;
  mode: string;
  receipt_no: string;
  coveredMonths?: string[];
  coveredFromDate?: string;
  coveredToDate?: string;
}

interface StudentFeeData {
  studentId: string;
  studentName: string;
  email: string;
  phone: string;
  admissions: AdmissionInfo[];
  payments: PaymentInfo[];
  totalFees: number;
  totalCalculatedFees: number; // Batch fees only
  totalAdmissionCharge: number;
  totalPaid: number;
  totalPending: number;
  totalBatchFeesPending: number;
  totalAdmissionChargePending: number;
}

interface Batch {
  id: string;
  name: string;
  subject: string;
}

// ==================== MAIN COMPONENT ====================

export default function FeesManagementPage() {
  const [feesData, setFeesData] = useState<StudentFeeData[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [batchFilter, setBatchFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("batch-fees");
  const { toast } = useToast();

  // History Dialog State
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyStudent, setHistoryStudent] = useState<StudentFeeData | null>(null);

  // Edit Payment Dialog State
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentInfo | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editMode, setEditMode] = useState("");
  const [editReceiptNo, setEditReceiptNo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirmation State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);

  // Month-based Payment Dialog State (for Batch Fees)
  const [monthBasedPaymentOpen, setMonthBasedPaymentOpen] = useState(false);
  const [monthBasedPaymentStudent, setMonthBasedPaymentStudent] = useState<StudentFeeData | null>(null);

  // Admission Charge Payment Dialog State
  const [admissionChargePaymentOpen, setAdmissionChargePaymentOpen] = useState(false);
  const [admissionChargeStudent, setAdmissionChargeStudent] = useState<StudentFeeData | null>(null);
  const [selectedAdmissionForCharge, setSelectedAdmissionForCharge] = useState<AdmissionInfo | null>(null);
  const [chargePaymentAmount, setChargePaymentAmount] = useState("");
  const [chargePaymentMode, setChargePaymentMode] = useState("CASH");
  const [chargeReceiptNo, setChargeReceiptNo] = useState("");

  // ==================== DATA FETCHING ====================

  const fetchData = useCallback(async () => {
    try {
      const [feesRes, batchesRes] = await Promise.all([
        fetch("/api/fees"),
        fetch("/api/batches")
      ]);

      if (feesRes.ok) {
        const data = await feesRes.json();
        setFeesData(data);
      }
      if (batchesRes.ok) {
        const data = await batchesRes.json();
        setBatches(data.filter((b: any) => b.isActive !== false));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch fees data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ==================== FILTERS ====================

  const filteredData = feesData.filter(student => {
    const matchesSearch =
      student.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.phone.includes(searchQuery) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBatch =
      batchFilter === "all" ||
      student.admissions.some(adm => adm.batchId === batchFilter);

    // Adjust status filter based on active tab
    let matchesStatus = true;
    if (activeTab === "batch-fees") {
      matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "pending" && student.totalBatchFeesPending > 0) ||
        (statusFilter === "paid" && student.totalBatchFeesPending === 0);
    } else {
      matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "pending" && student.totalAdmissionChargePending > 0) ||
        (statusFilter === "paid" && student.totalAdmissionChargePending === 0);
    }

    return matchesSearch && matchesBatch && matchesStatus;
  });

  // Filter students based on tab
  const batchFeesStudents = filteredData.filter(s => s.totalCalculatedFees > 0 || s.totalBatchFeesPending > 0);
  const admissionChargeStudents = filteredData.filter(s => s.totalAdmissionCharge > 0);

  // ==================== HANDLERS ====================

  const handleOpenHistoryDialog = (student: StudentFeeData) => {
    setHistoryStudent(student);
    setHistoryDialogOpen(true);
  };

  const handleOpenEditDialog = (payment: PaymentInfo) => {
    setEditingPayment(payment);
    setEditAmount(payment.amount.toString());
    setEditMode(payment.mode);
    setEditReceiptNo(payment.receipt_no);
    setEditDialogOpen(true);
  };

  const handleUpdatePayment = async () => {
    if (!editingPayment || !editAmount || !editReceiptNo) {
      toast({
        title: "Missing fields",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingPayment.id,
          amount: parseFloat(editAmount),
          mode: editMode,
          receipt_no: editReceiptNo,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      toast({
        title: "Success",
        description: "Payment updated successfully",
      });
      setEditDialogOpen(false);
      setHistoryDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update payment",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePayment = async () => {
    if (!deletingPaymentId) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/payments?id=${deletingPaymentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      toast({
        title: "Success",
        description: "Payment deleted successfully",
      });
      setDeleteDialogOpen(false);
      setHistoryDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete payment",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
      setDeletingPaymentId(null);
    }
  };

  const handleOpenAdmissionChargePayment = (student: StudentFeeData, admission: AdmissionInfo) => {
    setAdmissionChargeStudent(student);
    setSelectedAdmissionForCharge(admission);
    setChargePaymentAmount(admission.admission_charge_pending.toString());
    setChargePaymentMode("CASH");
    setChargeReceiptNo("");
    setAdmissionChargePaymentOpen(true);
  };

  const handleSubmitAdmissionChargePayment = async () => {
    if (!admissionChargeStudent || !selectedAdmissionForCharge || !chargePaymentAmount || !chargeReceiptNo) {
      toast({
        title: "Missing fields",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(chargePaymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return;
    }

    if (amount > selectedAdmissionForCharge.admission_charge_pending) {
      toast({
        title: "Amount too high",
        description: "Payment amount cannot exceed pending admission charge",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/payments/admission-charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: admissionChargeStudent.studentId,
          admissionId: selectedAdmissionForCharge.id,
          amount: amount,
          mode: chargePaymentMode,
          receipt_no: chargeReceiptNo,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      toast({
        title: "Success",
        description: "Admission charge payment recorded successfully",
      });
      setAdmissionChargePaymentOpen(false);
      setAdmissionChargeStudent(null);
      setSelectedAdmissionForCharge(null);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to record payment",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ==================== UTILITY FUNCTIONS ====================

  const getFeeModelLabel = (model: string | null) => {
    switch (model) {
      case "ONE_TIME": return "One-time";
      case "MONTHLY": return "Monthly";
      case "QUARTERLY": return "Quarterly";
      case "CUSTOM": return "Custom";
      default: return "-";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split("-");
    const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  // Calculate tab-specific totals
  const batchFeesPendingTotal = filteredData.reduce((sum, s) => sum + s.totalBatchFeesPending, 0);
  const admissionChargePendingTotal = filteredData.reduce((sum, s) => sum + s.totalAdmissionChargePending, 0);

  // ==================== RENDER ====================

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Fees Management</h1>
        <p className="text-muted-foreground">Manage student fees and payments - Batch Fees & Admission Charges</p>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="batch-fees" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Batch Fees
            {batchFeesPendingTotal > 0 && (
              <Badge variant="secondary" className="ml-1 bg-amber-100 text-amber-800">
                ₹{batchFeesPendingTotal.toLocaleString()}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="admission-charges" className="flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            Admission Charges
            {admissionChargePendingTotal > 0 && (
              <Badge variant="secondary" className="ml-1 bg-red-100 text-red-800">
                ₹{admissionChargePendingTotal.toLocaleString()}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <Card className="mt-4">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-[200px]">
                <Select value={batchFilter} onValueChange={setBatchFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by batch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Batches</SelectItem>
                    {batches.map(batch => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.name} - {batch.subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[150px]">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ==================== BATCH FEES TAB ==================== */}
        <TabsContent value="batch-fees" className="space-y-4">
          {/* Summary Cards for Batch Fees */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Students with Batch Fees</CardDescription>
                <CardTitle className="text-2xl">{batchFeesStudents.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Batch Fees Pending</CardDescription>
                <CardTitle className="text-2xl text-red-600">
                  ₹{batchFeesPendingTotal.toLocaleString()}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Batch Fees Collected</CardDescription>
                <CardTitle className="text-2xl text-green-600">
                  ₹{filteredData.reduce((sum, s) => sum + (s.totalCalculatedFees - s.totalBatchFeesPending), 0).toLocaleString()}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Batch Fees Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Batch Fees
              </CardTitle>
              <CardDescription>
                Recurring batch fees (Monthly/Quarterly). Payments must be for complete billing periods.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : batchFeesStudents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No students with batch fees found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Batch(es)</TableHead>
                      <TableHead className="text-right">Total Batch Fees</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Pending</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batchFeesStudents.map((student) => (
                      <TableRow key={student.studentId}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{student.studentName}</div>
                            <div className="text-sm text-muted-foreground">{student.phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {student.admissions.map((adm) => (
                              <div key={adm.id} className="text-sm">
                                <span>{adm.batchName}</span>
                                {adm.feeModel && (
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    {getFeeModelLabel(adm.feeModel)}
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₹{student.totalCalculatedFees.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          ₹{(student.totalCalculatedFees - student.totalBatchFeesPending).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          ₹{student.totalBatchFeesPending.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {student.totalBatchFeesPending === 0 ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>
                          ) : student.totalCalculatedFees > student.totalBatchFeesPending ? (
                            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Partial</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => {
                                setMonthBasedPaymentStudent(student);
                                setMonthBasedPaymentOpen(true);
                              }}
                              disabled={student.totalBatchFeesPending === 0}
                            >
                              <Calendar className="h-4 w-4 mr-1" />
                              Pay Months
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenHistoryDialog(student)}
                            >
                              <History className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== ADMISSION CHARGES TAB ==================== */}
        <TabsContent value="admission-charges" className="space-y-4">
          {/* Summary Cards for Admission Charges */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Students with Admission Charges</CardDescription>
                <CardTitle className="text-2xl">{admissionChargeStudents.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Admission Charges Pending</CardDescription>
                <CardTitle className="text-2xl text-red-600">
                  ₹{admissionChargePendingTotal.toLocaleString()}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Admission Charges Collected</CardDescription>
                <CardTitle className="text-2xl text-green-600">
                  ₹{filteredData.reduce((sum, s) => sum + (s.totalAdmissionCharge - s.totalAdmissionChargePending), 0).toLocaleString()}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Admission Charges Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                Admission Charges
              </CardTitle>
              <CardDescription>
                One-time admission charges. Partial/custom amounts can be paid.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : admissionChargeStudents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No students with admission charges found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead className="text-right">Admission Charge</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Pending</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admissionChargeStudents.map((student) => (
                      student.admissions
                        .filter(adm => adm.admission_charge > 0)
                        .map((adm) => (
                          <TableRow key={`${student.studentId}-${adm.id}`}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{student.studentName}</div>
                                <div className="text-sm text-muted-foreground">{student.phone}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <span>{adm.batchName}</span>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  Admitted: {formatDate(adm.admission_date)}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              ₹{adm.admission_charge.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right text-green-600">
                              ₹{(adm.admission_charge - adm.admission_charge_pending).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right text-red-600">
                              ₹{adm.admission_charge_pending.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {adm.admission_charge_pending === 0 ? (
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>
                              ) : adm.admission_charge > adm.admission_charge_pending ? (
                                <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Partial</Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Pending</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleOpenAdmissionChargePayment(student, adm)}
                                  disabled={adm.admission_charge_pending === 0}
                                >
                                  <CreditCard className="h-4 w-4 mr-1" />
                                  Pay
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenHistoryDialog(student)}
                                >
                                  <History className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ==================== DIALOGS ==================== */}

      {/* Payment History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Payment History</DialogTitle>
            <DialogDescription>
              All payments for {historyStudent?.studentName}
            </DialogDescription>
          </DialogHeader>
          {historyStudent && (
            <div className="space-y-4 py-4">
              {/* Summary showing both batch fees and admission charges */}
              <div className="bg-muted/50 p-3 rounded-lg space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Batch Fees
                    </h4>
                    <div className="grid grid-cols-2 gap-2 pl-6">
                      <div>
                        <span className="text-muted-foreground">Total:</span>
                        <p className="font-medium">₹{historyStudent.totalCalculatedFees.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Pending:</span>
                        <p className="font-medium text-red-600">₹{historyStudent.totalBatchFeesPending.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Ticket className="h-4 w-4" />
                      Admission Charges
                    </h4>
                    <div className="grid grid-cols-2 gap-2 pl-6">
                      <div>
                        <span className="text-muted-foreground">Total:</span>
                        <p className="font-medium">₹{historyStudent.totalAdmissionCharge.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Pending:</span>
                        <p className="font-medium text-red-600">₹{historyStudent.totalAdmissionChargePending.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Paid:</span>
                    <span className="font-medium text-green-600">₹{historyStudent.totalPaid.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {historyStudent.payments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No payments recorded yet
                </div>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {historyStudent.payments.map((payment) => (
                    <Card key={payment.id}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-medium">₹{payment.amount.toLocaleString()}</div>
                            <div className="text-sm text-muted-foreground">{formatDate(payment.date)}</div>
                          </div>
                          <Badge variant="outline">{payment.mode}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          Receipt: {payment.receipt_no}
                        </div>
                        {payment.coveredMonths && payment.coveredMonths.length > 0 && (
                          <div className="mt-2 pt-2 border-t">
                            <div className="text-xs text-muted-foreground mb-1">Covered Months:</div>
                            <div className="flex flex-wrap gap-1">
                              {payment.coveredMonths.map((month) => (
                                <Badge key={month} variant="outline" className="text-xs">
                                  {formatMonth(month)}
                                </Badge>
                              ))}
                            </div>
                            {payment.coveredFromDate && payment.coveredToDate && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {formatDate(payment.coveredFromDate)} - {formatDate(payment.coveredToDate)}
                              </div>
                            )}
                          </div>
                        )}
                        <div className="flex justify-end gap-1 mt-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditDialog(payment)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              setDeletingPaymentId(payment.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setHistoryDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Payment Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Payment</DialogTitle>
            <DialogDescription>Update payment details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-amount">Amount</Label>
              <Input
                id="edit-amount"
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-mode">Payment Mode</Label>
              <Select value={editMode} onValueChange={setEditMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="BANK">Bank Transfer</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-receipt">Receipt Number</Label>
              <Input
                id="edit-receipt"
                value={editReceiptNo}
                onChange={(e) => setEditReceiptNo(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePayment} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Payment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this payment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePayment} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admission Charge Payment Dialog */}
      <Dialog open={admissionChargePaymentOpen} onOpenChange={setAdmissionChargePaymentOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Pay Admission Charge</DialogTitle>
            <DialogDescription>
              Record admission charge payment for {admissionChargeStudent?.studentName}
              {selectedAdmissionForCharge && (
                <span className="block mt-1 text-foreground font-medium">
                  {selectedAdmissionForCharge.batchName}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Payment Summary */}
            {selectedAdmissionForCharge && (
              <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Admission Charge:</span>
                  <span className="font-medium">₹{selectedAdmissionForCharge.admission_charge.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Already Paid:</span>
                  <span className="font-medium text-green-600">
                    ₹{(selectedAdmissionForCharge.admission_charge - selectedAdmissionForCharge.admission_charge_pending).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="text-muted-foreground">Pending:</span>
                  <span className="font-medium text-red-600">
                    ₹{selectedAdmissionForCharge.admission_charge_pending.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="charge-amount">
                Payment Amount <span className="text-destructive">*</span>
              </Label>
              <Input
                id="charge-amount"
                type="number"
                value={chargePaymentAmount}
                onChange={(e) => setChargePaymentAmount(e.target.value)}
                min="1"
                max={selectedAdmissionForCharge?.admission_charge_pending}
                placeholder="Enter amount"
              />
              <p className="text-xs text-muted-foreground">
                You can pay any amount up to ₹{selectedAdmissionForCharge?.admission_charge_pending.toLocaleString()}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="charge-mode">Payment Mode</Label>
              <Select value={chargePaymentMode} onValueChange={setChargePaymentMode}>
                <SelectTrigger id="charge-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="BANK">Bank Transfer</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="charge-receipt">
                Receipt No. <span className="text-destructive">*</span>
              </Label>
              <Input
                id="charge-receipt"
                value={chargeReceiptNo}
                onChange={(e) => setChargeReceiptNo(e.target.value)}
                placeholder="REC-001"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdmissionChargePaymentOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitAdmissionChargePayment}
              disabled={submitting || !chargePaymentAmount || !chargeReceiptNo}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Receipt className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Month-Based Payment Dialog for Batch Fees */}
      {monthBasedPaymentStudent && (
        <MonthBasedPaymentDialog
          open={monthBasedPaymentOpen}
          onOpenChange={setMonthBasedPaymentOpen}
          studentId={monthBasedPaymentStudent.studentId}
          studentName={monthBasedPaymentStudent.studentName}
          admissions={monthBasedPaymentStudent.admissions}
          onSuccess={() => {
            fetchData();
            setMonthBasedPaymentStudent(null);
          }}
        />
      )}
    </div>
  );
}
