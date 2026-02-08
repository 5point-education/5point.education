"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CheckCircle2, Copy, Plus, Trash2, GraduationCap, X, CreditCard, Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// --- Schemas ---

const studentSchema = z.object({
    // Course / Programme
    program_level: z.enum(["PRIMARY", "SECONDARY", "HIGHER_SECONDARY", "ENGINEERING", "ROBOTICS"]),
    board: z.enum(["ICSE", "CBSE", "WBBSE", "OTHER"]),
    class_level: z.string().transform((v) => parseInt(v, 10)),
    stream: z.string().optional(), // Science/Commerce
    aspirant_of: z.string().optional(), // JEE/NEET
    subjects: z.string().min(2, "Subjects required"),

    // Checkboxes for Other Courses (Stored as JSON keys)
    courses_engineering: z.array(z.string()).optional(),
    courses_robotics: z.array(z.string()).optional(),
    courses_extra: z.array(z.string()).optional(),

    // Personal Details
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email"),
    phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]),
    dob: z.string().optional(), // YYYY-MM-DD
    fatherName: z.string().min(2, "Father's Name required"),
    motherName: z.string().optional(),
    parentMobile: z.string().refine((val) => !val || /^\d{10}$/.test(val), "Parent mobile number must be exactly 10 digits").optional(),
    aadharNo: z.string().regex(/^\d{12}$/, "Phone number must be exactly 12 digits").optional(),
    nationality: z.string().default("Indian"),

    permanentAddress: z.string().optional(),
    correspondenceAddress: z.string().min(5, "Current Address required"),

    service_type: z.enum(["HOME_TUTOR", "TUITION_BATCH"]),
    source_of_enquiry: z.array(z.string()).optional(), // Changed to array for multi-select UI

    // NEW FIELDS
    admission_in_charge: z.string().optional(),
    transport_facility: z.boolean().default(false),
    pickup_location: z.string().optional(),
    competitive_exams: z.array(z.string()).optional(),
    terms_accepted: z.literal(true, { errorMap: () => ({ message: "You must accept the terms" }) }),
    declaration_accepted: z.literal(true, { errorMap: () => ({ message: "You must accept the declaration" }) }),
});

const academicRecordSchema = z.object({
    records: z.array(z.object({
        qualification: z.string().min(1, "Required"),
        exam: z.string().optional(),
        year: z.string().optional(),
        institution: z.string().optional(),
        percentage: z.string().optional(),
    })).optional()
});

const paymentSchema = z.object({
    mode: z.string().min(1, "Mode required"),
    receipt_no: z.string().min(1, "Receipt No required"),
});

interface InstallmentItem {
    name: string;
    amount: number;
    dueDate: string;
}

type FeeModel = "ONE_TIME" | "MONTHLY" | "QUARTERLY" | "CUSTOM" | null;

interface Batch {
    id: string;
    name: string;
    subject: string;
    feeModel?: FeeModel;
    feeAmount?: number;
    installments?: InstallmentItem[];
    schedule?: string;
    daysWiseFeesEnabled?: boolean;
    daysWiseFees?: Record<string, number>;
    isActive?: boolean;
}

