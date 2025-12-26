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
import { CalendarIcon } from "lucide-react";
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
                const response = await fetch(`/api/enquiry?id=${params.id}`); // Note: The list API might not support ID, check implementation. 
                // Actually, looking at previous step, existing API was /api/enquiry (list) and new one is /api/enquiry/[id].
                // So I should fetch from /api/enquiry/[id] directly if I implemented GET there? 
                // I only implemented PATCH. I need to check if existing API supports fetching single.
                // Assuming I might need to implement GET in /api/enquiry/[id] or just filter from list (inefficient but works for now).
                // Let's force a GET implementation validation.

                // Wait, I only implemented PATCH in /api/enquiry/[id]. I should add GET there or use a different way.
                // Let's add GET to /api/enquiry/[id] first to be clean.
            } catch (error) {
                console.error(error);
            }
        };
    }, [params.id]);

    // Rethinking: I need to fetch the data. Current LIST api is at /api/enquiry.
    // I should PROBABLY update /api/enquiry/[id]/route.ts to also handle GET.

    return <div>Loading...</div>; // Placeholder to avoid writing a broken file first.
}
