
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
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

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
}

export function AddStudentToBatchModal({
    studentId,
    studentName,
    isOpen,
    onOpenChange,
    batches,
    onSuccess
}: AddStudentToBatchModalProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [selectedBatchId, setSelectedBatchId] = useState("");
    const [fee, setFee] = useState("");
    const [paid, setPaid] = useState("");
    const [selectedDays, setSelectedDays] = useState("");

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
            // 1. Create Admission
            const admissionPayload = {
                studentId,
                batchId: selectedBatchId,
                total_fees: parseFloat(fee),
                fees_pending: Math.max(0, parseFloat(fee) - (parseFloat(paid) || 0))
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

            // 2. Create Payment if paid > 0
            if (parseFloat(paid) > 0) {
                const payRes = await fetch("/api/payments", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        studentId,
                        amount: parseFloat(paid),
                        mode: paymentMode,
                        receipt_no: receiptNo,
                        skipFeesPendingUpdate: true
                    }),
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
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add to Batch</DialogTitle>
                    <DialogDescription>
                        Assign <strong>{studentName}</strong> to a new batch.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Select Batch</Label>
                        <Select value={selectedBatchId} onValueChange={handleBatchChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select batch" />
                            </SelectTrigger>
                            <SelectContent>
                                {batches.filter(b => b.isActive !== false).map((batch) => (
                                    <SelectItem key={batch.id} value={batch.id}>
                                        {batch.name} ({batch.subject})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {showDaysSelection && (
                        <div className="grid gap-2">
                            <Label>Days Per Week</Label>
                            <Select value={selectedDays} onValueChange={handleDaysChange}>
                                <SelectTrigger>
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

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Total Course Fee</Label>
                            <Input
                                type="number"
                                value={fee}
                                onChange={(e) => setFee(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Paying Now</Label>
                            <Input
                                type="number"
                                value={paid}
                                onChange={(e) => setPaid(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {parseFloat(paid) > 0 && (
                        <div className="grid grid-cols-2 gap-4 border-t pt-4">
                            <div className="grid gap-2">
                                <Label>Payment Mode</Label>
                                <Select value={paymentMode} onValueChange={setPaymentMode}>
                                    <SelectTrigger>
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
                                <Label>Receipt No</Label>
                                <Input
                                    value={receiptNo}
                                    onChange={(e) => setReceiptNo(e.target.value)}
                                    placeholder="Receipt #"
                                />
                            </div>
                        </div>
                    )}

                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading || !selectedBatchId}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Admission
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
