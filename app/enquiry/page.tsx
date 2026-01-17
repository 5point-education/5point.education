"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, ArrowLeft } from "lucide-react";

const enquirySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(/^[0-9]{10}$/, "Phone number must be 10 digits"),
  class_level: z.number().min(1).max(12),
  subjects: z.string().min(2, "Please specify subjects"),
  service_type: z.enum(["HOME_TUTOR", "TUITION_BATCH"]),
});

type EnquiryFormData = z.infer<typeof enquirySchema>;

function EnquiryForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const defaultService = searchParams.get("service") === "home" ? "HOME_TUTOR" : "TUITION_BATCH";

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EnquiryFormData>({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      service_type: defaultService as "HOME_TUTOR" | "TUITION_BATCH",
    },
  });

  const onSubmit = async (data: EnquiryFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setSubmitSuccess(true);
        reset();
        setTimeout(() => {
          router.push("/");
        }, 3000);
      } else {
        alert("Failed to submit enquiry. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting enquiry:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <Card className="border-green-500 border-2">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <CardTitle className="text-2xl">Enquiry Submitted Successfully!</CardTitle>
          <CardDescription>
            Thank you for your interest. Our team will contact you within 24 hours.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl">Submit Your Enquiry</CardTitle>
        <CardDescription>
          Fill out the form below and our counselors will get in touch with you soon.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Name */}
          <div>
            <Label htmlFor="name">Student Name *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Enter student's full name"
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <Label htmlFor="phone">Contact Phone *</Label>
            <Input
              id="phone"
              {...register("phone")}
              onInput={(e) => {
                e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '');
              }}
              placeholder="10-digit mobile number"
              maxLength={10}
              inputMode="numeric"
            />
            {errors.phone && (
              <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
            )}
          </div>

          {/* Class Level */}
          <div>
            <Label htmlFor="class_level">Class/Grade *</Label>
            <Input
              id="class_level"
              type="number"
              {...register("class_level", { valueAsNumber: true })}
              placeholder="Enter class (1-12)"
              min="1"
              max="12"
            />
            {errors.class_level && (
              <p className="text-sm text-red-600 mt-1">{errors.class_level.message}</p>
            )}
          </div>

          {/* Subjects */}
          <div>
            <Label htmlFor="subjects">Subjects of Interest *</Label>
            <Input
              id="subjects"
              {...register("subjects")}
              placeholder="e.g., Physics, Mathematics, Chemistry"
            />
            {errors.subjects && (
              <p className="text-sm text-red-600 mt-1">{errors.subjects.message}</p>
            )}
          </div>

          {/* Service Type */}
          <div>
            <Label htmlFor="service_type">Preferred Mode *</Label>
            <select
              id="service_type"
              {...register("service_type")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="TUITION_BATCH">Tuition Batch (Center Visit)</option>
              <option value="HOME_TUTOR">Home Tutor (Teacher Visits)</option>
            </select>
            {errors.service_type && (
              <p className="text-sm text-red-600 mt-1">{errors.service_type.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Enquiry"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function EnquiryPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="flex items-center space-x-2 w-fit">
            <ArrowLeft className="h-5 w-5" />
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">5 Point Education Hub</span>
          </Link>
        </div>
      </nav>

      {/* Form Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <Suspense fallback={<div className="text-center p-8">Loading form...</div>}>
            <EnquiryForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
