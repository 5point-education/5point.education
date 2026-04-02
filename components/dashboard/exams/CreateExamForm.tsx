"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, ArrowLeft, Calculator } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

const examSchema = z.object({
    name: z.string().min(1, "Exam name is required"),
    date: z.string(),
    isChapterwise: z.boolean().default(true),
    chapters: z.array(
        z.object({
            name: z.string().min(1, "Chapter name is required"),
            max_marks: z.coerce.number().min(1, "Max marks must be at least 1"),
            order: z.number().default(0),
        })
    ).min(1, "At least one chapter is required"),
});

type ExamFormValues = z.infer<typeof examSchema>;

export interface CreateExamFormProps {
    batchId: string;
    batchName?: string;
    batchSubject?: string;
}

export function CreateExamForm({
    batchId,
    batchName,
    batchSubject,
}: CreateExamFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<ExamFormValues>({
        resolver: zodResolver(examSchema),
        defaultValues: {
            name: "",
            date: new Date().toISOString().split("T")[0],
            isChapterwise: true,
            chapters: [{ name: "", max_marks: 0, order: 0 }],
        },
    });

    const isChapterwise = form.watch("isChapterwise");
    const watchedChapters = form.watch("chapters");

    const { fields, append, remove, replace } = useFieldArray({
        control: form.control,
        name: "chapters",
    });

    useEffect(() => {
        if (!isChapterwise) {
            const current = form.getValues("chapters");
            const sum = current.reduce((acc, ch) => acc + (Number(ch.max_marks) || 0), 0);
            replace([{ name: "Full Syllabus", max_marks: sum || 0, order: 0 }]);
        } else {
            const current = form.getValues("chapters");
            if (
                current.length === 1 &&
                current[0].name === "Full Syllabus"
            ) {
                replace([{ name: "", max_marks: current[0].max_marks, order: 0 }]);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isChapterwise, replace, form]);

    async function onSubmit(data: ExamFormValues) {
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/exams", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    batchId,
                    name: data.name,
                    date: data.date,
                    chapters: data.chapters.map((c, i) => ({ ...c, order: i })),
                }),
            });

            if (!res.ok) throw new Error("Failed");
            toast({
                title: "Exam created",
                description: "You can now enter marks for students.",
            });
            router.refresh();
            router.push(`/dashboard/teacher/exam?batchId=${batchId}`);
        } catch {
            toast({
                title: "Error",
                description: "Failed to create exam. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    const calcTotalMarks = useCallback(() => {
        if (isChapterwise) {
            return watchedChapters.reduce((sum, ch) => sum + (Number(ch.max_marks) || 0), 0);
        } else {
            return Number(watchedChapters[0]?.max_marks) || 0;
        }
    }, [isChapterwise, watchedChapters]);

    const getWeights = useCallback(() => {
        const total = calcTotalMarks();
        if (total === 0) return '';
        return watchedChapters
            .map(ch => Math.round(((Number(ch.max_marks) || 0) / total) * 100))
            .filter(Boolean)
            .join('/');
    }, [calcTotalMarks, watchedChapters]);

    return (
        <div className="w-full space-y-8 pb-16 px-4 md:px-8">
            <div className="mb-10">
                <Link
                    href={`/dashboard/teacher/exam`}
                    className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-8 group"
                >
                    <ArrowLeft className="mr-2 h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-1" />
                    Back to exams
                </Link>

                <div className="flex items-center gap-2 mb-5">
                    <Badge className="bg-[#EAF1FC] text-blue-700 hover:bg-[#EAF1FC] border-transparent uppercase text-[10px] font-bold rounded px-2.5 py-0.5 tracking-wide">
                        {batchName ?? "THIS BATCH"}
                    </Badge>
                    {batchSubject && (
                        <Badge variant="outline" className="text-gray-500 uppercase text-[10px] bg-gray-50/50 font-bold rounded px-2.5 py-0.5 border-gray-200 tracking-wide">
                            {batchSubject}
                        </Badge>
                    )}
                </div>
                
                <h1 className="text-[32px] leading-10 font-bold tracking-tight text-slate-900 mb-2">Create New Exam</h1>
                <p className="text-gray-500 text-sm">Configure the assessment structure and scheduling for this batch.</p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
                    
                    {/* EXAM DETAILS SECTION */}
                    <div>
                        <div className="flex items-center text-[10px] font-bold text-gray-400 tracking-widest mb-6 px-1">
                            <span className="flex-grow border-t border-gray-200/60"></span>
                            <span className="px-5">EXAM DETAILS</span>
                            <span className="flex-grow border-t border-gray-200/60"></span>
                        </div>

                        <div className="bg-white rounded-xl p-6 md:p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[13px] font-semibold text-slate-800">Exam name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g. Unit Test 1, Mid-term, Final"
                                                    className="bg-transparent border-gray-200 h-11 text-sm shadow-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded-lg placeholder:text-gray-300"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[13px] font-semibold text-slate-800">Exam date</FormLabel>
                                            <FormControl>
                                                <Input type="date" className="bg-transparent border-gray-200 h-11 text-sm shadow-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded-lg text-gray-700 w-full" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    {/* MARKS STRUCTURE SECTION */}
                    <div>
                        <div className="flex items-center text-[10px] font-bold text-gray-400 tracking-widest mb-6 px-1">
                            <span className="flex-grow border-t border-gray-200/60"></span>
                            <span className="px-5">MARKS STRUCTURE</span>
                            <span className="flex-grow border-t border-gray-200/60"></span>
                        </div>

                        <div className="bg-white rounded-xl p-6 md:p-8 relative">
                            <FormField
                                control={form.control}
                                name="isChapterwise"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between space-y-0 pb-8 mb-8 border-b border-gray-100">
                                        <div className="space-y-1.5">
                                            <FormLabel className="text-base font-semibold text-slate-900 cursor-pointer">
                                                Chapter-wise marks
                                            </FormLabel>
                                            <FormDescription className="text-gray-500 text-[13px]">
                                                Enable to enter marks per chapter. Turn off for a single total.
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                className="data-[state=checked]:bg-blue-600 scale-125 origin-right"
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            {isChapterwise ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-12 gap-4 pb-2">
                                        <div className="col-span-8 text-[10px] font-bold text-gray-400 tracking-widest uppercase">Chapter Name</div>
                                        <div className="col-span-4 text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">Max Marks</div>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        {fields.map((field, index) => (
                                            <div key={field.id} className="grid grid-cols-12 gap-4 items-center group relative">
                                                <div className="col-span-8">
                                                    <FormField
                                                        control={form.control}
                                                        name={`chapters.${index}.name`}
                                                        render={({ field: f }) => (
                                                            <FormItem className="space-y-0">
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder="Algebra Foundations"
                                                                        className="bg-gray-100 border-transparent h-11 text-sm shadow-none focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:bg-white transition-colors"
                                                                        {...f}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                                <div className="col-span-3">
                                                    <FormField
                                                        control={form.control}
                                                        name={`chapters.${index}.max_marks`}
                                                        render={({ field: f }) => (
                                                            <FormItem className="space-y-0">
                                                                <FormControl>
                                                                    <Input
                                                                        type="number"
                                                                        min={1}
                                                                        className="bg-gray-100 border-transparent h-11 text-sm shadow-none focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:bg-white transition-colors"
                                                                        {...f}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                                <div className="col-span-1 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity absolute -right-2 top-0.5">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-10 w-10 text-gray-400 hover:text-red-500 shrink-0 hover:bg-red-50"
                                                        onClick={() => remove(index)}
                                                        disabled={fields.length === 1}
                                                    >
                                                        <Trash2 className="h-[18px] w-[18px]" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <div className="pt-6 pb-2 flex justify-between items-center border-t border-gray-100 mt-6">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            className="text-blue-700 hover:text-blue-800 hover:bg-transparent font-semibold text-sm px-0 h-auto p-0"
                                            onClick={() => append({ name: "", max_marks: 0, order: fields.length })}
                                        >
                                            <div className="bg-blue-700 rounded-full h-[18px] w-[18px] flex items-center justify-center mr-2 shadow-sm">
                                                <Plus className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                                            </div>
                                            Add chapter
                                        </Button>

                                        <div className="flex items-center bg-gray-50/80 px-4 py-2.5 rounded-lg border border-gray-100">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-4">Total Max Marks</span>
                                            <span className="text-xl font-bold text-slate-900 border-l border-gray-200 pl-4">{calcTotalMarks()}</span>
                                        </div>
                                    </div>
                                    
                                    {form.formState.errors.chapters && (
                                        <p className="text-sm font-medium text-destructive mt-4">
                                            {form.formState.errors.chapters.message ??
                                                (form.formState.errors.chapters as { root?: { message?: string } }).root?.message}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                     <div className="grid grid-cols-12 gap-4 pb-2">
                                         <div className="col-span-12 text-[10px] font-bold text-gray-400 tracking-widest uppercase">Total Max Marks</div>
                                     </div>
                                     <FormField
                                         control={form.control}
                                         name={`chapters.0.max_marks`}
                                         render={({ field: f }) => (
                                             <FormItem className="space-y-0 max-w-[12rem]">
                                                 <FormControl>
                                                     <Input type="number" min={1} className="bg-gray-100 border-transparent h-11 text-sm shadow-none focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:bg-white" {...f} />
                                                 </FormControl>
                                                 <FormDescription className="pt-2 text-xs text-gray-400">
                                                     One &quot;Full Syllabus&quot; entry will be used.
                                                 </FormDescription>
                                                 <FormMessage />
                                             </FormItem>
                                         )}
                                     />
                                </div>
                            )}


                        </div>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row gap-4 pt-16 sm:justify-end">
                        <Link href={`/dashboard/teacher/exam`}>
                            <Button type="button" variant="ghost" className="w-full sm:w-auto font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg h-11 px-6">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-[#1055D4] hover:bg-blue-700 text-white shadow font-semibold rounded-lg h-11 px-8 text-[13px]">
                            {isSubmitting && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Create exam
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
