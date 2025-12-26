"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { CalendarIcon, Loader2, ArrowLeft } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const formSchema = z.object({
    status: z.enum(["PENDING", "FEES_DISCUSSED", "ADMITTED", "LOST"]),
    lost_reason: z.enum(["FEES", "TIMING", "SUBJECT_ISSUES", "OTHER"]).optional(),
    follow_up_date: z.date().optional(),
}).refine((data) => {
    if (data.status === "LOST" && !data.lost_reason) {
        return false;
    }
    return true;
}, {
    message: "Lost reason is required when status is LOST",
    path: ["lost_reason"],
});

type FormValues = z.infer<typeof formSchema>;

export default function EnquiryEditPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [enquiry, setEnquiry] = useState<any>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            status: "PENDING",
        },
    });

    const watchStatus = form.watch("status");

    useEffect(() => {
        const fetchEnquiry = async () => {
            try {
                const response = await fetch(`/api/enquiry/${params.id}`);
                if (!response.ok) throw new Error("Failed to fetch enquiry");

                const data = await response.json();
                setEnquiry(data);

                // Reset form with fetched data
                form.reset({
                    status: data.status,
                    lost_reason: data.lost_reason || undefined,
                    follow_up_date: data.follow_up_date ? new Date(data.follow_up_date) : undefined,
                });
            } catch (error) {
                console.error(error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Could not load enquiry details",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchEnquiry();
    }, [params.id, form, toast]);

    const onSubmit = async (values: FormValues) => {
        try {
            const response = await fetch(`/api/enquiry/${params.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                const msg = await response.text();
                throw new Error(msg);
            }

            toast({
                title: "Success",
                description: "Enquiry updated successfully",
            });

            router.refresh();
            router.push("/dashboard/reception");
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Something went wrong",
            });
        }
    };

    const handleRegister = () => {
        router.push(`/dashboard/reception/admission?enquiryId=${params.id}`);
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!enquiry) {
        return <div>Enquiry not found</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">Manage Enquiry</h1>
                    <p className="text-muted-foreground">Update status or proceed to admission</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Read-Only Details Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Student Details</CardTitle>
                        <CardDescription>Contact and requirement information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-sm font-medium text-muted-foreground">Name</span>
                                <p className="text-lg">{enquiry.name}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-muted-foreground">Phone</span>
                                <p className="text-lg">{enquiry.phone}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-muted-foreground">Class</span>
                                <p className="text-lg">{enquiry.class_level}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-muted-foreground">Service Type</span>
                                <p className="text-lg">{enquiry.service_type.replace("_", " ")}</p>
                            </div>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-muted-foreground">Subjects</span>
                            <p className="text-lg">{enquiry.subjects}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Edit Form Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Update Status</CardTitle>
                        <CardDescription>Track the progress of this enquiry</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Status</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="PENDING">Pending</SelectItem>
                                                    <SelectItem value="FEES_DISCUSSED">Fees Discussed</SelectItem>
                                                    <SelectItem value="ADMITTED">Admitted</SelectItem>
                                                    <SelectItem value="LOST">Lost</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {watchStatus === "LOST" && (
                                    <FormField
                                        control={form.control}
                                        name="lost_reason"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Reason for Loss</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select reason" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="FEES">Fees Issue</SelectItem>
                                                        <SelectItem value="TIMING">Timing Issue</SelectItem>
                                                        <SelectItem value="SUBJECT_ISSUES">Subject availability</SelectItem>
                                                        <SelectItem value="OTHER">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                {(watchStatus === "PENDING" || watchStatus === "FEES_DISCUSSED") && (
                                    <FormField
                                        control={form.control}
                                        name="follow_up_date"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Next Follow-up</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={"outline"}
                                                                className={cn(
                                                                    "w-full pl-3 text-left font-normal",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value ? (
                                                                    format(field.value, "PPP")
                                                                ) : (
                                                                    <span>Pick a date</span>
                                                                )}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value}
                                                            onSelect={field.onChange}
                                                            disabled={(date) =>
                                                                date < new Date()
                                                            }
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                <div className="flex justify-between pt-4">
                                    <Button type="button" variant="secondary" onClick={() => router.back()}>
                                        Cancel
                                    </Button>
                                    <div className="space-x-2">
                                        {watchStatus === "ADMITTED" ? (
                                            <Button type="button" onClick={handleRegister}>
                                                Proceed to Admission
                                            </Button>
                                        ) : (
                                            <>
                                                <Button type="button" variant="outline" onClick={handleRegister}>
                                                    Register Student
                                                </Button>
                                                <Button type="submit">Save Changes</Button>
                                            </>
                                        )}
                                    </div>
                                </div>

                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
