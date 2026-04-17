"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Phone, Mail, Calendar, Users, BookOpen, BarChart3, MapPin, GraduationCap, Clock } from "lucide-react";

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
    gender?: string;
    dob?: string | null;
    fatherName?: string;
    motherName?: string;
    parentMobile?: string;
    permanentAddress?: string;
    classLevel?: number | null;
    age?: number | null;
    stream?: string | null;
    board?: string | null;
}

interface StudentDetailsModalProps {
    student: StudentDetails | null;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    role?: "teacher" | "receptionist" | "admin";
    onRefresh?: () => void;
}

export function StudentDetailsModal({
    student,
    isOpen,
    onOpenChange,
    role,
    onRefresh,
}: StudentDetailsModalProps) {
    const [loading, setLoading] = useState(false);
    const [details, setDetails] = useState<StudentDetails | null>(null);

    useEffect(() => {
        if (student && isOpen) {
            setLoading(true);
            fetch(`/api/students/${student.studentId}`)
                .then(res => res.json())
                .then(data => {
                    setDetails({
                        ...student,
                        gender: data.gender,
                        dob: data.dob,
                        fatherName: data.fatherName,
                        motherName: data.motherName,
                        parentMobile: data.parentMobile,
                        permanentAddress: data.permanentAddress,
                        classLevel: data.classLevel,
                        age: data.age,
                        stream: data.stream,
                        board: data.board,
                    });
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [student, isOpen]);

    if (!student) return null;

    const studentBatches = student.batches ?? [];

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatDob = (dateString: string | null | undefined) => {
        if (!dateString) return null;
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const hasPersonalInfo = details?.gender || details?.dob || details?.age;
    const hasParentInfo = details?.fatherName || details?.motherName || details?.parentMobile;
    const hasAcademicInfo = details?.classLevel || details?.stream || details?.board || details?.permanentAddress;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                        </div>
                        <span>{student.name}</span>
                    </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="basic" className="flex-1 overflow-hidden">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="basic" className="flex items-center gap-1">
                            <User className="h-4 w-4" /> Basic
                        </TabsTrigger>
                        <TabsTrigger value="personal" className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" /> Personal
                        </TabsTrigger>
                        <TabsTrigger value="academic" className="flex items-center gap-1">
                            <GraduationCap className="h-4 w-4" /> Academic
                        </TabsTrigger>
                    </TabsList>

                    <div className="overflow-y-auto max-h-[60vh] py-4">
                        <TabsContent value="basic" className="space-y-5 m-0">
                            {/* Contact Information */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                    Contact Information
                                </h4>
                                <div className="grid gap-3">
                                    <div className="flex items-center gap-3 text-sm">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <span className="text-muted-foreground text-xs">Phone</span>
                                            <p>{student.phone}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <span className="text-muted-foreground text-xs">Email</span>
                                            <p>{student.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <span className="text-muted-foreground text-xs">Joined</span>
                                            <p>{formatDate(student.joinDate)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Guardian Information */}
                            {(details?.fatherName || details?.motherName || student.parentName) && (
                                <div className="space-y-3">
                                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                        Guardian
                                    </h4>
                                    <div className="grid gap-2">
                                        {details?.fatherName && (
                                            <div className="flex items-center gap-3 text-sm">
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <span className="text-muted-foreground text-xs">Father&apos;s Name</span>
                                                    <p>{details.fatherName}</p>
                                                </div>
                                            </div>
                                        )}
                                        {details?.motherName && (
                                            <div className="flex items-center gap-3 text-sm">
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <span className="text-muted-foreground text-xs">Mother&apos;s Name</span>
                                                    <p>{details.motherName}</p>
                                                </div>
                                            </div>
                                        )}
                                        {details?.parentMobile && (
                                            <div className="flex items-center gap-3 text-sm">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <span className="text-muted-foreground text-xs">Parent Mobile</span>
                                                    <p>{details.parentMobile}</p>
                                                </div>
                                            </div>
                                        )}
                                        {student.parentName && !details?.fatherName && (
                                            <div className="flex items-center gap-3 text-sm">
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <span className="text-muted-foreground text-xs">Parent/Guardian</span>
                                                    <p>{student.parentName}</p>
                                                </div>
                                            </div>
                                        )}
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
                                        No batch enrollments
                                    </p>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="personal" className="space-y-5 m-0">
                            {hasPersonalInfo ? (
                                <div className="grid gap-4">
                                    {details?.gender && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <span className="text-muted-foreground text-xs">Gender</span>
                                                <p className="capitalize">{details.gender.toLowerCase()}</p>
                                            </div>
                                        </div>
                                    )}
                                    {details?.dob && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <span className="text-muted-foreground text-xs">Date of Birth</span>
                                                <p>{formatDob(details.dob)}</p>
                                            </div>
                                        </div>
                                    )}
                                    {details?.age && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <span className="text-muted-foreground text-xs">Age</span>
                                                <p>{details.age} years</p>
                                            </div>
                                        </div>
                                    )}
                                    {(details?.fatherName || details?.motherName) && (
                                        <div className="pt-2 border-t">
                                            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                                                Parent Details
                                            </h4>
                                            <div className="grid gap-3">
                                                {details?.fatherName && (
                                                    <div className="flex items-center gap-3 text-sm">
                                                        <Users className="h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                            <span className="text-muted-foreground text-xs">Father&apos;s Name</span>
                                                            <p>{details.fatherName}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {details?.motherName && (
                                                    <div className="flex items-center gap-3 text-sm">
                                                        <Users className="h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                            <span className="text-muted-foreground text-xs">Mother&apos;s Name</span>
                                                            <p>{details.motherName}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {details?.parentMobile && (
                                                    <div className="flex items-center gap-3 text-sm">
                                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                            <span className="text-muted-foreground text-xs">Parent Mobile</span>
                                                            <p>{details.parentMobile}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>No personal details available</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="academic" className="space-y-5 m-0">
                            {hasAcademicInfo ? (
                                <div className="grid gap-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        {details?.classLevel && (
                                            <div className="flex items-center gap-3 text-sm">
                                                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <span className="text-muted-foreground text-xs">Class</span>
                                                    <p>Class {details.classLevel}</p>
                                                </div>
                                            </div>
                                        )}
                                        {details?.stream && (
                                            <div className="flex items-center gap-3 text-sm">
                                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <span className="text-muted-foreground text-xs">Stream</span>
                                                    <p>{details.stream}</p>
                                                </div>
                                            </div>
                                        )}
                                        {details?.board && (
                                            <div className="flex items-center gap-3 text-sm">
                                                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <span className="text-muted-foreground text-xs">Board</span>
                                                    <p>{details.board}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {details?.permanentAddress && (
                                        <div className="pt-2 border-t">
                                            <div className="flex items-start gap-3 text-sm">
                                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                <div>
                                                    <span className="text-muted-foreground text-xs">Permanent Address</span>
                                                    <p>{details.permanentAddress}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>No academic details available</p>
                                </div>
                            )}
                        </TabsContent>
                    </div>
                </Tabs>

                {/* View Analytics (teachers only) */}
                {role === "teacher" && studentBatches.length > 0 && (
                    <div className="flex-shrink-0 pt-4 border-t">
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
            </DialogContent>
        </Dialog>
    );
}