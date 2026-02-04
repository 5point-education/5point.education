"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Student {
    studentId: string;
    name: string;
    email: string;
    phone: string;
    parentName: string;
}

interface EditStudentModalProps {
    student: Student | null;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function EditStudentModal({
    student,
    isOpen,
    onOpenChange,
    onSuccess,
}: EditStudentModalProps) {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        parentName: "",
    });

    useEffect(() => {
        if (student) {
            setFormData({
                name: student.name || "",
                phone: student.phone || "",
                parentName: student.parentName || "",
            });
        }
    }, [student]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!student) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/students/${student.studentId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error || "Failed to update student");
            }

            toast({
                title: "Success",
                description: "Student details updated successfully",
            });
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error("Error updating student:", error);
            toast({
                title: "Error",
                description: "Failed to update student details",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    if (!student) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Student Details</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email (Cannot be changed)</Label>
                        <Input
                            id="email"
                            value={student.email}
                            disabled
                            className="bg-muted"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="parentName">Parent/Guardian Name</Label>
                        <Input
                            id="parentName"
                            value={formData.parentName}
                            onChange={(e) => setFormData(prev => ({ ...prev, parentName: e.target.value }))}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
