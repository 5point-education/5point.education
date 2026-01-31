"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Calendar, CheckCircle2, Clock, Receipt } from "lucide-react";
import { formatMonth } from "@/lib/fees-utils";

interface Admission {
  id: string;
  batchId: string | null;
  batchName: string;
  total_fees: number;
  fees_pending: number;
  feeModel: string | null;
  admission_date: string;
}

interface PendingFeesData {
  admissionId: string;
  totalMonths: number;
  coveredMonths: number;
  pendingMonths: string[];
  pendingAmount: number;
  monthlyFee: number;
  calculationEndDate: string;
  allMonths: string[];
  coveredMonthsList: string[];
  futureMonths?: string[]; // Months available for advance payment
  discount_value?: number; // Fixed discount amount applied
  discount_type?: string | null; // Discount reason
  feeModel?: string; // MONTHLY, QUARTERLY, ONE_TIME
  actualFee?: number; // Actual fee based on fee model (before monthly conversion)
  baseFeeBeforeDiscount?: number; // Original fee before discount
}

interface MonthBasedPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
  admissions: Admission[];
  onSuccess: () => void;
}

export function MonthBasedPaymentDialog({
  open,
  onOpenChange,
  studentId,
  studentName,
  admissions,
  onSuccess,
}: MonthBasedPaymentDialogProps) {
  const [selectedAdmissionId, setSelectedAdmissionId] = useState<string>("");
  const [pendingData, setPendingData] = useState<PendingFeesData | null>(null);
  const [selectedMonths, setSelectedMonths] = useState<Set<string>>(new Set());
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [receiptNo, setReceiptNo] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showAdvancePayment, setShowAdvancePayment] = useState(false);
  const { toast } = useToast();

  const selectedAdmission = admissions.find((a) => a.id === selectedAdmissionId);

  // Fetch pending fees when admission is selected
  useEffect(() => {
    const fetchPendingFees = async () => {
      if (!selectedAdmissionId) return;

      setLoading(true);
      try {
        const response = await fetch(`/api/fees/pending?admissionId=${selectedAdmissionId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch pending fees");
        }
        const data = await response.json();
        setPendingData(data);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to fetch pending fees",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (selectedAdmissionId && open) {
      fetchPendingFees();
    } else {
      setPendingData(null);
      setSelectedMonths(new Set());
      setShowAdvancePayment(false);
    }
  }, [selectedAdmissionId, open, toast]);

  const handleMonthToggle = (month: string) => {
    const newSelected = new Set(selectedMonths);
    if (newSelected.has(month)) {
      newSelected.delete(month);
    } else {
      newSelected.add(month);
    }
    setSelectedMonths(newSelected);
  };

  const handleSelectAllDue = () => {
    if (!pendingData) return;
    // Keep future months if already selected, but ensure all pending are selected
    const futureSelected = Array.from(selectedMonths).filter(m => pendingData.futureMonths?.includes(m));
    const newSelection = new Set([...pendingData.pendingMonths, ...futureSelected]);
    setSelectedMonths(newSelection);
  };

  const handleClearSelection = () => {
    setSelectedMonths(new Set());
  };

  const calculateTotalAmount = () => {
    if (!pendingData || selectedMonths.size === 0) return 0;
    return selectedMonths.size * pendingData.monthlyFee;
  };

  const handleAdmissionChange = (val: string) => {
    setSelectedAdmissionId(val);
    setPendingData(null);
    setSelectedMonths(new Set());
  };

  const handleSubmit = async () => {
    if (!selectedAdmissionId || selectedMonths.size === 0 || !receiptNo) {
      toast({
        title: "Missing fields",
        description: "Please select admission, months, and enter receipt number",
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
          studentId,
          admissionId: selectedAdmissionId,
          amount: calculateTotalAmount(),
          mode: paymentMode,
          receipt_no: receiptNo,
          months: Array.from(selectedMonths),
          notes: notes || undefined,
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

      // Reset form
      setSelectedAdmissionId("");
      setSelectedMonths(new Set());
      setReceiptNo("");
      setNotes("");
      setPaymentMode("CASH");
      setShowAdvancePayment(false);

      onOpenChange(false);
      onSuccess();
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

  // Filter admissions that support month-based payments
  const eligibleAdmissions = admissions.filter(
    (adm) => adm.feeModel === "MONTHLY" || adm.feeModel === "QUARTERLY"
  );

  const paidMonths = pendingData?.coveredMonthsList || [];
  const pendingMonths = pendingData?.pendingMonths || [];
  const futureMonths = pendingData?.futureMonths || [];
  const allSelectableMonths = [...pendingMonths, ...futureMonths];

  const selectedPendingCount = Array.from(selectedMonths).filter(m => pendingMonths.includes(m)).length;
  const selectedFutureCount = Array.from(selectedMonths).filter(m => futureMonths.includes(m)).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-muted/30">
          <DialogTitle className="text-xl">Record Payment</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Recording payment for{" "}
            <span className="font-medium text-foreground">{studentName}</span>
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Step 1: Select Admission */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                1
              </div>
              <Label className="text-base font-medium">Select Admission</Label>
            </div>
            <Select
              value={selectedAdmissionId}
              onValueChange={handleAdmissionChange}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Choose a batch..." />
              </SelectTrigger>
              <SelectContent>
                {eligibleAdmissions.map((adm) => (
                  <SelectItem key={adm.id} value={adm.id} className="py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{adm.batchName}</span>
                      <Badge variant="outline" className="text-xs font-normal ml-2">{adm.feeModel}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {eligibleAdmissions.length === 0 && (
              <p className="text-xs text-muted-foreground ml-8">No eligible admissions found (Monthly/Quarterly only).</p>
            )}
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {pendingData && !loading && (
            <>
              {/* Fee Summary Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">
                    {pendingData.feeModel === "QUARTERLY" ? "Quarterly Fee" : "Monthly Fee"}
                  </p>
                  {/* Show actual fee for quarterly, monthly fee for monthly */}
                  {pendingData.feeModel === "QUARTERLY" ? (
                    <>
                      {pendingData.discount_value && pendingData.discount_value > 0 ? (
                        <>
                          <p className="text-xs text-muted-foreground line-through">
                            Rs. {pendingData.baseFeeBeforeDiscount?.toLocaleString()}
                          </p>
                          <p className="font-semibold text-primary">
                            Rs. {pendingData.actualFee?.toLocaleString()}
                          </p>
                          <p className="text-xs text-emerald-600 mt-1">
                            ₹{pendingData.discount_value} off
                            {pendingData.discount_type && ` (${pendingData.discount_type})`}
                          </p>
                        </>
                      ) : (
                        <p className="font-semibold">
                          Rs. {pendingData.actualFee?.toLocaleString()}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="font-semibold">
                        Rs. {pendingData.monthlyFee.toLocaleString()}
                      </p>
                      {pendingData.discount_value && pendingData.discount_value > 0 && (
                        <p className="text-xs text-emerald-600 mt-1">
                          ₹{pendingData.discount_value} off/month
                          {pendingData.discount_type && ` (${pendingData.discount_type})`}
                        </p>
                      )}
                    </>
                  )}
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">
                    Total Months
                  </p>
                  <p className="font-semibold">{pendingData.totalMonths}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-emerald-600 mb-1">Paid</p>
                  <p className="font-semibold text-emerald-700">
                    {pendingData.coveredMonths}
                  </p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-amber-600 mb-1">Pending</p>
                  <p className="font-semibold text-amber-700">
                    {pendingMonths.length}
                  </p>
                </div>
              </div>

              {/* Step 2: Select Months */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                      2
                    </div>
                    <Label className="text-base font-medium">
                      Select Months
                    </Label>
                  </div>
                  <div className="flex gap-2">
                    {pendingMonths.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAllDue}
                        className="text-xs h-8 bg-transparent"
                      >
                        Select Due ({pendingMonths.length})
                      </Button>
                    )}
                    {selectedMonths.size > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClearSelection}
                        className="text-xs h-8"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>

                {/* Paid Months - Compact Display */}
                {paidMonths.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap ml-8">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      Paid:
                    </span>
                    {paidMonths.map((month) => (
                      <div
                        key={month}
                        className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-100"
                      >
                        {formatMonth(month)}
                      </div>
                    ))}
                  </div>
                )}

                {/* Selectable Months */}
                {allSelectableMonths.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
                    <p className="font-medium">All months are paid!</p>
                  </div>
                ) : (
                  <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                    {/* Pending Months */}
                    {pendingMonths.length > 0 && (
                      <div className="p-3 bg-amber-50/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-amber-600" />
                          <span className="text-sm font-medium text-amber-700">
                            Due Months
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {pendingMonths.map((month) => (
                            <label
                              key={month}
                              className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${selectedMonths.has(month)
                                ? "bg-amber-100 border-amber-300"
                                : "bg-background border-transparent hover:bg-amber-100/50"
                                }`}
                            >
                              <Checkbox
                                checked={selectedMonths.has(month)}
                                onCheckedChange={() => handleMonthToggle(month)}
                                className="data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                              />
                              <span className="text-sm font-medium">
                                {formatMonth(month)}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Future Months */}
                    {futureMonths.length > 0 && (
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-muted-foreground">
                              Advance Payment
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Label htmlFor="advance-toggle" className="text-xs text-muted-foreground cursor-pointer">Show Future Months</Label>
                            <Switch id="advance-toggle" checked={showAdvancePayment} onCheckedChange={setShowAdvancePayment} className="scale-75 origin-right" />
                          </div>
                        </div>

                        {showAdvancePayment && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            {futureMonths.map((month) => (
                              <label
                                key={month}
                                className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${selectedMonths.has(month)
                                  ? "bg-primary/10 border-primary/30"
                                  : "bg-background border-transparent hover:bg-muted/50"
                                  }`}
                              >
                                <Checkbox
                                  checked={selectedMonths.has(month)}
                                  onCheckedChange={() => handleMonthToggle(month)}
                                />
                                <span className="text-sm">
                                  {formatMonth(month)}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Step 3: Payment Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    3
                  </div>
                  <Label className="text-base font-medium">
                    Payment Details
                  </Label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mode" className="text-sm">
                      Payment Mode
                    </Label>
                    <Select value={paymentMode} onValueChange={setPaymentMode}>
                      <SelectTrigger id="mode" className="h-10">
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
                    <Label htmlFor="receipt" className="text-sm">
                      Receipt No. <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="receipt"
                      value={receiptNo}
                      onChange={(e) => setReceiptNo(e.target.value)}
                      placeholder="REC-001"
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm">
                    Notes{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional notes..."
                    className="h-10"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer with Summary */}
        <div className="border-t bg-muted/30 px-6 py-4">
          {selectedMonths.size > 0 && (
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-border/50">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {selectedMonths.size} month
                  {selectedMonths.size !== 1 ? "s" : ""} selected
                  {selectedPendingCount > 0 && (
                    <span className="text-amber-600 font-medium">
                      {" "}
                      ({selectedPendingCount} due)
                    </span>
                  )}
                  {selectedFutureCount > 0 && (
                    <span className="text-primary font-medium">
                      {" "}
                      ({selectedFutureCount} advance)
                    </span>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">
                  Rs. {calculateTotalAmount().toLocaleString()}
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                submitting || selectedMonths.size === 0 || !receiptNo.trim()
              }
              className="min-w-32"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <Receipt className="mr-2 h-4 w-4" />
                  Record Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
