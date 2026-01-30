"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, ArrowLeft, BookOpen, Calendar, FileText } from "lucide-react";
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

    const { fields, append, remove, replace } = useFieldArray({
        control: form.control,
        name: "chapters",
    });

    useEffect(() => {
        if (!isChapterwise) {
            replace([{ name: "Full Syllabus", max_marks: 0, order: 0 }]);
        } else {
            const current = form.getValues("chapters");
            if (
                current.length === 1 &&
                current[0].name === "Full Syllabus"
            ) {
                replace([{ name: "", max_marks: 0, order: 0 }]);
            }
        }
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
            router.push(`/dashboard/teacher/batch/${batchId}/exams`);
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

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Batch context — always visible so teacher knows which batch */}
            <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">
                                Creating exam for
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                                <CardTitle className="text-xl">
                                    {batchName ?? "This batch"}
                                </CardTitle>
                                {batchSubject && (
                                    <Badge variant="secondary" className="font-normal">
                                        {batchSubject}
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <Link
                            href={`/dashboard/teacher/batch/${batchId}/exams`}
                            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4 shrink-0" />
                            Back to batch exams
                        </Link>
                    </div>
                </CardHeader>
            </Card>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Exam details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Exam details
                            </CardTitle>
                            <CardDescription>
                                Name and date of the exam. Students will see this when you enter marks.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Exam name</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="e.g. Unit Test 1, Mid-term, Final"
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
                                        <FormLabel className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            Exam date
                                        </FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Marks structure */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5" />
                                Marks structure
                            </CardTitle>
                            <CardDescription>
                                Choose whether to split marks by chapters or use a single total.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField
                                control={form.control}
                                name="isChapterwise"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-4 bg-muted/30">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel className="cursor-pointer">
                                                Chapter-wise marks
                                            </FormLabel>
                                            <FormDescription>
                                                Enable to enter marks per chapter. Turn off for a single total (e.g. &quot;Full syllabus&quot;).
                                            </FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />

                            {isChapterwise ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-medium">Chapters</h3>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                append({
                                                    name: "",
                                                    max_marks: 0,
                                                    order: fields.length,
                                                })
                                            }
                                        >
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add chapter
                                        </Button>
                                    </div>
                                    <div className="space-y-3">
                                        {fields.map((field, index) => (
                                            <div
                                                key={field.id}
                                                className="flex gap-3 items-end p-3 rounded-lg border bg-card"
                                            >
                                                <FormField
                                                    control={form.control}
                                                    name={`chapters.${index}.name`}
                                                    render={({ field: f }) => (
                                                        <FormItem className="flex-1 min-w-0">
                                                            <FormLabel className={index !== 0 ? "sr-only" : ""}>
                                                                Chapter name
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="Chapter name"
                                                                    {...f}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`chapters.${index}.max_marks`}
                                                    render={({ field: f }) => (
                                                        <FormItem className="w-24 shrink-0">
                                                            <FormLabel className={index !== 0 ? "sr-only" : ""}>
                                                                Max marks
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    min={1}
                                                                    {...f}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="shrink-0 text-muted-foreground hover:text-destructive"
                                                    onClick={() => remove(index)}
                                                    disabled={fields.length === 1}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-lg border p-4 bg-muted/30">
                                    <FormField
                                        control={form.control}
                                        name={`chapters.0.max_marks`}
                                        render={({ field: f }) => (
                                            <FormItem>
                                                <FormLabel>Total max marks</FormLabel>
                                                <FormControl>
                                                    <Input type="number" min={1} {...f} />
                                                </FormControl>
                                                <FormDescription>
                                                    One &quot;Full Syllabus&quot; entry will be used. No per-chapter breakdown.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}

                            {form.formState.errors.chapters && (
                                <p className="text-sm font-medium text-destructive">
                                    {form.formState.errors.chapters.message ??
                                        (form.formState.errors.chapters as { root?: { message?: string } }).root?.message}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                        <Link href={`/dashboard/teacher/batch/${batchId}/exams`}>
                            <Button type="button" variant="outline" className="w-full sm:w-auto">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
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
