"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { IndianRupee, Loader2, Calendar } from "lucide-react";
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
  const { toast } = useToast();

  const selectedAdmission = admissions.find((a) => a.id === selectedAdmissionId);

  // Fetch pending fees when admission is selected
  useEffect(() => {
    if (selectedAdmissionId && open) {
      fetchPendingFees();
    } else {
      setPendingData(null);
      setSelectedMonths(new Set());
    }
  }, [selectedAdmissionId, open]);

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

  const handleMonthToggle = (month: string) => {
    const newSelected = new Set(selectedMonths);
    if (newSelected.has(month)) {
      newSelected.delete(month);
    } else {
      newSelected.add(month);
    }
    setSelectedMonths(newSelected);
  };

  const handleSelectAllPending = () => {
    if (!pendingData) return;
    setSelectedMonths(new Set(pendingData.pendingMonths));
  };

  const handleSelectAllFuture = () => {
    if (!pendingData || !pendingData.futureMonths) return;
    setSelectedMonths(new Set(pendingData.futureMonths));
  };

  const handleSelectAll = () => {
    if (!pendingData) return;
    const allSelectable = [
      ...pendingData.pendingMonths,
      ...(pendingData.futureMonths || []),
    ];
    setSelectedMonths(new Set(allSelectable));
  };

  const handleClearSelection = () => {
    setSelectedMonths(new Set());
  };

  const calculateTotalAmount = () => {
    if (!pendingData || selectedMonths.size === 0) return 0;
    return selectedMonths.size * pendingData.monthlyFee;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Payment - Month Selection</DialogTitle>
          <DialogDescription>
            Record payment for {studentName} by selecting specific months
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Admission Selection */}
          <div className="space-y-2">
            <Label htmlFor="admission">Select Admission</Label>
            <Select value={selectedAdmissionId} onValueChange={setSelectedAdmissionId}>
              <SelectTrigger id="admission">
                <SelectValue placeholder="Select an admission" />
              </SelectTrigger>
              <SelectContent>
                {eligibleAdmissions.map((adm) => (
                  <SelectItem key={adm.id} value={adm.id}>
                    {adm.batchName} ({adm.feeModel})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {eligibleAdmissions.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No admissions with MONTHLY or QUARTERLY fee model found
              </p>
            )}
          </div>

          {/* Pending Fees Info */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}

          {pendingData && !loading && (
            <>
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Monthly Fee:</span>
                  <span className="font-medium">₹{pendingData.monthlyFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Months:</span>
                  <span className="font-medium">{pendingData.totalMonths}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Paid Months:</span>
                  <span className="font-medium text-green-600">{pendingData.coveredMonths}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pending Months:</span>
                  <span className="font-medium text-red-600">{pendingMonths.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Pending:</span>
                  <span className="font-medium text-red-600">
                    ₹{pendingData.pendingAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Paid Months Display */}
              {paidMonths.length > 0 && (
                <div className="space-y-2">
                  <Label>Paid Months</Label>
                  <div className="flex flex-wrap gap-2">
                    {paidMonths.map((month) => (
                      <Badge key={month} variant="outline" className="bg-green-50 text-green-700">
                        ✅ {formatMonth(month)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Month Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Select Months to Pay</Label>
                  <div className="flex gap-2">
                    {pendingMonths.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAllPending}
                      >
                        Select All Pending
                      </Button>
                    )}
                    {futureMonths.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAllFuture}
                      >
                        Select All Future
                      </Button>
                    )}
                    {(pendingMonths.length > 0 || futureMonths.length > 0) && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                      >
                        Select All
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleClearSelection}
                      disabled={selectedMonths.size === 0}
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                {pendingMonths.length === 0 && futureMonths.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    All months are paid! 🎉
                  </p>
                ) : (
                  <div className="space-y-4">
                    {/* Pending Months Section */}
                    {pendingMonths.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label className="text-red-600 font-semibold">
                            Pending Months (Due)
                          </Label>
                          <Badge variant="outline" className="bg-red-50 text-red-700">
                            {pendingMonths.length} month{pendingMonths.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <div className="border border-red-200 rounded-lg p-4 max-h-60 overflow-y-auto space-y-2 bg-red-50/30">
                          {pendingMonths.map((month) => (
                            <div
                              key={month}
                              className="flex items-center space-x-2 p-2 hover:bg-red-100/50 rounded"
                            >
                              <Checkbox
                                id={`pending-${month}`}
                                checked={selectedMonths.has(month)}
                                onCheckedChange={() => handleMonthToggle(month)}
                              />
                              <Label
                                htmlFor={`pending-${month}`}
                                className="flex-1 cursor-pointer flex items-center justify-between"
                              >
                                <span className="font-medium">{formatMonth(month)}</span>
                                <span className="text-sm text-red-600 font-semibold">
                                  ₹{pendingData.monthlyFee.toLocaleString()}
                                </span>
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Future Months Section (Advance Payment) */}
                    {futureMonths.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label className="text-blue-600 font-semibold">
                            Future Months (Advance Payment)
                          </Label>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {futureMonths.length} month{futureMonths.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <div className="border border-blue-200 rounded-lg p-4 max-h-60 overflow-y-auto space-y-2 bg-blue-50/30">
                          {futureMonths.map((month) => (
                            <div
                              key={month}
                              className="flex items-center space-x-2 p-2 hover:bg-blue-100/50 rounded"
                            >
                              <Checkbox
                                id={`future-${month}`}
                                checked={selectedMonths.has(month)}
                                onCheckedChange={() => handleMonthToggle(month)}
                              />
                              <Label
                                htmlFor={`future-${month}`}
                                className="flex-1 cursor-pointer flex items-center justify-between"
                              >
                                <span className="font-medium">{formatMonth(month)}</span>
                                <span className="text-sm text-blue-600 font-semibold">
                                  ₹{pendingData.monthlyFee.toLocaleString()}
                                </span>
                              </Label>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground italic">
                          💡 You can pay for future months in advance. These months will be marked as paid and won't appear as pending when they arrive.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Selected Months Summary */}
              {selectedMonths.size > 0 && (
                <div className="bg-blue-50 p-3 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Selected Months:</span>
                    <span className="font-medium">{selectedMonths.size}</span>
                  </div>
                  {(() => {
                    const selectedPending = Array.from(selectedMonths).filter(m => pendingMonths.includes(m)).length;
                    const selectedFuture = Array.from(selectedMonths).filter(m => futureMonths.includes(m)).length;
                    return (
                      <>
                        {selectedPending > 0 && (
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Pending:</span>
                            <span className="text-red-600 font-medium">{selectedPending}</span>
                          </div>
                        )}
                        {selectedFuture > 0 && (
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Advance Payment:</span>
                            <span className="text-blue-600 font-medium">{selectedFuture}</span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                  <div className="flex justify-between text-sm pt-1 border-t">
                    <span className="text-muted-foreground font-semibold">Total Amount:</span>
                    <span className="font-bold text-lg text-blue-700">
                      ₹{calculateTotalAmount().toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Payment Details */}
              <div className="space-y-4 border-t pt-4">
                <div className="space-y-2">
                  <Label htmlFor="mode">Payment Mode</Label>
                  <Select value={paymentMode} onValueChange={setPaymentMode}>
                    <SelectTrigger id="mode">
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
                  <Label htmlFor="receipt">Receipt Number *</Label>
                  <Input
                    id="receipt"
                    value={receiptNo}
                    onChange={(e) => setReceiptNo(e.target.value)}
                    placeholder="REC-001"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional notes about this payment"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || selectedMonths.size === 0}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Recording...
              </>
            ) : (
              <>
                <IndianRupee className="mr-2 h-4 w-4" />
                Record Payment
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
