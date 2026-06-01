"use client";

import { useState, useEffect, useCallback } from "react";
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
import {
  Loader2,
  CheckCircle2,
  Clock,
  Calendar,
  Receipt,
  Check,
} from "lucide-react";
import { formatMonth } from "@/lib/fees-utils";

// ==================== TYPES ====================

interface BulkPendingData {
  admissionId: string;
  batchId: string | null;
  batchName: string;
  feeModel: string;
  monthlyFee: number;
  actualFee: number;
  baseFeeBeforeDiscount: number;
  discount_value: number;
  discount_type: string | null;
  totalMonths: number;
  coveredMonths: number;
  coveredMonthsList: string[];
  pendingMonths: string[];
  pendingAmount: number;
  futureMonths: string[];
}

interface UnifiedPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
  onSuccess: () => void;
}

// ==================== COMPONENT ====================

export function UnifiedPaymentDialog({
  open,
  onOpenChange,
  studentId,
  studentName,
  onSuccess,
}: UnifiedPaymentDialogProps) {
  // Data state
  const [allPendingData, setAllPendingData] = useState<BulkPendingData[]>([]);
  const [loading, setLoading] = useState(false);

  // Selection state — which batches are checked
  const [selectedAdmissions, setSelectedAdmissions] = useState<Set<string>>(new Set());
  // Per-batch month selections
  const [selectedMonthsMap, setSelectedMonthsMap] = useState<Map<string, Set<string>>>(new Map());
  // Advance payment toggle per batch
  const [showAdvanceMap, setShowAdvanceMap] = useState<Map<string, boolean>>(new Map());

  // Payment state
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [receiptNo, setReceiptNo] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { toast } = useToast();

  // ==================== DATA FETCHING ====================

  const fetchPendingFees = useCallback(async () => {
    if (!studentId || !open) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/fees/pending/bulk?studentId=${studentId}`);
      if (!response.ok) throw new Error("Failed to fetch pending fees");
      const data: BulkPendingData[] = await response.json();
      setAllPendingData(data);

      // Auto-select all batches with pending months + pre-select their pending months
      const autoSelected = new Set<string>();
      const autoMonths = new Map<string, Set<string>>();

      data.forEach((item) => {
        if (item.pendingMonths.length > 0) {
          autoSelected.add(item.admissionId);
          autoMonths.set(item.admissionId, new Set(item.pendingMonths));
        }
      });

      setSelectedAdmissions(autoSelected);
      setSelectedMonthsMap(autoMonths);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch pending fees",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [studentId, open, toast]);

  useEffect(() => {
    if (open) {
      fetchPendingFees();
    } else {
      // Full reset on close
      setAllPendingData([]);
      setSelectedAdmissions(new Set());
      setSelectedMonthsMap(new Map());
      setShowAdvanceMap(new Map());
      setPaymentMode("CASH");
      setReceiptNo("");
      setNotes("");
    }
  }, [open, fetchPendingFees]);

  // ==================== SELECTION LOGIC ====================

  const handleToggleBatch = (admissionId: string) => {
    const next = new Set(selectedAdmissions);
    const nextMonths = new Map(selectedMonthsMap);

    if (next.has(admissionId)) {
      next.delete(admissionId);
      nextMonths.delete(admissionId);
    } else {
      next.add(admissionId);
      // auto-select all pending months
      const item = allPendingData.find((d) => d.admissionId === admissionId);
      if (item) nextMonths.set(admissionId, new Set(item.pendingMonths));
    }

    setSelectedAdmissions(next);
    setSelectedMonthsMap(nextMonths);
  };

  const handleSelectAll = () => {
    if (selectedAdmissions.size === allPendingData.length) {
      setSelectedAdmissions(new Set());
      setSelectedMonthsMap(new Map());
    } else {
      const all = new Set<string>();
      const allM = new Map<string, Set<string>>();
      allPendingData.forEach((item) => {
        all.add(item.admissionId);
        allM.set(item.admissionId, new Set(item.pendingMonths));
      });
      setSelectedAdmissions(all);
      setSelectedMonthsMap(allM);
    }
  };

  const handleToggleMonth = (admissionId: string, month: string) => {
    const nextMonths = new Map(selectedMonthsMap);
    const current = new Set(nextMonths.get(admissionId) || []);

    if (current.has(month)) {
      current.delete(month);
    } else {
      current.add(month);
    }

    nextMonths.set(admissionId, current);
    setSelectedMonthsMap(nextMonths);

    // Sync admission selection
    const nextSelected = new Set(selectedAdmissions);
    if (current.size === 0) {
      nextSelected.delete(admissionId);
    } else {
      nextSelected.add(admissionId);
    }
    setSelectedAdmissions(nextSelected);
  };

  const handleSelectAllDueForBatch = (admissionId: string) => {
    const item = allPendingData.find((d) => d.admissionId === admissionId);
    if (!item) return;

    const nextMonths = new Map(selectedMonthsMap);
    const current = new Set(nextMonths.get(admissionId) || []);
    item.pendingMonths.forEach((m) => current.add(m));
    nextMonths.set(admissionId, current);
    setSelectedMonthsMap(nextMonths);

    if (!selectedAdmissions.has(admissionId)) {
      const next = new Set(selectedAdmissions);
      next.add(admissionId);
      setSelectedAdmissions(next);
    }
  };

  const handleToggleAdvance = (admissionId: string, show: boolean) => {
    const next = new Map(showAdvanceMap);
    next.set(admissionId, show);
    setShowAdvanceMap(next);
  };

  // ==================== CALCULATIONS ====================

  const getSubtotal = (admissionId: string): number => {
    const item = allPendingData.find((d) => d.admissionId === admissionId);
    const months = selectedMonthsMap.get(admissionId);
    if (!item || !months) return 0;
    return months.size * item.monthlyFee;
  };

  const getGrandTotal = (): number => {
    let total = 0;
    selectedAdmissions.forEach((id) => {
      total += getSubtotal(id);
    });
    return total;
  };

  const getTotalMonths = (): number => {
    let total = 0;
    selectedAdmissions.forEach((id) => {
      total += selectedMonthsMap.get(id)?.size || 0;
    });
    return total;
  };

  // ==================== SUBMIT ====================

  const handleSubmit = async () => {
    if (selectedAdmissions.size === 0 || !receiptNo.trim()) {
      toast({
        title: "Missing fields",
        description: "Select at least one batch and enter a receipt number",
        variant: "destructive",
      });
      return;
    }

    const items: { admissionId: string; months: string[] }[] = [];
    selectedAdmissions.forEach((admissionId) => {
      const months = selectedMonthsMap.get(admissionId);
      if (months && months.size > 0) {
        items.push({ admissionId, months: Array.from(months).sort() });
      }
    });

    if (items.length === 0) {
      toast({
        title: "No months selected",
        description: "Select at least one month to pay",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/payments/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          receipt_no: receiptNo,
          mode: paymentMode,
          notes: notes || undefined,
          items,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const result = await response.json();

      toast({
        title: "Payment Recorded",
        description: `${result.paymentsCreated} payment(s) totalling ₹${result.totalAmount.toLocaleString()} recorded successfully`,
      });

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

  // ==================== RENDER ====================

  const allSelected =
    allPendingData.length > 0 &&
    selectedAdmissions.size === allPendingData.length;

  const totalMonths = getTotalMonths();
  const grandTotal = getGrandTotal();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* ── Header ── */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-lg">Record Payment</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Recipient:{" "}
            <span className="font-semibold text-foreground">{studentName}</span>
          </p>
        </DialogHeader>

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : allPendingData.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
              <p className="font-medium text-lg">All Caught Up!</p>
              <p className="text-sm mt-1">No pending batch fees for this student.</p>
            </div>
          ) : (
            <>
              {/* ── Section 1: Select Batches ── */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Select Batches
                  </h3>
                  {allPendingData.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectAll}
                      className="text-xs h-7 px-2"
                    >
                      {allSelected ? "Deselect All" : "Select All"}
                    </Button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {allPendingData.map((item) => {
                    const isSelected = selectedAdmissions.has(item.admissionId);
                    return (
                      <button
                        key={item.admissionId}
                        type="button"
                        onClick={() => handleToggleBatch(item.admissionId)}
                        className={`
                          relative flex flex-col items-start rounded-lg border-2 px-4 py-3
                          transition-all duration-150 text-left min-w-[140px]
                          ${isSelected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border hover:border-muted-foreground/30 bg-background"
                          }
                        `}
                      >
                        {/* Check indicator */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        )}
                        {!isSelected && (
                          <div className="absolute top-2 right-2 h-5 w-5 rounded-full border-2 border-muted-foreground/25" />
                        )}

                        <span className="font-semibold text-sm pr-6 leading-tight">
                          {item.batchName.split(" - ")[0]}
                        </span>
                        <span className="text-[11px] text-muted-foreground mt-0.5">
                          {item.batchName.split(" - ").slice(1).join(" - ") || item.feeModel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* ── Section 2: Due Months ── */}
              {selectedAdmissions.size > 0 && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Due Months
                  </h3>

                  <div className="space-y-4">
                    {allPendingData
                      .filter((item) => selectedAdmissions.has(item.admissionId))
                      .map((item) => {
                        const selectedMonths = selectedMonthsMap.get(item.admissionId);
                        const showAdvance = showAdvanceMap.get(item.admissionId) || false;
                        const subtotal = getSubtotal(item.admissionId);

                        return (
                          <div
                            key={item.admissionId}
                            className="rounded-lg border bg-background p-4 space-y-3"
                          >
                            {/* Batch title + fee */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                                <span className="font-semibold text-sm">
                                  {item.batchName.split(" - ")[0]}
                                </span>
                                {item.discount_value > 0 && (
                                  <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-200 bg-emerald-50">
                                    ₹{item.discount_value} off
                                  </Badge>
                                )}
                              </div>
                              <span className="text-sm text-muted-foreground">
                                ₹{item.monthlyFee.toLocaleString()}/month
                              </span>
                            </div>

                            {/* Paid months summary (compact) */}
                            {item.coveredMonthsList.length > 0 && (
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                  Paid:
                                </span>
                                {item.coveredMonthsList.slice(0, 6).map((month) => (
                                  <span
                                    key={month}
                                    className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-100"
                                  >
                                    {formatMonth(month)}
                                  </span>
                                ))}
                                {item.coveredMonthsList.length > 6 && (
                                  <span className="text-[10px] text-muted-foreground">
                                    +{item.coveredMonthsList.length - 6} more
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Pending months — selectable pills */}
                            {item.pendingMonths.length > 0 && (
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[11px] text-amber-700 font-medium flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {item.pendingMonths.length} month{item.pendingMonths.length !== 1 ? "s" : ""} due
                                  </span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleSelectAllDueForBatch(item.admissionId)}
                                    className="text-[10px] h-6 px-2"
                                  >
                                    Select All Due
                                  </Button>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {item.pendingMonths.map((month) => {
                                    const isChecked = selectedMonths?.has(month) || false;
                                    return (
                                      <button
                                        key={month}
                                        type="button"
                                        onClick={() => handleToggleMonth(item.admissionId, month)}
                                        className={`
                                          px-3 py-1.5 text-xs font-medium rounded-md border transition-all duration-150
                                          ${isChecked
                                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                            : "bg-background border-border text-foreground hover:border-primary/40"
                                          }
                                        `}
                                      >
                                        {formatMonth(month)}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Future months (advance) */}
                            {item.futureMonths.length > 0 && (
                              <div>
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Advance
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <Label
                                      htmlFor={`adv-${item.admissionId}`}
                                      className="text-[10px] text-muted-foreground cursor-pointer"
                                    >
                                      Show
                                    </Label>
                                    <Switch
                                      id={`adv-${item.admissionId}`}
                                      checked={showAdvance}
                                      onCheckedChange={(v) =>
                                        handleToggleAdvance(item.admissionId, v)
                                      }
                                      className="scale-75 origin-right"
                                    />
                                  </div>
                                </div>
                                {showAdvance && (
                                  <div className="flex flex-wrap gap-1.5 mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                    {item.futureMonths.map((month) => {
                                      const isChecked = selectedMonths?.has(month) || false;
                                      return (
                                        <button
                                          key={month}
                                          type="button"
                                          onClick={() => handleToggleMonth(item.admissionId, month)}
                                          className={`
                                            px-3 py-1.5 text-xs rounded-md border transition-all duration-150
                                            ${isChecked
                                              ? "bg-primary/10 text-primary border-primary/30"
                                              : "bg-background border-border text-muted-foreground hover:border-primary/30"
                                            }
                                          `}
                                        >
                                          {formatMonth(month)}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Subtotal for this batch */}
                            {subtotal > 0 && (
                              <div className="flex justify-end pt-2 border-t">
                                <span className="text-xs text-muted-foreground">
                                  Subtotal:{" "}
                                  <span className="font-semibold text-foreground">
                                    ₹{subtotal.toLocaleString()}
                                  </span>
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </section>
              )}

              {/* ── Section 3: Payment Details ── */}
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Payment Details
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="pay-mode" className="text-xs">
                      Payment Mode
                    </Label>
                    <Select value={paymentMode} onValueChange={setPaymentMode}>
                      <SelectTrigger id="pay-mode" className="h-9">
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

                  <div className="space-y-1.5">
                    <Label htmlFor="pay-receipt" className="text-xs">
                      Receipt No. <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="pay-receipt"
                      value={receiptNo}
                      onChange={(e) => setReceiptNo(e.target.value)}
                      placeholder="e.g. REC-9921"
                      className="h-9"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 mt-3">
                  <Label htmlFor="pay-notes" className="text-xs">
                    Notes{" "}
                    <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <Input
                    id="pay-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional notes..."
                    className="h-9"
                  />
                </div>
              </section>

              {/* ── Section 4: Summary ── */}
              {totalMonths > 0 && (
                <section className="rounded-lg border bg-muted/40 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Summary
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Total for {totalMonths} selected month{totalMonths !== 1 ? "s" : ""}{" "}
                        across {selectedAdmissions.size} batch{selectedAdmissions.size !== 1 ? "es" : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Grand Total
                      </p>
                      <p className="text-2xl font-bold tabular-nums">
                        ₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="border-t px-6 py-4">
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
                submitting ||
                totalMonths === 0 ||
                !receiptNo.trim()
              }
              className="min-w-36"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
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
