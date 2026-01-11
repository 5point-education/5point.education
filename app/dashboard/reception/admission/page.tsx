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
import { Loader2, CheckCircle2, Copy, Plus, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// --- Schemas ---

const studentSchema = z.object({
    // Course / Programme
    program_level: z.enum(["SECONDARY", "HIGHER_SECONDARY", "ENGINEERING", "ROBOTICS"]),
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
    phone: z.string().min(10, "Phone required"),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]),
    dob: z.string().optional(), // YYYY-MM-DD
    fatherName: z.string().min(2, "Father's Name required"),
    motherName: z.string().optional(),
    parentMobile: z.string().optional(),
    aadharNo: z.string().optional(),
    nationality: z.string().default("Indian"),

    permanentAddress: z.string().optional(),
    correspondenceAddress: z.string().min(5, "Current Address required"),

    service_type: z.enum(["HOME_TUTOR", "TUITION_BATCH"]),
    source_of_enquiry: z.string().optional(),
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
}

export default function AdmissionPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const enquiryId = searchParams.get("enquiryId");
    const { toast } = useToast();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [batches, setBatches] = useState<any[]>([]);

    // Data Store
    const [formData, setFormData] = useState<any>({});
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
            courses_engineering: [],
            courses_robotics: [],
            courses_extra: [],
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
            source_of_enquiry: "Walk-in"
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

    // Multiple Batch State
    const [selectedBatches, setSelectedBatches] = useState<{ id: string, name: string, fee: number, paid: number, feeModel?: FeeModel }[]>([]);
    const [tempBatchId, setTempBatchId] = useState("");
    const [tempFee, setTempFee] = useState("");
    const [tempPaid, setTempPaid] = useState("");

    // Auto-populate fee when batch is selected
    const handleBatchSelection = (batchId: string) => {
        setTempBatchId(batchId);
        const selectedBatch = batches.find(b => b.id === batchId);
        if (selectedBatch && selectedBatch.feeAmount) {
            if (selectedBatch.feeModel === "CUSTOM" && selectedBatch.installments) {
                // For custom, sum all installments
                const total = selectedBatch.installments.reduce((sum: number, i: InstallmentItem) => sum + (i.amount || 0), 0);
                setTempFee(total.toString());
            } else {
                setTempFee(selectedBatch.feeAmount.toString());
            }
        } else {
            setTempFee("");
        }
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

        // Prevent duplicate
        if (selectedBatches.find(x => x.id === tempBatchId)) {
            toast({ title: "Batch already added", variant: "destructive" });
            return;
        }

        setSelectedBatches(prev => [...prev, {
            id: tempBatchId,
            name: `${b.name} - ${b.subject}`,
            fee: parseFloat(tempFee),
            paid: tempPaid ? parseFloat(tempPaid) : 0,
            feeModel: b.feeModel
        }]);

        setTempBatchId("");
        setTempFee("");
        setTempPaid("");
    };

    const removeBatch = (id: string) => {
        setSelectedBatches(prev => prev.filter(x => x.id !== id));
    };

    const totalFees = selectedBatches.reduce((acc, curr) => acc + curr.fee, 0);
    const totalPaid = selectedBatches.reduce((acc, curr) => acc + curr.paid, 0);

    useEffect(() => {
        if (enquiryId) {
            fetch(`/api/enquiry/${enquiryId}`)
                .then(res => res.json())
                .then(data => {
                    studentForm.reset({
                        ...studentForm.getValues(),
                        name: data.name,
                        phone: data.phone,
                        class_level: data.class_level.toString(),
                        subjects: data.subjects,
                        service_type: data.service_type,
                        source_of_enquiry: "Enquiry #" + data.id.slice(-4)
                    });
                })
                .catch(err => console.error(err));
        }

        // Fetch batches for later
        fetch("/api/batches").then(res => res.json()).then(setBatches);
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
            // If TUITION_BATCH, iterate selected batches. If HOME_TUTOR, create one without batch.
            const admissionsToCreate = formData.service_type === "TUITION_BATCH"
                ? selectedBatches.map(b => ({ batchId: b.id, total_fees: b.fee, fees_pending: b.fee - b.paid }))
                : [{ batchId: null, total_fees: 0, fees_pending: 0 }]; // Home Tutor case? Logic might need check.

            // If Home tutor, we might need a fee input too? Assuming for now Home Tutor follows same flow or is custom.
            // But let's stick to the multiple batch change logic.

            for (const adm of admissionsToCreate) {
                const admissionRes = await fetch("/api/admissions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        studentId,
                        batchId: adm.batchId,
                        total_fees: adm.total_fees,
                        fees_pending: adm.fees_pending,
                    }),
                });
                if (!admissionRes.ok) console.error("Failed to create admission for batch " + adm.batchId);
            }

            // 3. Create Payment (Single Receipt)
            if (totalPaid > 0) {
                await fetch("/api/payments", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        studentId,
                        amount: totalPaid,
                        mode: values.mode,
                        receipt_no: values.receipt_no,
                    }),
                });
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
                                            <FormItem><FormLabel>Parent&apos;s Mob</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                        )} />
                                        <FormField control={studentForm.control} name="phone" render={({ field }) => (
                                            <FormItem><FormLabel>Student Mob</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={studentForm.control} name="email" render={({ field }) => (
                                            <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={studentForm.control} name="aadharNo" render={({ field }) => (
                                            <FormItem><FormLabel>Aadhar No</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
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
                                        <FormField control={studentForm.control} name="source_of_enquiry" render={({ field }) => (
                                            <FormItem><FormLabel>Source</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                        )} />
                                    </div>
                                </div>

                                <Button type="submit" className="w-full">Next Step</Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            )}

            {step === 2 && (
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
            )}

            {step === 3 && (
                <Card>
                    <CardHeader>
                        <CardTitle>3. Fees & Payment</CardTitle>
                        <CardDescription>Finalize admission</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...paymentForm}>
                            <form onSubmit={paymentForm.handleSubmit(onFinalSubmit)} className="space-y-4">
                                <div className="p-4 bg-muted/50 rounded-lg mb-4">
                                    <h4 className="font-semibold text-sm text-muted-foreground uppercase mb-1">Service Type</h4>
                                    <p className="font-medium text-lg">{formData.service_type === "TUITION_BATCH" ? "Tuition Batch" : "Home Tutor"}</p>
                                </div>

                                {formData.service_type === "TUITION_BATCH" && (
                                    <div className="space-y-4 border p-4 rounded-md bg-slate-50">
                                        <h4 className="font-semibold text-sm">Batch Assignment</h4>
                                        <div className="grid grid-cols-12 gap-2 items-end">
                                            <div className="col-span-4">
                                                <Label className="text-xs">Batch</Label>
                                                <Select value={tempBatchId} onValueChange={handleBatchSelection}>
                                                    <SelectTrigger><SelectValue placeholder="Select Batch" /></SelectTrigger>
                                                    <SelectContent>
                                                        {batches.map(b => (
                                                            <SelectItem key={b.id} value={b.id}>
                                                                {b.name} - {b.subject}
                                                                {b.feeModel && <span className="text-muted-foreground ml-1">({b.feeModel === "ONE_TIME" ? "One-time" : b.feeModel === "MONTHLY" ? "Monthly" : b.feeModel === "QUARTERLY" ? "Quarterly" : "Custom"})</span>}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="col-span-3">
                                                <Label className="text-xs">Total Fee {tempBatchId && batches.find(b => b.id === tempBatchId)?.feeModel && <span className="text-muted-foreground">{getFeeModelLabel(batches.find(b => b.id === tempBatchId)?.feeModel as FeeModel)}</span>}</Label>
                                                <Input type="number" placeholder="₹0" value={tempFee} onChange={e => setTempFee(e.target.value)} />
                                            </div>
                                            <div className="col-span-3">
                                                <Label className="text-xs">Paying Now</Label>
                                                <Input type="number" placeholder="₹0" value={tempPaid} onChange={e => setTempPaid(e.target.value)} />
                                            </div>
                                            <div className="col-span-2">
                                                <Button type="button" onClick={addBatch} disabled={!tempBatchId || !tempFee} className="w-full">
                                                    <Plus className="h-4 w-4" /> Add
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Selected Batches List */}
                                        {selectedBatches.length > 0 && (
                                            <div className="space-y-2">
                                                {selectedBatches.map(b => (
                                                    <div key={b.id} className="flex justify-between items-center bg-white p-2 border rounded text-sm">
                                                        <div>
                                                            <span className="font-medium">{b.name}</span>
                                                            {b.feeModel && <span className="text-xs ml-2 text-blue-600">{getFeeModelLabel(b.feeModel)}</span>}
                                                            <div className="text-muted-foreground text-xs">Fee: ₹{b.fee.toLocaleString()} | Paid: ₹{b.paid.toLocaleString()}</div>
                                                        </div>
                                                        <Button type="button" variant="ghost" size="sm" onClick={() => removeBatch(b.id)}>
                                                            <Trash2 className="h-4 w-4 text-red-500" />
                                                        </Button>
                                                    </div>
                                                ))}
                                                <div className="flex justify-between font-bold pt-2 border-t">
                                                    <span>Total</span>
                                                    <span>Fee: ₹{totalFees.toLocaleString()} | Paid: ₹{totalPaid.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Global Payment Details */}
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Removed separate Amount input as it is calculated */}
                                    <div className="space-y-2">
                                        <Label>Total Paying Now</Label>
                                        <Input disabled value={totalPaid} />
                                    </div>
                                    <FormField control={paymentForm.control} name="mode" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Payment Mode</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="CASH">Cash</SelectItem>
                                                    <SelectItem value="UPI">UPI</SelectItem>
                                                    <SelectItem value="BANK">Bank Transfer</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )} />
                                </div>
                                <FormField control={paymentForm.control} name="receipt_no" render={({ field }) => (
                                    <FormItem><FormLabel>Receipt No</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                )} />

                                <div className="flex gap-4">
                                    <Button type="button" variant="ghost" onClick={() => setStep(2)}>Back</Button>
                                    <Button type="submit" className="flex-1" disabled={loading}>
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Complete Admission
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
