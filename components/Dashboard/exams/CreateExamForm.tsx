"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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

import { Loader2, Plus, Trash2 } from "lucide-react";
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

export function CreateExamForm({ batchId }: { batchId: string }) {
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<ExamFormValues>({
        resolver: zodResolver(examSchema),
        defaultValues: {
            name: "",
            date: new Date().toISOString().split('T')[0],
            isChapterwise: true,
            chapters: [{ name: "", max_marks: 0, order: 0 }],
        },
    });

    const isChapterwise = form.watch("isChapterwise");

    const { fields, append, remove, replace } = useFieldArray({
        control: form.control,
        name: "chapters",
    });

    // Effect to handle switching modes
    useEffect(() => {
        if (!isChapterwise) {
            // Switch to Full Syllabus mode: 1 chapter, fixed name
            replace([{ name: "Full Syllabus", max_marks: 0, order: 0 }]);
        } else {
            // If switching back to chapterwise and list is somehow empty or has the default "Full Syllabus", reset to blank
            const current = form.getValues("chapters");
            if (current.length === 1 && current[0].name === "Full Syllabus") {
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
            toast({ title: "Success", description: "Exam created successfully" });
            router.refresh();
            router.push(`/dashboard/teacher/batch/${batchId}/exams`);
        } catch (error) {
            toast({ title: "Error", description: "Failed to create exam", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Exam Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Final Semester Exam" {...field} />
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
                            <FormLabel>Date</FormLabel>
                            <FormControl>
                                <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="isChapterwise"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>
                                    Chapter-wise Breakdown
                                </FormLabel>
                                <FormDescription>
                                    Uncheck this if the exam covers the full syllabus without specific chapter marks.
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
                                onClick={() => append({ name: "", max_marks: 0, order: fields.length })}
                            >
                                <Plus className="mr-2 h-4 w-4" /> Add Chapter
                            </Button>
                        </div>
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex gap-4 items-end">
                                <FormField
                                    control={form.control}
                                    name={`chapters.${index}.name`}
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormLabel className={index !== 0 ? "sr-only" : ""}>Chapter Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Chapter Name" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`chapters.${index}.max_marks`}
                                    render={({ field }) => (
                                        <FormItem className="w-24">
                                            <FormLabel className={index !== 0 ? "sr-only" : ""}>Max Marks</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => remove(index)}
                                >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name={`chapters.0.max_marks`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Total Max Marks</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        A single &quot;Full Syllabus&quot; chapter will be created automatically.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                )}

                {form.formState.errors.chapters && (
                    <p className="text-sm font-medium text-destructive">
                        {form.formState.errors.chapters.message || form.formState.errors.chapters.root?.message}
                    </p>
                )}

                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Exam
                </Button>
            </form>
        </Form>
    );
}
