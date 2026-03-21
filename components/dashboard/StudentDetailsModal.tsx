"use client";

import Link from "next/link";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Phone, Mail, Calendar, Users, BookOpen, BarChart3 } from "lucide-react";

interface BatchInfo {
    id: string;
    name: string;
    subject: string;
    isActive?: boolean;
}

interface StudentDetails {
    studentId: string;
    name: string;
    email: string;
    phone: string;
    parentName: string;
    joinDate: string;
    batches?: BatchInfo[];
}

interface StudentDetailsModalProps {
    student: StudentDetails | null;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    /** When "teacher", show a link to view this student's analytics. */
    role?: "teacher" | "receptionist" | "admin";
    /** Optional callback to refresh student list */
    onRefresh?: () => void;
}

export function StudentDetailsModal({
    student,
    isOpen,
    onOpenChange,
    role,
    onRefresh,
}: StudentDetailsModalProps) {
    if (!student) return null;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const studentBatches = student.batches ?? [];

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                        </div>
                        <span>{student.name}</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-5">
                    {/* Contact Information */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                            Contact Information
                        </h4>
                        <div className="grid gap-2">
                            <div className="flex items-center gap-3 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>{student.phone}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span>{student.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>Joined {formatDate(student.joinDate)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Guardian Information */}
                    {student.parentName && (
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                Guardian
                            </h4>
                            <div className="flex items-center gap-3 text-sm">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span>{student.parentName}</span>
                            </div>
                        </div>
                    )}

                    {/* Batches */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                            Enrolled Batches
                        </h4>
                        {studentBatches.length > 0 ? (
                            <div className="space-y-2">
                                {studentBatches.map((batch) => (
                                    <div
                                        key={batch.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                                    >
                                        <div className="flex items-center gap-2">
                                            <BookOpen className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-sm font-medium">{batch.name}</p>
                                                <p className="text-xs text-muted-foreground">{batch.subject}</p>
                                            </div>
                                        </div>
                                        <Badge variant={batch.isActive ? "default" : "secondary"}>
                                            {batch.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No active batch enrollments
                            </p>
                        )}
                    </div>

                    {/* View Analytics (teachers only) */}
                    {role === "teacher" && (
                        <div className="pt-2 border-t">
                            <Button asChild variant="default" className="w-full" size="sm">
                                <Link
                                    href={`/dashboard/teacher/students/${student.studentId}/analytics`}
                                    onClick={() => onOpenChange(false)}
                                >
                                    <BarChart3 className="h-4 w-4 mr-2" />
                                    View student analytics
                                </Link>
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