export default function AdmissionPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const enquiryId = searchParams.get("enquiryId");
    const { toast } = useToast();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [batches, setBatches] = useState<Batch[]>([]);

    // Data Store
    const [formData, setFormData] = useState<any>({
        service_type: "TUITION_BATCH"
    });
    const [credentials, setCredentials] = useState<any>(null);

    // --- Form 1: Comprehensive Details ---
    const studentForm = useForm({
        resolver: zodResolver(studentSchema),
        defaultValues: {
            program_level: "SECONDARY",
            board: "CBSE",
            class_level: "",
            stream: "",
            aspirant_of: "",
            subjects: "",
            courses_engineering: [] as string[],
            courses_robotics: [] as string[],
            courses_extra: [] as string[],
            name: "",
            email: "",
            phone: "",
            gender: "MALE",
            dob: "",
            fatherName: "",
            motherName: "",
            parentMobile: "",
            aadharNo: "",
            nationality: "Indian",
            permanentAddress: "",
            correspondenceAddress: "",
            service_type: "TUITION_BATCH",
            source_of_enquiry: [] as string[],
            admission_in_charge: "",
            transport_facility: false,
            pickup_location: "",
            competitive_exams: [] as string[],
            terms_accepted: false,
            declaration_accepted: false
        }
    });

    // --- Form 2: Academic Records ---
    const academicForm = useForm({
        resolver: zodResolver(academicRecordSchema),
        defaultValues: {
            records: [{ qualification: "Class 10", exam: "", year: "", institution: "", percentage: "" }]
        }
    });
    const { fields, append, remove } = useFieldArray({
        control: academicForm.control,
        name: "records"
    });

    // --- Form 3: Payment & Batch ---
    const paymentForm = useForm({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            mode: "CASH", receipt_no: ""
        }
    });

    // Multiple Batch State - now includes payment per batch and discount
    const [selectedBatches, setSelectedBatches] = useState<{ id: string, name: string, subject: string, fee: number, feeModel?: FeeModel, selectedDays?: number, paying: number, discount_value?: number, discount_type?: string }[]>([]);
    const [tempBatchId, setTempBatchId] = useState("");
    const [tempFee, setTempFee] = useState("");
    const [tempSelectedDays, setTempSelectedDays] = useState<string>("");
    const [tempDiscountValue, setTempDiscountValue] = useState<string>("");
    const [tempDiscountType, setTempDiscountType] = useState<string>("");

    // Admission charge (one-time, applies to entire admission, not per batch)
    const [admissionCharge, setAdmissionCharge] = useState<string>("");
    // Payment toward admission charge (separate from batch payments)
    const [payingAdmissionCharge, setPayingAdmissionCharge] = useState<string>("");

    // Helper function to get total scheduled days from batch
    const getScheduledDaysCount = (batch: Batch): number => {
        if (!batch.schedule) return 0;
        try {
            const schedule = JSON.parse(batch.schedule);
            if (Array.isArray(schedule)) {
                const uniqueDays = new Set(schedule.filter((item: any) => item.day).map((item: any) => item.day));
                return uniqueDays.size;
            }
        } catch {
            return 0;
        }
        return 0;
    };

    // Effect to auto-populate fee when batch/days selected
    useEffect(() => {
        const batch = batches.find(b => b.id === tempBatchId);
        if (!batch) {
            setTempFee("");
            return;
        }

        if (batch.daysWiseFeesEnabled && batch.daysWiseFees && Object.keys(batch.daysWiseFees).length > 0) {
            if (tempSelectedDays && batch.daysWiseFees[tempSelectedDays]) {
                setTempFee(batch.daysWiseFees[tempSelectedDays].toString());
            } else {
                setTempFee("");
            }
        } else if (batch.feeModel === "CUSTOM" && batch.installments && batch.installments.length > 0) {
            const total = batch.installments.reduce((sum: number, i: InstallmentItem) => sum + (i.amount || 0), 0);
            setTempFee(total.toString());
        } else if (batch.feeAmount) {
            setTempFee(batch.feeAmount.toString());
        } else {
            setTempFee("");
        }
    }, [tempBatchId, tempSelectedDays, batches]);

    // Derived state for UI
    const selectedBatchDetails = batches.find(b => b.id === tempBatchId);
    const hasDaysWiseFees = selectedBatchDetails?.daysWiseFeesEnabled &&
        selectedBatchDetails?.daysWiseFees &&
        Object.keys(selectedBatchDetails.daysWiseFees).length > 0;

    const calculatedFee = tempFee ? parseFloat(tempFee) : 0;

    // Helper to get installments if needed (though new UI might not use it, we keep logic available if referenced or used implicitly)
    const getSelectedBatchInstallments = () => {
        if (!tempBatchId) return null;
        const batch = batches.find(b => b.id === tempBatchId);
        if (batch?.feeModel === "CUSTOM" && batch.installments && batch.installments.length > 0) {
            return batch.installments;
        }
        return null;
    };

    const getFeeModelLabel = (model: FeeModel) => {
        switch (model) {
            case "ONE_TIME": return "One-time";
            case "MONTHLY": return "/month";
            case "QUARTERLY": return "/quarter";
            case "CUSTOM": return "(Custom)";
            default: return "";
        }
    };

    const addBatch = () => {
        if (!tempBatchId || !tempFee) return;
        const b = batches.find(x => x.id === tempBatchId);
        if (!b) return;

        // Check if batch has days-wise fees configured
        const hasDaysWiseFees = b.daysWiseFeesEnabled &&
            b.daysWiseFees &&
            Object.keys(b.daysWiseFees).length > 0;

        // Validate days selection if days-wise fees is enabled and configured
        if (hasDaysWiseFees && !tempSelectedDays) {
            toast({ title: "Please select days per week", variant: "destructive" });
            return;
        }

        // Prevent duplicate
        if (selectedBatches.find(x => x.id === tempBatchId)) {
            toast({ title: "Batch already added", variant: "destructive" });
            return;
        }

        setSelectedBatches(prev => [...prev, {
            id: tempBatchId,
            name: b.name,
            subject: b.subject,
            fee: parseFloat(tempFee),
            feeModel: b.feeModel,
            selectedDays: tempSelectedDays ? parseInt(tempSelectedDays) : undefined,
            paying: 0, // Initialize payment for this batch
            discount_value: tempDiscountValue ? parseFloat(tempDiscountValue) : 0,
            discount_type: tempDiscountType || undefined
        }]);

        setTempBatchId("");
        setTempFee("");
        setTempSelectedDays("");
        setTempDiscountValue("");
        setTempDiscountType("");
    };

    const removeBatch = (id: string) => {
        setSelectedBatches(prev => prev.filter(x => x.id !== id));
    };

    // Toggle full payment for a specific batch (pay full discounted fee or nothing)
    const toggleBatchPayment = (batchId: string, checked: boolean) => {
        setSelectedBatches(prev => prev.map(b => {
            if (b.id === batchId) {
                const discountedFee = Math.max(0, b.fee - (b.discount_value || 0));
                return { ...b, paying: checked ? discountedFee : 0 };
            }
            return b;
        }));
    };

    const totalBatchFees = selectedBatches.reduce((acc, curr) => acc + curr.fee, 0); // Base fees
    const totalDiscount = selectedBatches.reduce((acc, curr) => acc + (curr.discount_value || 0), 0); // Total discounts
    const totalBatchFeesAfterDiscount = Math.max(0, totalBatchFees - totalDiscount); // Fees after discount
    const totalBatchPayments = selectedBatches.reduce((acc, curr) => acc + curr.paying, 0);
    const admissionChargeAmount = admissionCharge ? parseFloat(admissionCharge) : 0;
    const payingAdmissionChargeAmount = payingAdmissionCharge ? parseFloat(payingAdmissionCharge) : 0;
    const totalFees = totalBatchFeesAfterDiscount + admissionChargeAmount; // Total = (Batch Fees - Discount) + Admission Charge
    const totalPaid = totalBatchPayments + payingAdmissionChargeAmount; // Sum of all payments
    const totalPending = Math.max(0, totalFees - totalPaid);

    useEffect(() => {
        if (enquiryId) {
            fetch(`/api/enquiry/${enquiryId}`)
                .then(res => res.json())
                .then(data => {
                    studentForm.reset({
                        ...studentForm.getValues(),
                        name: data.name,
                        phone: data.phone,
                        email: data.email || "",
                        class_level: data.class_level.toString(),
                        subjects: data.subjects,
                        service_type: data.service_type,
                        source_of_enquiry: ["Enquiry #" + data.id.slice(-4)]
                    });
                })
                .catch(err => console.error(err));
        }

        // Fetch batches for later - only active batches
        fetch("/api/batches")
            .then(res => res.json())
            .then((data: Batch[]) => {
                // Filter to only show active batches
                const activeBatches = data.filter(b => b.isActive !== false);
                setBatches(activeBatches);
            });
    }, [enquiryId]);

    // Handlers
    const onStudentSubmit = (values: any) => {
        setFormData((prev: any) => ({ ...prev, ...values }));
        setStep(2);
    };

    const onAcademicRecordSubmit = (values: any) => {
        setFormData((prev: any) => ({ ...prev, academicRecords: values.records }));
        setStep(3);
    };

    const onFinalSubmit = async (values: any) => {
        setLoading(true);
        // Combine all data
        const finalPayload = {
            ...formData,
            // Calculate age roughly if DOB exists
            age: formData.dob ? new Date().getFullYear() - new Date(formData.dob).getFullYear() : undefined,
            chosen_courses: {
                engineering: formData.courses_engineering,
                robotics: formData.courses_robotics,
                extra: formData.courses_extra
            }
        };
        // Flatten source_of_enquiry enum array to string
        if (Array.isArray(formData.source_of_enquiry)) {
            finalPayload.source_of_enquiry = formData.source_of_enquiry.join(", ");
        }
        if (Array.isArray(formData.competitive_exams)) {
            finalPayload.competitive_exams = formData.competitive_exams.join(", ");
        }

        try {
            // 1. Create Student & Profile
            const res = await fetch("/api/students", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(finalPayload),
            });

            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();

            const studentId = data.data.profile.id;
            const newCreds = {
                email: formData.email,
                password: data.generatedPassword,
                studentId
            };
            setCredentials(newCreds);

            // 2. Create Admission(s)
            // Now using per-batch payment allocation with separate admission charge tracking
            const admissionsToCreate = formData.service_type === "TUITION_BATCH"
                ? selectedBatches.map((b, index) => {
                    // Apply admission charge only to the first batch
                    const batchAdmissionCharge = index === 0 ? admissionChargeAmount : 0;
                    const batchAdmissionChargePending = index === 0 ? Math.max(0, admissionChargeAmount - payingAdmissionChargeAmount) : 0;

                    // Calculate discounted fee for this batch
                    const batchDiscount = b.discount_value || 0;
                    const discountedBatchFee = Math.max(0, b.fee - batchDiscount);

                    return {
                        batchId: b.id,
                        total_fees: b.fee, // Store base batch fee
                        admission_charge: batchAdmissionCharge, // One-time admission charge (only on first)
                        admission_charge_pending: batchAdmissionChargePending, // Pending admission charge
                        fees_pending: Math.max(0, discountedBatchFee - b.paying), // Use DISCOUNTED fee for pending
                        selectedDays: b.selectedDays,
                        discount_value: batchDiscount,
                        discount_type: b.discount_type || null,
                        discountedFee: discountedBatchFee, // Pass through for payment logic
                        // Pass through for payment creation
                        feeModel: b.feeModel,
                        paying: b.paying,
                        index
                    };
                })
                : [{
                    batchId: null,
                    total_fees: 0,
                    admission_charge: admissionChargeAmount,
                    admission_charge_pending: Math.max(0, admissionChargeAmount - payingAdmissionChargeAmount),
                    fees_pending: 0,
                    selectedDays: undefined,
                    discount_value: 0,
                    discount_type: null,
                    discountedFee: 0,
                    feeModel: "ONE_TIME", // Default for non-batch
                    paying: 0,
                    index: 0
                }];

            for (const adm of admissionsToCreate) {
                // 2a. Create Admission
                const admissionRes = await fetch("/api/admissions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        studentId,
                        batchId: adm.batchId,
                        total_fees: adm.total_fees,
                        admission_charge: adm.admission_charge,
                        admission_charge_pending: adm.admission_charge_pending,
                        fees_pending: adm.fees_pending,
                        selectedDays: adm.selectedDays,
                        discount_value: adm.discount_value,
                        discount_type: adm.discount_type,
                    }),
                });

                if (!admissionRes.ok) {
                    console.error("Failed to create admission for batch " + adm.batchId);
                    continue;
                }

                const admissionData = await admissionRes.json();
                const admissionId = admissionData.id;

                // 2b. Create Payment linked to this admission
                // Calculate amount to pay for this specific admission context
                // adm.paying (Tuition) + (index===0 ? payingAdmissionChargeAmount : 0)
                const tuitionPayment = adm.paying || 0;
                const admChargePayment = adm.index === 0 ? payingAdmissionChargeAmount : 0;
                const totalPaymentForThisBatch = tuitionPayment + admChargePayment;

                if (totalPaymentForThisBatch > 0) {
                    // Check if tuition is fully paid for one or more months
                    let months: string[] = [];
                    // Only applicable for Monthly/Quarterly batches where fee > 0
                    // Use DISCOUNTED fee for calculating covered months
                    const effectiveFee = adm.discountedFee || adm.total_fees; // Use discounted fee if available
                    if ((adm.feeModel === "MONTHLY" || adm.feeModel === "QUARTERLY") && effectiveFee > 0) {
                        const monthlyFee = adm.feeModel === "QUARTERLY" ? effectiveFee / 3 : effectiveFee;

                        // Calculate how many months are covered
                        // Use 0.01 tolerance for floating point math
                        const monthsCovered = Math.floor((tuitionPayment + 0.01) / monthlyFee);

                        if (monthsCovered > 0) {
                            const today = new Date();
                            for (let i = 0; i < monthsCovered; i++) {
                                const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
                                const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                                months.push(mStr);
                            }
                        }
                    }

                    // Handle generic receipt number - unique if multiple batches
                    const receiptSuffix = admissionsToCreate.length > 1 ? `-${adm.index + 1}` : "";

                    await fetch("/api/payments", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            studentId,
                            admissionId, // Link to admission!
                            amount: totalPaymentForThisBatch,
                            mode: values.mode,
                            receipt_no: values.receipt_no + receiptSuffix,
                            months: months, // Pass calculated months
                            skipFeesPendingUpdate: true, // Fees pending is already set correctly during admission creation
                        }),
                    });
                }
            }

            // 4. Update Enquiry
            if (enquiryId) {
                await fetch(`/api/enquiry/${enquiryId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "ADMITTED" }),
                });
            }

            setStep(4);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    if (step === 4) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-6">
                <CheckCircle2 className="h-24 w-24 text-green-500" />
                <h1 className="text-3xl font-bold">Admission Successful!</h1>
                <Card className="w-full max-w-md bg-slate-50 border-green-200">
                    <CardHeader>
                        <CardTitle>User Credentials</CardTitle>
                        <CardDescription>Share these with the student immediately.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <span className="text-xs font-medium text-muted-foreground uppercase">Email</span>
                            <p className="text-lg font-mono">{credentials?.email}</p>
                        </div>
                        <div>
                            <span className="text-xs font-medium text-muted-foreground uppercase">Password</span>
                            <div className="flex items-center gap-2">
                                <p className="text-lg font-mono font-bold text-blue-600">{credentials?.password}</p>
                                <Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(credentials?.password)}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" onClick={() => router.push("/dashboard/reception")}>
                            Return to Dashboard
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <div>
                <h1 className="text-3xl font-bold">New Admission Form</h1>
                <p className="text-muted-foreground">Detailed admission process matching physical form.</p>
                <div className="flex gap-2 mt-4">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className={`h-2 flex-1 rounded-full ${step >= s ? "bg-primary" : "bg-muted"}`} />
                    ))}
                </div>
            </div>

            {step === 1 && (
                <Card>
                    <CardHeader><CardTitle>1. Personal & Course Details</CardTitle></CardHeader>
                    <CardContent>
                        <Form {...studentForm}>
                            <form onSubmit={studentForm.handleSubmit(onStudentSubmit)} className="space-y-6">

                                {/* Section 1: Course */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        <div className="w-1 h-6 bg-blue-500 rounded" /> Course / Programme
                                    </h3>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <FormField control={studentForm.control} name="program_level" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Program Level</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="PRIMARY">Class (1-7)</SelectItem>
                                                        <SelectItem value="SECONDARY">Secondary (Class 8-10)</SelectItem>
                                                        <SelectItem value="HIGHER_SECONDARY">Higher Secondary (11-12)</SelectItem>
                                                        <SelectItem value="ENGINEERING">Engineering</SelectItem>
                                                        <SelectItem value="ROBOTICS">Robotics</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )} />
                                        <FormField control={studentForm.control} name="board" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Board</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="CBSE">CBSE</SelectItem>
                                                        <SelectItem value="ICSE">ICSE</SelectItem>
                                                        <SelectItem value="WBBSE">WBBSE</SelectItem>
                                                        <SelectItem value="OTHER">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )} />
                                        <FormField control={studentForm.control} name="class_level" render={({ field }) => (
                                            <FormItem><FormLabel>Class</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={studentForm.control} name="stream" render={({ field }) => (
                                            <FormItem><FormLabel>Stream (if HS)</FormLabel><FormControl><Input placeholder="Science/Commerce/Arts" {...field} /></FormControl></FormItem>
                                        )} />
                                        <FormField control={studentForm.control} name="aspirant_of" render={({ field }) => (
                                            <FormItem><FormLabel>Aspirant Of</FormLabel><FormControl><Input placeholder="JEE / NEET / WBJEE" {...field} /></FormControl></FormItem>
                                        )} />
                                        <FormField control={studentForm.control} name="subjects" render={({ field }) => (
                                            <FormItem><FormLabel>Subjects</FormLabel><FormControl><Input placeholder="Comma separated" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </div>
                                    {/* Competitive Exams (Multi-select) */}
                                    <div className="mt-4">
                                        <FormLabel className="block mb-2">Competitive Exams</FormLabel>
                                        <div className="flex flex-wrap gap-4">
                                            {["NEET", "JEE", "CAT", "XAT", "MAT", "CMAT", "WBJEE", "OLYMPIAD"].map((exam) => (
                                                <FormField
                                                    key={exam}
                                                    control={studentForm.control}
                                                    name="competitive_exams"
                                                    render={({ field }) => {
                                                        return (
                                                            <FormItem
                                                                key={exam}
                                                                className="flex flex-row items-start space-x-3 space-y-0"
                                                            >
                                                                <FormControl>
                                                                    <Checkbox
                                                                        checked={field.value?.includes(exam)}
                                                                        onCheckedChange={(checked) => {
                                                                            return checked
                                                                                ? field.onChange([...(field.value || []), exam])
                                                                                : field.onChange(
                                                                                    field.value?.filter(
                                                                                        (value: string) => value !== exam
                                                                                    )
                                                                                )
                                                                        }}
                                                                    />
                                                                </FormControl>
                                                                <FormLabel className="font-normal">
                                                                    {exam}
                                                                </FormLabel>
                                                            </FormItem>
                                                        )
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Section 2: Personal */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        <div className="w-1 h-6 bg-green-500 rounded" /> Personal Details
                                    </h3>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <FormField control={studentForm.control} name="name" render={({ field }) => (
                                            <FormItem><FormLabel>Student Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={studentForm.control} name="gender" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Gender</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="MALE">Male</SelectItem>
                                                        <SelectItem value="FEMALE">Female</SelectItem>
                                                        <SelectItem value="OTHER">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )} />
                                        <FormField control={studentForm.control} name="dob" render={({ field }) => (
                                            <FormItem><FormLabel>Date of Birth</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
                                        )} />
                                        <FormField control={studentForm.control} name="fatherName" render={({ field }) => (
                                            <FormItem><FormLabel>Father&apos;s Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={studentForm.control} name="motherName" render={({ field }) => (
                                            <FormItem><FormLabel>Mother&apos;s Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                        )} />
                                        <FormField control={studentForm.control} name="parentMobile" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Parent&apos;s Mob</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        maxLength={10}
                                                        inputMode="numeric"
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            if (value === "" || /^\d+$/.test(value)) {
                                                                field.onChange(value);
                                                            }
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={studentForm.control} name="phone" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Student Mob</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        maxLength={10}
                                                        inputMode="numeric"
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            if (value === "" || /^\d+$/.test(value)) {
                                                                field.onChange(value);
                                                            }
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={studentForm.control} name="email" render={({ field }) => (
                                            <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={studentForm.control} name="aadharNo" render={({ field }) => (
                                            <FormItem><FormLabel>Aadhar No</FormLabel><FormControl><Input {...field} maxLength={12}
                                                inputMode="numeric"
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    if (value === "" || /^\d+$/.test(value)) {
                                                        field.onChange(value);
                                                    }
                                                }} /></FormControl></FormItem>
                                        )} />
                                        <FormField control={studentForm.control} name="nationality" render={({ field }) => (
                                            <FormItem><FormLabel>Nationality</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                        )} />

                                        <div className="md:col-span-2">
                                            <FormField control={studentForm.control} name="correspondenceAddress" render={({ field }) => (
                                                <FormItem><FormLabel>Current Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                        </div>
                                        <div className="md:col-span-2">
                                            <FormField control={studentForm.control} name="permanentAddress" render={({ field }) => (
                                                <FormItem><FormLabel>Permanent Address</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                            )} />
                                        </div>

                                        <FormField control={studentForm.control} name="service_type" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Service Type</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="TUITION_BATCH">Tuition Batch</SelectItem>
                                                        <SelectItem value="HOME_TUTOR">Home Tutor</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )} />
                                    </div>

                                    {/* Transport Facility */}
                                    <div className="my-4 p-4 border rounded-md bg-slate-50">
                                        <FormField
                                            control={studentForm.control}
                                            name="transport_facility"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                    <div className="space-y-1 leading-none">
                                                        <FormLabel>
                                                            Avail Transport Facility?
                                                        </FormLabel>
                                                        <CardDescription>
                                                            Check this if the student requires school transport.
                                                        </CardDescription>
                                                    </div>
                                                </FormItem>
                                            )}
                                        />
                                        {studentForm.watch("transport_facility") && (
                                            <div className="mt-4">
                                                <FormField
                                                    control={studentForm.control}
                                                    name="pickup_location"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Pickup Location</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} placeholder="Enter exact pickup point" />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Marketing Source */}
                                    <div className="my-4">
                                        <FormLabel className="base">How did you know about us?</FormLabel>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                                            {["Friend", "Newspaper", "Social Media", "Radio", "TV", "Hoardings", "Google Search", "Walk-in"].map((item) => (
                                                <FormField
                                                    key={item}
                                                    control={studentForm.control}
                                                    name="source_of_enquiry"
                                                    render={({ field }) => {
                                                        return (
                                                            <FormItem
                                                                key={item}
                                                                className="flex flex-row items-start space-x-3 space-y-0"
                                                            >
                                                                <FormControl>
                                                                    <Checkbox
                                                                        checked={field.value?.includes(item)}
                                                                        onCheckedChange={(checked) => {
                                                                            return checked
                                                                                ? field.onChange([...(field.value || []), item])
                                                                                : field.onChange(
                                                                                    field.value?.filter(
                                                                                        (value: string) => value !== item
                                                                                    )
                                                                                )
                                                                        }}
                                                                    />
                                                                </FormControl>
                                                                <FormLabel className="font-normal">
                                                                    {item}
                                                                </FormLabel>
                                                            </FormItem>
                                                        )
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Office Use */}
                                    <div className="bg-blue-50 p-4 rounded-md border border-blue-100 my-4">
                                        <h4 className="font-semibold text-blue-800 mb-2">Office Records</h4>
                                        <FormField control={studentForm.control} name="admission_in_charge" render={({ field }) => (
                                            <FormItem><FormLabel>Admission In-charge Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                        )} />
                                    </div>

                                    {/* Legal / Declaration */}
                                    <div className="space-y-4 pt-4 border-t">
                                        <FormField
                                            control={studentForm.control}
                                            name="terms_accepted"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                    <div className="space-y-1 leading-none">
                                                        <FormLabel>
                                                            I accept the Terms and Conditions
                                                        </FormLabel>
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={studentForm.control}
                                            name="declaration_accepted"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                    <div className="space-y-1 leading-none">
                                                        <FormLabel>
                                                            I declare that the above information is true to the best of my knowledge.
                                                        </FormLabel>
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                </div>

                                <Button type="submit" className="w-full">Next Step</Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            )
            }

            {
                step === 2 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>2. Academic Records</CardTitle>
                            <CardDescription>Previous academic history</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...academicForm}>
                                <form onSubmit={academicForm.handleSubmit(onAcademicRecordSubmit)} className="space-y-4">
                                    {fields.map((field, index) => (
                                        <div key={field.id} className="grid grid-cols-12 gap-2 items-end border p-4 rounded-md">
                                            <div className="col-span-3">
                                                <FormField control={academicForm.control} name={`records.${index}.qualification`} render={({ field }) => (
                                                    <FormItem><FormLabel>Class/Qual</FormLabel><FormControl><Input {...field} placeholder="e.g 10th" /></FormControl></FormItem>
                                                )} />
                                            </div>
                                            <div className="col-span-3">
                                                <FormField control={academicForm.control} name={`records.${index}.exam`} render={({ field }) => (
                                                    <FormItem><FormLabel>Exam/Board</FormLabel><FormControl><Input {...field} placeholder="e.g CBSE" /></FormControl></FormItem>
                                                )} />
                                            </div>
                                            <div className="col-span-2">
                                                <FormField control={academicForm.control} name={`records.${index}.year`} render={({ field }) => (
                                                    <FormItem><FormLabel>Year</FormLabel><FormControl><Input {...field} placeholder="YYYY" /></FormControl></FormItem>
                                                )} />
                                            </div>
                                            <div className="col-span-3">
                                                <FormField control={academicForm.control} name={`records.${index}.percentage`} render={({ field }) => (
                                                    <FormItem><FormLabel>% Marks</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                                )} />
                                            </div>
                                            <div className="col-span-1">
                                                <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="col-span-12">
                                                <FormField control={academicForm.control} name={`records.${index}.institution`} render={({ field }) => (
                                                    <FormItem><FormLabel>School/Institute</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                                )} />
                                            </div>
                                        </div>
                                    ))}
                                    <Button type="button" variant="outline" onClick={() => append({ qualification: "", exam: "", year: "", percentage: "", institution: "" })}>
                                        <Plus className="h-4 w-4 mr-2" /> Add Record
                                    </Button>
                                    <div className="flex gap-4">
                                        <Button type="button" variant="ghost" onClick={() => setStep(1)}>Back</Button>
                                        <Button type="submit" className="flex-1">Next Step</Button>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                )
            }

            {
                step === 3 && (
                    <Card className="w-full max-w-2xl mx-auto shadow-lg">
                        <CardHeader className="bg-primary/5 border-b">
                            <CardTitle className="flex items-center gap-3 text-xl">
                                <GraduationCap className="h-6 w-6 text-primary" />
                                Student Admission
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="p-6 space-y-6">
                            {/* Section 1: Batch Selection */}
                            <section>
                                <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                                    Select Batches
                                </h3>

                                <div className="space-y-4">
                                    {/* Batch Selector */}
                                    <div className="p-4 bg-muted/30 rounded-lg border border-dashed">
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium">Choose Batch</Label>
                                                <Select value={tempBatchId} onValueChange={(v) => { setTempBatchId(v); setTempSelectedDays(""); }}>
                                                    <SelectTrigger className="h-11">
                                                        <SelectValue placeholder="Select a batch..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {batches.filter(b => !selectedBatches.some(sb => sb.id === b.id)).map(b => (
                                                            <SelectItem key={b.id} value={b.id} className="py-3">
                                                                <div className="flex flex-col text-left">
                                                                    <span className="font-medium">{b.name}</span>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {b.subject} • ₹{(b.feeAmount || 0).toLocaleString()}/{getFeeModelLabel(b.feeModel!)}
                                                                        {b.daysWiseFeesEnabled && " • Days-wise pricing"}
                                                                    </span>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {hasDaysWiseFees && (
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium">Days per Week</Label>
                                                    <Select value={tempSelectedDays} onValueChange={setTempSelectedDays}>
                                                        <SelectTrigger className="h-11">
                                                            <SelectValue placeholder="Select days..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {Object.entries(selectedBatchDetails?.daysWiseFees || {})
                                                                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                                                                .map(([days, fee]) => (
                                                                    <SelectItem key={days} value={days} className="py-3">
                                                                        <span className="font-medium ">{days} days/week</span>
                                                                        <span className="text-muted-foreground ml-2">— ₹{fee.toLocaleString()}</span>
                                                                    </SelectItem>
                                                                ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}
                                        </div>

                                        {selectedBatchDetails && (
                                            <div className="mt-4 space-y-4 p-4 bg-muted/30 rounded-lg border">
                                                {/* Base Fee Display */}
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-muted-foreground">Base Fee:</span>
                                                    <div>
                                                        <span className="font-semibold text-lg">₹{calculatedFee.toLocaleString()}</span>
                                                        <Badge variant="secondary" className="ml-2">{getFeeModelLabel(selectedBatchDetails.feeModel!)}</Badge>
                                                    </div>
                                                </div>

                                                {/* Discount Section */}
                                                <div className="grid grid-cols-2 gap-3 p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                                                    <div className="space-y-1">
                                                        <Label className="text-xs text-emerald-700 font-medium">Discount (₹)</Label>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            value={tempDiscountValue}
                                                            onChange={(e) => setTempDiscountValue(e.target.value)}
                                                            placeholder="0"
                                                            className="h-9 border-emerald-200"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs text-emerald-700 font-medium">Reason</Label>
                                                        <Select value={tempDiscountType} onValueChange={setTempDiscountType}>
                                                            <SelectTrigger className="h-9 border-emerald-200">
                                                                <SelectValue placeholder="Optional..." />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="SIBLING">Sibling</SelectItem>
                                                                <SelectItem value="EARLY_BIRD">Early Bird</SelectItem>
                                                                <SelectItem value="REFERRAL">Referral</SelectItem>
                                                                <SelectItem value="SCHOLARSHIP">Scholarship</SelectItem>
                                                                <SelectItem value="SPECIAL">Special</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>

                                                {/* Final Fee After Discount */}
                                                {parseFloat(tempDiscountValue) > 0 && (
                                                    <div className="flex items-center justify-between p-2 bg-primary/5 rounded border border-primary/20">
                                                        <span className="text-sm font-medium">Fee after Discount:</span>
                                                        <div className="text-right">
                                                            <span className="text-xs text-muted-foreground line-through mr-2">
                                                                ₹{calculatedFee.toLocaleString()}
                                                            </span>
                                                            <span className="font-bold text-lg text-primary">
                                                                ₹{Math.max(0, calculatedFee - parseFloat(tempDiscountValue)).toLocaleString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}

                                                <Button
                                                    onClick={addBatch}
                                                    disabled={!tempBatchId || (hasDaysWiseFees && !tempSelectedDays)}
                                                    className="w-full gap-2"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                    Add Batch
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Selected Batches */}
                                    {selectedBatches.length > 0 && (
                                        <div className="space-y-3">
                                            {selectedBatches.map((batch) => (
                                                <div
                                                    key={batch.id}
                                                    className="flex items-center gap-4 p-4 bg-card border rounded-lg shadow-sm"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h4 className="font-medium truncate">{batch.name}</h4>
                                                            <Badge variant="outline" className="text-xs">{getFeeModelLabel(batch.feeModel!)}</Badge>
                                                            {batch.selectedDays && (
                                                                <Badge variant="secondary" className="text-xs text-white">{batch.selectedDays} days/week</Badge>
                                                            )}
                                                            {batch.discount_value && batch.discount_value > 0 && (
                                                                <Badge variant="default" className="text-xs bg-emerald-500">
                                                                    ₹{batch.discount_value} off
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground mt-0.5">
                                                            {batch.subject} •
                                                            {batch.discount_value && batch.discount_value > 0 ? (
                                                                <>
                                                                    <span className="line-through">₹{batch.fee.toLocaleString()}</span>
                                                                    <span className="text-emerald-600 font-medium ml-1">
                                                                        ₹{Math.max(0, batch.fee - batch.discount_value).toLocaleString()}
                                                                    </span>
                                                                    {batch.discount_type && (
                                                                        <span className="text-emerald-600 text-xs ml-1">({batch.discount_type})</span>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <> Fee: ₹{batch.fee.toLocaleString()}</>
                                                            )}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center gap-2">
                                                            <Checkbox
                                                                id={`pay-batch-${batch.id}`}
                                                                checked={batch.paying > 0}
                                                                onCheckedChange={(checked) => toggleBatchPayment(batch.id, checked as boolean)}
                                                            />
                                                            <Label
                                                                htmlFor={`pay-batch-${batch.id}`}
                                                                className="text-sm cursor-pointer"
                                                            >
                                                                Pay Now
                                                                <span className="font-semibold text-primary ml-1">
                                                                    ₹{Math.max(0, batch.fee - (batch.discount_value || 0)).toLocaleString()}
                                                                </span>
                                                            </Label>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeBatch(batch.id)}
                                                            className="text-destructive hover:text-destructive hover:bg-destructive/10 mt-5"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </section>

                            <Separator />

                            {/* Section 2: Admission Charge */}
                            <section>
                                <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                                    Admission Charge
                                    <Badge variant="outline" className="font-normal text-xs ml-1">One-time</Badge>
                                </h3>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Charge Amount</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                                            <Input
                                                type="number"
                                                value={admissionCharge}
                                                onChange={(e) => setAdmissionCharge(e.target.value)}
                                                className="h-11 pl-7 text-lg font-medium"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Paying Now</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                                            <Input
                                                type="number"
                                                value={payingAdmissionCharge}
                                                onChange={(e) => setPayingAdmissionCharge(e.target.value)}
                                                className="h-11 pl-7 text-lg font-medium"
                                                max={admissionChargeAmount}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <Separator />

                            {/* Section 3: Payment Summary */}
                            <section>
                                <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
                                    Payment Summary
                                </h3>

                                {/* Summary Card */}
                                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Batch Fees ({selectedBatches.length} batch{selectedBatches.length !== 1 ? "es" : ""})</span>
                                        <span className="font-medium">₹{totalBatchFees.toLocaleString()}</span>
                                    </div>
                                    {totalDiscount > 0 && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-emerald-600 font-medium">Discount Applied</span>
                                            <span className="font-medium text-emerald-600">- ₹{totalDiscount.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Admission Charge</span>
                                        <span className="font-medium">₹{admissionChargeAmount.toLocaleString()}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold">Grand Total</span>
                                        <span className="font-bold text-xl">₹{totalFees.toLocaleString()}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-green-600 font-medium flex items-center gap-1">
                                            <CreditCard className="h-4 w-4" />
                                            Paying Now
                                        </span>
                                        <span className="font-semibold text-green-600 text-lg">₹{totalPaid.toLocaleString()}</span>
                                    </div>
                                    {totalPending > 0 && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-amber-600 font-medium">Pending Amount</span>
                                            <span className="font-semibold text-amber-600">₹{totalPending.toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Payment Details */}
                                <Form {...paymentForm}>
                                    <div className="grid gap-4 md:grid-cols-2 mt-4">
                                        <FormField
                                            control={paymentForm.control}
                                            name="mode"
                                            render={({ field }) => (
                                                <FormItem className="space-y-2">
                                                    <FormLabel className="text-sm font-medium">Payment Mode</FormLabel>
                                                    <Select value={field.value} onValueChange={field.onChange}>
                                                        <SelectTrigger className="h-11">
                                                            <SelectValue placeholder="Select Mode" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="CASH">Cash</SelectItem>
                                                            <SelectItem value="UPI">UPI</SelectItem>
                                                            <SelectItem value="BANK">Bank Transfer</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={paymentForm.control}
                                            name="receipt_no"
                                            render={({ field }) => (
                                                <FormItem className="space-y-2">
                                                    <FormLabel className="text-sm font-medium flex items-center gap-1">
                                                        <Receipt className="h-3.5 w-3.5" />
                                                        Receipt Number
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            placeholder="Enter receipt no."
                                                            className="h-11"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </Form>
                            </section>

                            {/* Submit Button */}
                            <div className="flex gap-4">
                                <Button type="button" variant="outline" size="lg" className="px-6" onClick={() => setStep(2)}>
                                    Back
                                </Button>
                                <Button
                                    onClick={paymentForm.handleSubmit(onFinalSubmit)}
                                    disabled={loading || (formData.service_type === "TUITION_BATCH" && selectedBatches.length === 0)}
                                    className="w-full h-12 text-base font-semibold gap-2"
                                    size="lg"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <GraduationCap className="h-5 w-5" />
                                            Complete Admission
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )
            }
        </div >
    );
}
