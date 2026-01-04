"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function RegisterUserPage() {
    const { toast } = useToast();
    const router = useRouter();
    const formRef = useRef<HTMLFormElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]> | null>(null);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        setErrors(null);

        const formData = new FormData(event.currentTarget);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch("/api/admin/users/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                // Handle 400/500 errors
                if (result.errors) {
                    setErrors(result.errors);
                    toast({
                        title: "Validation Error",
                        description: result.message || "Please fix the form errors.",
                        variant: "destructive",
                    });
                } else {
                    toast({
                        title: "Error",
                        description: result.message || "Something went wrong.",
                        variant: "destructive",
                    });
                }
                return;
            }

            // Success case
            toast({
                title: "Success",
                description: result.message,
                variant: "default",
            });
            formRef.current?.reset();
            router.refresh(); // Refresh server components if needed (e.g. user list)

        } catch (error) {
            console.error("Submission error:", error);
            toast({
                title: "Network Error",
                description: "Failed to connect to the server.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex justify-center items-center min-h-[80vh] p-4">
            <Card className="w-full max-w-md shadow-lg border-2">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Register New User</CardTitle>
                    <CardDescription className="text-center">
                        Create an account for a new admin, teacher, or student.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} ref={formRef} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" name="name" placeholder="John Doe" required disabled={isLoading} />
                            {errors?.name && (
                                <p className="text-sm text-red-500">{errors.name.join(", ")}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" placeholder="john@example.com" required disabled={isLoading} />
                            {errors?.email && (
                                <p className="text-sm text-red-500">{errors.email.join(", ")}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" name="password" type="password" required minLength={6} disabled={isLoading} />
                            {errors?.password && (
                                <p className="text-sm text-red-500">{errors.password.join(", ")}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select name="role" required defaultValue="STUDENT" disabled={isLoading}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                    <SelectItem value="RECEPTIONIST">Receptionist</SelectItem>
                                    <SelectItem value="TEACHER">Teacher</SelectItem>
                                    <SelectItem value="STUDENT">Student</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors?.role && (
                                <p className="text-sm text-red-500">{errors.role.join(", ")}</p>
                            )}
                        </div>

                        <div className="pt-4">
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Registering...
                                    </>
                                ) : (
                                    "Register User"
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
