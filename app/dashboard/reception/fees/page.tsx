"use client";

import { useState, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { 
  History, 
  Loader2, 
  Pencil, 
  Plus, 
  Search, 
  Trash2,
  IndianRupee,
  AlertCircle,
  Calendar,
  RefreshCw
} from "lucide-react";

// ==================== TYPES ====================

interface AdmissionInfo {
  id: string;
  batchId: string | null;
  batchName: string;
  total_fees: number;
  fees_pending: number;
  feeModel: string | null;
  admission_date: string;
}

interface PaymentInfo {
  id: string;
  amount: number;
  date: string;
  mode: string;
  receipt_no: string;
}

interface StudentFeeData {
  studentId: string;
  studentName: string;
  email: string;
  phone: string;
  admissions: AdmissionInfo[];
  payments: PaymentInfo[];
  totalFees: number;
  totalPaid: number;
  totalPending: number;
}

interface Batch {
  id: string;
  name: string;
  subject: string;
}

interface RecurringFeeData {
  id: string;
  admissionId: string;
  studentId: string;
  studentName: string;
  studentPhone: string;
  batchId: string;
  batchName: string;
  feeModel: string;
  periodNumber: number;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  amount: number;
  isPaid: boolean;
  paidAt: string | null;
  paymentId: string | null;
  payment: { id: string; receipt_no: string; mode: string; date: string } | null;
  status: 'paid' | 'pending' | 'overdue';
  admissionDate: string;
}

// ==================== MAIN COMPONENT ====================

export default function FeesManagementPage() {
  const [activeTab, setActiveTab] = useState("admission");
  const [feesData, setFeesData] = useState<StudentFeeData[]>([]);
  const [recurringFeesData, setRecurringFeesData] = useState<RecurringFeeData[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [recurringLoading, setRecurringLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [batchFilter, setBatchFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  // Payment Dialog State (Admission Fees)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentFeeData | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [receiptNo, setReceiptNo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // History Dialog State
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyStudent, setHistoryStudent] = useState<StudentFeeData | null>(null);

  // Edit Payment Dialog State
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentInfo | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editMode, setEditMode] = useState("");
  const [editReceiptNo, setEditReceiptNo] = useState("");

  // Delete Confirmation State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);

  // Recurring Fee Payment Dialog State
  const [recurringPayDialogOpen, setRecurringPayDialogOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<RecurringFeeData | null>(null);
  const [recurringPaymentMode, setRecurringPaymentMode] = useState("CASH");
  const [recurringReceiptNo, setRecurringReceiptNo] = useState("");

  // ==================== DATA FETCHING ====================

  useEffect(() => {
    fetchData();
    fetchRecurringFees();
  }, []);

  const fetchData = async () => {
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
  };

  const fetchRecurringFees = async () => {
    setRecurringLoading(true);
    try {
      const res = await fetch("/api/recurring-fees");
      if (res.ok) {
        const data = await res.json();
        setRecurringFeesData(data);
      }
    } catch (error) {
      console.error("Error fetching recurring fees:", error);
      toast({
        title: "Error",
        description: "Failed to fetch recurring fees",
        variant: "destructive",
      });
    } finally {
      setRecurringLoading(false);
    }
  };

  // ==================== FILTERS ====================

  const filteredData = feesData.filter(student => {
    const matchesSearch = 
      student.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.phone.includes(searchQuery) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBatch = 
      batchFilter === "all" ||
      student.admissions.some(adm => adm.batchId === batchFilter);

    const matchesStatus = 
      statusFilter === "all" ||
      (statusFilter === "pending" && student.totalPending > 0) ||
      (statusFilter === "paid" && student.totalPending === 0);

    return matchesSearch && matchesBatch && matchesStatus;
  });

  const filteredRecurringData = recurringFeesData.filter(item => {
    const matchesSearch = 
      item.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.studentPhone.includes(searchQuery);

    const matchesBatch = 
      batchFilter === "all" || item.batchId === batchFilter;

    const matchesStatus = 
      statusFilter === "all" ||
      item.status === statusFilter;

    return matchesSearch && matchesBatch && matchesStatus;
  });

  // ==================== ADMISSION FEES HANDLERS ====================

  const handleOpenPaymentDialog = (student: StudentFeeData) => {
    setSelectedStudent(student);
    setPaymentAmount("");
    setPaymentMode("CASH");
    setReceiptNo("");
    setPaymentDialogOpen(true);
  };

  const handleOpenHistoryDialog = (student: StudentFeeData) => {
    setHistoryStudent(student);
    setHistoryDialogOpen(true);
  };

  const handleRecordPayment = async () => {
    if (!selectedStudent || !paymentAmount || !receiptNo) {
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent.studentId,
          amount: parseFloat(paymentAmount),
          mode: paymentMode,
          receipt_no: receiptNo,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });
      setPaymentDialogOpen(false);
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

  // ==================== RECURRING FEES HANDLERS ====================

  const handleOpenRecurringPayDialog = (period: RecurringFeeData) => {
    setSelectedPeriod(period);
    setRecurringPaymentMode("CASH");
    setRecurringReceiptNo("");
    setRecurringPayDialogOpen(true);
  };

  const handleRecurringPayment = async () => {
    if (!selectedPeriod || !recurringReceiptNo) {
      toast({
        title: "Missing fields",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/recurring-fees/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodId: selectedPeriod.id,
          amount: selectedPeriod.amount,
          mode: recurringPaymentMode,
          receipt_no: recurringReceiptNo,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });
      setRecurringPayDialogOpen(false);
      fetchRecurringFees();
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Overdue</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // ==================== RENDER ====================

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Fees Management</h1>
        <p className="text-muted-foreground">Manage student fees and payments</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="admission">Admission Fees</TabsTrigger>
          <TabsTrigger value="recurring">Recurring Fees</TabsTrigger>
        </TabsList>

        {/* Filters - Common for both tabs */}
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
                    {activeTab === "recurring" && <SelectItem value="overdue">Overdue</SelectItem>}
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {activeTab === "recurring" && (
                <Button variant="outline" onClick={fetchRecurringFees} disabled={recurringLoading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${recurringLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ==================== ADMISSION FEES TAB ==================== */}
        <TabsContent value="admission" className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Students</CardDescription>
                <CardTitle className="text-2xl">{filteredData.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Pending</CardDescription>
                <CardTitle className="text-2xl text-red-600">
                  ₹{filteredData.reduce((sum, s) => sum + s.totalPending, 0).toLocaleString()}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Collected</CardDescription>
                <CardTitle className="text-2xl text-green-600">
                  ₹{filteredData.reduce((sum, s) => sum + s.totalPaid, 0).toLocaleString()}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>Student Fees</CardTitle>
              <CardDescription>
                View and manage admission fees for all students
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No students found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Batch(es)</TableHead>
                      <TableHead className="text-right">Total Fees</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Pending</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((student) => (
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
                          ₹{student.totalFees.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          ₹{student.totalPaid.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          ₹{student.totalPending.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {student.totalPending === 0 ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>
                          ) : student.totalPaid > 0 ? (
                            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Partial</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenPaymentDialog(student)}
                              disabled={student.totalPending === 0}
                            >
                              <Plus className="h-4 w-4 mr-1" />
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
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== RECURRING FEES TAB ==================== */}
        <TabsContent value="recurring" className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Periods</CardDescription>
                <CardTitle className="text-2xl">{filteredRecurringData.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Overdue</CardDescription>
                <CardTitle className="text-2xl text-red-600">
                  {filteredRecurringData.filter(r => r.status === 'overdue').length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Pending Amount</CardDescription>
                <CardTitle className="text-2xl text-yellow-600">
                  ₹{filteredRecurringData.filter(r => !r.isPaid).reduce((sum, r) => sum + r.amount, 0).toLocaleString()}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Collected</CardDescription>
                <CardTitle className="text-2xl text-green-600">
                  ₹{filteredRecurringData.filter(r => r.isPaid).reduce((sum, r) => sum + r.amount, 0).toLocaleString()}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Recurring Fees Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recurring Fees</CardTitle>
              <CardDescription>
                Monthly and quarterly fee periods for students
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recurringLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredRecurringData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No recurring fees found</p>
                  <p className="text-sm">Students in Monthly/Quarterly batches will appear here</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Period Dates</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecurringData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.studentName}</div>
                            <div className="text-sm text-muted-foreground">{item.studentPhone}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-sm">{item.batchName}</div>
                            <Badge variant="outline" className="text-xs mt-1">
                              {item.feeModel}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{item.periodLabel}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(item.periodStart)} - {formatDate(item.periodEnd)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₹{item.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(item.status)}
                          {item.isPaid && item.payment && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Receipt: {item.payment.receipt_no}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!item.isPaid && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenRecurringPayDialog(item)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Pay
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ==================== DIALOGS ==================== */}

      {/* Record Payment Dialog (Admission) */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a new payment for {selectedStudent?.studentName}
            </DialogDescription>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4 py-4">
              <div className="bg-muted/50 p-3 rounded-lg space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Fees:</span>
                  <span className="font-medium">₹{selectedStudent.totalFees.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Already Paid:</span>
                  <span className="font-medium text-green-600">₹{selectedStudent.totalPaid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pending:</span>
                  <span className="font-medium text-red-600">₹{selectedStudent.totalPending.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="pl-10"
                    min="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mode">Payment Mode</Label>
                <Select value={paymentMode} onValueChange={setPaymentMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="BANK">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="receipt">Receipt Number</Label>
                <Input
                  id="receipt"
                  placeholder="Enter receipt number"
                  value={receiptNo}
                  onChange={(e) => setReceiptNo(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRecordPayment} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total Fees:</span>
                    <p className="font-medium">₹{historyStudent.totalFees.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Paid:</span>
                    <p className="font-medium text-green-600">₹{historyStudent.totalPaid.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Pending:</span>
                    <p className="font-medium text-red-600">₹{historyStudent.totalPending.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {historyStudent.payments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  No payments recorded yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Receipt</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyStudent.payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{formatDate(payment.date)}</TableCell>
                        <TableCell className="font-medium">₹{payment.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{payment.mode}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{payment.receipt_no}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="edit-amount"
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="pl-10"
                  min="0"
                />
              </div>
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

      {/* Recurring Fee Payment Dialog */}
      <Dialog open={recurringPayDialogOpen} onOpenChange={setRecurringPayDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Record Period Payment</DialogTitle>
            <DialogDescription>
              Pay for {selectedPeriod?.periodLabel} - {selectedPeriod?.studentName}
            </DialogDescription>
          </DialogHeader>
          {selectedPeriod && (
            <div className="space-y-4 py-4">
              <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Student:</span>
                  <span className="font-medium">{selectedPeriod.studentName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Batch:</span>
                  <span className="font-medium">{selectedPeriod.batchName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Period:</span>
                  <span className="font-medium">{selectedPeriod.periodLabel}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Dates:</span>
                  <span className="font-medium">
                    {formatDate(selectedPeriod.periodStart)} - {formatDate(selectedPeriod.periodEnd)}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-bold text-lg">₹{selectedPeriod.amount.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recurring-mode">Payment Mode</Label>
                <Select value={recurringPaymentMode} onValueChange={setRecurringPaymentMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="BANK">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recurring-receipt">Receipt Number</Label>
                <Input
                  id="recurring-receipt"
                  placeholder="Enter receipt number"
                  value={recurringReceiptNo}
                  onChange={(e) => setRecurringReceiptNo(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecurringPayDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRecurringPayment} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
