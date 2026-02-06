"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";

export default function RegisterUserPage() {
    const { toast } = useToast();
    const router = useRouter();
    const formRef = useRef<HTMLFormElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
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
                // Handle specific HTTP error codes
                if (response.status === 400) {
                    // Validation errors
                    if (result.errors) {
                        setErrors(result.errors);
                        toast({
                            title: "Validation Error",
                            description: result.message || "Please fix the form errors and try again.",
                            variant: "destructive",
                        });
                    } else {
                        toast({
                            title: "Invalid Input",
                            description: result.message || "Please check your input and try again.",
                            variant: "destructive",
                        });
                    }
                } else if (response.status === 409) {
                    // Conflict - user already exists
                    toast({
                        title: "User Already Exists",
                        description: result.message || "A user with this email already exists.",
                        variant: "destructive",
                    });
                } else if (response.status === 500) {
                    // Server error
                    toast({
                        title: "Server Error",
                        description: result.message || "An error occurred on the server. Please try again later.",
                        variant: "destructive",
                    });
                } else {
                    // Other errors
                    toast({
                        title: "Error",
                        description: result.message || "Something went wrong. Please try again.",
                        variant: "destructive",
                    });
                }
                return;
            }

            // Success case
            toast({
                title: "✅ User Created Successfully",
                description: result.message || `User has been registered successfully.`,
                variant: "default",
            });

            // Reset form and refresh
            formRef.current?.reset();
            setErrors(null);
            router.refresh();

        } catch (error) {
            console.error("Registration submission error:", error);
            toast({
                title: "Network Error",
                description: "Failed to connect to the server. Please check your internet connection and try again.",
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
                        Create an account for a new admin or receptionist.
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
                            <div className="relative">
                                <Input id="password" name="password" type={showPassword ? "text" : "password"} required minLength={6} disabled={isLoading} className="pr-10" />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </Button>
                            </div>
                            {errors?.password && (
                                <p className="text-sm text-red-500">{errors.password.join(", ")}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select name="role" required defaultValue="RECEPTIONIST" disabled={isLoading}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                    <SelectItem value="RECEPTIONIST">Receptionist</SelectItem>
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
