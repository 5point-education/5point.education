
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Receipt } from "lucide-react";

interface Batch {
    id: string;
    name: string;
    subject: string;
    feeModel?: "ONE_TIME" | "MONTHLY" | "QUARTERLY" | "CUSTOM" | null;
    feeAmount?: number;
    installments?: any[];
    daysWiseFeesEnabled?: boolean;
    daysWiseFees?: Record<string, number>;
    isActive?: boolean;
}

interface AddStudentToBatchModalProps {
    studentId: string;
    studentName: string;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    batches: Batch[];
    onSuccess: () => void;
    existingBatchIds?: string[];
}

export function AddStudentToBatchModal({
    studentId,
    studentName,
    isOpen,
    onOpenChange,
    batches,
    onSuccess,
    existingBatchIds = []
}: AddStudentToBatchModalProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [selectedBatchId, setSelectedBatchId] = useState("");
    const [fee, setFee] = useState("");
    const [paid, setPaid] = useState("");
    const [selectedDays, setSelectedDays] = useState("");

    // Discount fields
    const [discountValue, setDiscountValue] = useState("");
    const [discountType, setDiscountType] = useState("");

    // Payment details
    const [paymentMode, setPaymentMode] = useState("CASH");
    const [receiptNo, setReceiptNo] = useState("");

    // Reset form when opening/closing or changing student
    useEffect(() => {
        if (isOpen) {
            setSelectedBatchId("");
            setFee("");
            setPaid("");
            setSelectedDays("");
            setDiscountValue("");
            setDiscountType("");
            setPaymentMode("CASH");
            setReceiptNo("");
        }
    }, [isOpen, studentId]);

    const handleBatchChange = (batchId: string) => {
        setSelectedBatchId(batchId);
        setSelectedDays("");
        setPaid("");

        const batch = batches.find(b => b.id === batchId);
        if (batch) {
            if (batch.daysWiseFeesEnabled && batch.daysWiseFees) {
                setFee(""); // Wait for days selection
            } else if (batch.feeModel === "CUSTOM" && batch.installments) {
                const total = batch.installments.reduce((sum: number, i: any) => sum + (i.amount || 0), 0);
                setFee(total.toString());
            } else if (batch.feeAmount) {
                setFee(batch.feeAmount.toString());
            } else {
                setFee("");
            }
        }
    };

    const handleDaysChange = (days: string) => {
        setSelectedDays(days);
        const batch = batches.find(b => b.id === selectedBatchId);
        if (batch?.daysWiseFees?.[days]) {
            setFee(batch.daysWiseFees[days].toString());
        }
    };

    const handleSubmit = async () => {
        if (!selectedBatchId || !fee) {
            toast({ title: "Please fill required fields", variant: "destructive" });
            return;
        }

        const batch = batches.find(b => b.id === selectedBatchId);
        if (batch?.daysWiseFeesEnabled && !selectedDays) {
            toast({ title: "Please select days per week", variant: "destructive" });
            return;
        }

        if (parseFloat(paid) > 0 && (!paymentMode || !receiptNo)) {
            toast({ title: "Please provide payment details", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            // Calculate discounted fee
            const baseFee = parseFloat(fee) || 0;
            const discount = discountValue ? parseFloat(discountValue) : 0;
            const discountedFee = Math.max(0, baseFee - discount);
            const paidAmount = parseFloat(paid) || 0;

            // 1. Create Admission
            const admissionPayload = {
                studentId,
                batchId: selectedBatchId,
                total_fees: baseFee, // Store base fee
                fees_pending: Math.max(0, discountedFee - paidAmount), // Use discounted fee for pending
                selectedDays: selectedDays ? parseInt(selectedDays) : null,
                discount_value: discount,
                discount_type: discountType || null
            };

            const admRes = await fetch("/api/admissions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(admissionPayload),
            });

            if (!admRes.ok) {
                const err = await admRes.text();
                throw new Error(err || "Failed to add student to batch");
            }

            const admission = await admRes.json();

            // 2. Create Payment if paid > 0
            if (paidAmount > 0) {
                const paymentBody: any = {
                    studentId,
                    admissionId: admission.id,
                    amount: paidAmount,
                    mode: paymentMode,
                    receipt_no: receiptNo,
                    skipFeesPendingUpdate: true
                };

                // Check if it's a recurring fee model
                const isRecurring = batch?.feeModel === "MONTHLY" ||
                    batch?.feeModel === "QUARTERLY" ||
                    batch?.daysWiseFeesEnabled;

                // If fully paid (comparing against DISCOUNTED fee), mark current month as covered
                if (isRecurring && paidAmount >= discountedFee) {
                    const date = new Date();
                    const currentMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    paymentBody.months = [currentMonth];
                }

                const payRes = await fetch("/api/payments", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(paymentBody),
                });

                if (!payRes.ok) {
                    console.error("Payment failed but admission created");
                    toast({ title: "Admission created but payment failed", description: "Please record payment manually.", variant: "default" });
                }
            }

            toast({ title: "Student added to batch successfully" });
            onSuccess();
            onOpenChange(false);

        } catch (error: any) {
            console.error(error);
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const selectedBatch = batches.find(b => b.id === selectedBatchId);
    const showDaysSelection = selectedBatch?.daysWiseFeesEnabled && selectedBatch.daysWiseFees && Object.keys(selectedBatch.daysWiseFees).length > 0;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-hidden flex flex-col p-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b bg-muted/30">
                    <DialogTitle className="text-xl">Add to Batch</DialogTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                        Assign <span className="font-medium text-foreground">{studentName}</span> to a new batch.
                    </p>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                    {/* Step 1: Batch Selection */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                                1
                            </div>
                            <Label className="text-base font-medium">Batch Selection</Label>
                        </div>

                        <div className="ml-8 space-y-4">
                            <div className="grid gap-2">
                                <Select value={selectedBatchId} onValueChange={handleBatchChange}>
                                    <SelectTrigger className="h-11">
                                        <SelectValue placeholder="Choose a batch..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {batches
                                            .filter(b => b.isActive !== false && !existingBatchIds.includes(b.id))
                                            .map((batch) => (
                                                <SelectItem key={batch.id} value={batch.id} className="py-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{batch.name}</span>
                                                        <Badge variant="outline" className="text-xs font-normal ml-2">{batch.subject}</Badge>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {showDaysSelection && (
                                <div className="grid gap-2">
                                    <Label className="text-sm font-medium">Days Per Week</Label>
                                    <Select value={selectedDays} onValueChange={handleDaysChange}>
                                        <SelectTrigger className="h-10">
                                            <SelectValue placeholder="Select days" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.keys(selectedBatch!.daysWiseFees!).map(d => (
                                                <SelectItem key={d} value={d}>{d} Days</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Step 2: Payment Details */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                                2
                            </div>
                            <Label className="text-base font-medium">Fees & Payment</Label>
                        </div>

                        <div className="ml-8 space-y-4">
                            {/* Base Fee (from batch) */}
                            <div className="grid gap-2">
                                <Label className="text-xs text-muted-foreground">Base Course Fee</Label>
                                <Input
                                    type="number"
                                    value={fee}
                                    onChange={(e) => setFee(e.target.value)}
                                    placeholder="0.00"
                                    className="h-10"
                                />
                            </div>

                            {/* Discount Section */}
                            <div className="grid grid-cols-2 gap-4 p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                                <div className="grid gap-2">
                                    <Label className="text-xs text-emerald-700 font-medium">Discount (₹)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={discountValue}
                                        onChange={(e) => setDiscountValue(e.target.value)}
                                        placeholder="0"
                                        className="h-10 border-emerald-200 focus:ring-emerald-500"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-xs text-emerald-700 font-medium">Discount Reason</Label>
                                    <Select value={discountType} onValueChange={setDiscountType}>
                                        <SelectTrigger className="h-10 border-emerald-200">
                                            <SelectValue placeholder="Optional..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="SIBLING">Sibling Discount</SelectItem>
                                            <SelectItem value="EARLY_BIRD">Early Bird</SelectItem>
                                            <SelectItem value="REFERRAL">Referral</SelectItem>
                                            <SelectItem value="SCHOLARSHIP">Scholarship</SelectItem>
                                            <SelectItem value="SPECIAL">Special Discount</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Final Fee After Discount */}
                            {(parseFloat(fee) > 0 || parseFloat(discountValue) > 0) && (
                                <div className="p-3 bg-muted/50 rounded-lg border">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Monthly Fee after Discount</span>
                                        <div className="text-right">
                                            {parseFloat(discountValue) > 0 && (
                                                <span className="text-xs text-muted-foreground line-through mr-2">
                                                    ₹{(parseFloat(fee) || 0).toLocaleString()}
                                                </span>
                                            )}
                                            <span className="text-lg font-bold text-primary">
                                                ₹{Math.max(0, (parseFloat(fee) || 0) - (parseFloat(discountValue) || 0)).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    {parseFloat(discountValue) > 0 && (
                                        <p className="text-xs text-emerald-600 mt-1 text-right">
                                            Saving ₹{(parseFloat(discountValue) || 0).toLocaleString()}/month
                                            {discountType && ` (${discountType.replace('_', ' ')})`}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Pay Now Section */}
                            <div className="pt-2 border-t border-dashed">
                                <div className="grid gap-2">
                                    <Label className="text-xs text-muted-foreground">Pay Now (Optional)</Label>
                                    <Input
                                        type="number"
                                        value={paid}
                                        onChange={(e) => setPaid(e.target.value)}
                                        placeholder="0.00"
                                        className="h-10"
                                    />
                                </div>
                            </div>

                            {parseFloat(paid) > 0 && (
                                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                    <div className="grid gap-2">
                                        <Label className="text-xs text-muted-foreground">Payment Mode</Label>
                                        <Select value={paymentMode} onValueChange={setPaymentMode}>
                                            <SelectTrigger className="h-10">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="CASH">Cash</SelectItem>
                                                <SelectItem value="UPI">UPI</SelectItem>
                                                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                                                <SelectItem value="CHEQUE">Cheque</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-xs text-muted-foreground">Receipt No</Label>
                                        <Input
                                            value={receiptNo}
                                            onChange={(e) => setReceiptNo(e.target.value)}
                                            placeholder="Receipt #"
                                            className="h-10"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="border-t bg-muted/30 px-6 py-4">
                    <DialogFooter>
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={loading || !selectedBatchId}>
                            {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Receipt className="mr-2 h-4 w-4" />
                            )}
                            Confirm Admission
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
