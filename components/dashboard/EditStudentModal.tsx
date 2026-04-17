"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, User, Mail, Phone, Calendar, MapPin, Users } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

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
    const [savingProfile, setSavingProfile] = useState(false);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        parentName: "",
    });

    const [profileData, setProfileData] = useState({
        gender: "" as "MALE" | "FEMALE" | "OTHER" | "",
        dob: "",
        fatherName: "",
        motherName: "",
        parentMobile: "",
        permanentAddress: "",
        classLevel: "" as string,
        age: "" as string,
        stream: "" as string,
        board: "" as string,
    });

    useEffect(() => {
        if (student) {
            setFormData({
                name: student.name || "",
                email: student.email || "",
                phone: student.phone || "",
                parentName: student.parentName || "",
            });
            fetchProfileData(student.studentId);
        }
    }, [student]);

    const fetchProfileData = async (studentId: string) => {
        try {
            const res = await fetch(`/api/students/${studentId}`);
            if (res.ok) {
                const data = await res.json();
                setProfileData({
                    gender: data.gender || "",
                    dob: data.dob ? data.dob.split("T")[0] : "",
                    fatherName: data.fatherName || "",
                    motherName: data.motherName || "",
                    parentMobile: data.parentMobile || "",
                    permanentAddress: data.permanentAddress || "",
                    classLevel: data.classLevel?.toString() || "",
                    age: data.age?.toString() || "",
                    stream: data.stream || "",
                    board: data.board || "",
                });
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        }
    };

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

            if (profileData.gender || profileData.dob || profileData.fatherName) {
                await saveProfile();
            }

            toast({
                title: "Success",
                description: "Student details updated successfully",
            });
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error("Error updating student:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to update student details",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const saveProfile = async () => {
        if (!student) return;
        setSavingProfile(true);
        try {
            const profilePayload: Record<string, unknown> = {};
            if (profileData.gender) profilePayload.gender = profileData.gender;
            if (profileData.dob) profilePayload.dob = profileData.dob;
            if (profileData.fatherName) profilePayload.fatherName = profileData.fatherName;
            if (profileData.motherName) profilePayload.motherName = profileData.motherName;
            if (profileData.parentMobile) profilePayload.parentMobile = profileData.parentMobile;
            if (profileData.permanentAddress) profilePayload.permanentAddress = profileData.permanentAddress;
            if (profileData.classLevel) profilePayload.classLevel = parseInt(profileData.classLevel);
            if (profileData.age) profilePayload.age = parseInt(profileData.age);
            if (profileData.stream) profilePayload.stream = profileData.stream;
            if (profileData.board) profilePayload.board = profileData.board;

            await fetch(`/api/students/${student.studentId}/profile`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(profilePayload),
            });
        } catch (error) {
            console.error("Error saving profile:", error);
        } finally {
            setSavingProfile(false);
        }
    };

    if (!student) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Edit Student Details
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    {/* Basic Information */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                            <User className="h-4 w-4" /> Basic Information
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        className="pl-9"
                                        value={formData.email}
                                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                        required
                                    />
                                </div>
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
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="phone"
                                        type="tel"
                                        className="pl-9"
                                        value={formData.phone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="parentName">Parent/Guardian Name</Label>
                                <div className="relative">
                                    <Users className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="parentName"
                                        className="pl-9"
                                        value={formData.parentName}
                                        onChange={(e) => setFormData(prev => ({ ...prev, parentName: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Personal Details */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                            <Calendar className="h-4 w-4" /> Personal Details
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="gender">Gender</Label>
                                <Select
                                    value={profileData.gender}
                                    onValueChange={(val) => setProfileData(prev => ({ ...prev, gender: val as any }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="MALE">Male</SelectItem>
                                        <SelectItem value="FEMALE">Female</SelectItem>
                                        <SelectItem value="OTHER">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dob">Date of Birth</Label>
                                <Input
                                    id="dob"
                                    type="date"
                                    value={profileData.dob}
                                    onChange={(e) => setProfileData(prev => ({ ...prev, dob: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="age">Age</Label>
                                <Input
                                    id="age"
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={profileData.age}
                                    onChange={(e) => setProfileData(prev => ({ ...prev, age: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="classLevel">Class</Label>
                                <Select
                                    value={profileData.classLevel}
                                    onValueChange={(val) => setProfileData(prev => ({ ...prev, classLevel: val }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[...Array(12)].map((_, i) => (
                                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                                                Class {i + 1}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Parent Details */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                            <Users className="h-4 w-4" /> Parent Details
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="fatherName">Father&apos;s Name</Label>
                                <Input
                                    id="fatherName"
                                    value={profileData.fatherName}
                                    onChange={(e) => setProfileData(prev => ({ ...prev, fatherName: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="motherName">Mother&apos;s Name</Label>
                                <Input
                                    id="motherName"
                                    value={profileData.motherName}
                                    onChange={(e) => setProfileData(prev => ({ ...prev, motherName: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="parentMobile">Parent Mobile</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="parentMobile"
                                        type="tel"
                                        className="pl-9"
                                        value={profileData.parentMobile}
                                        onChange={(e) => setProfileData(prev => ({ ...prev, parentMobile: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Academic Details */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                            <MapPin className="h-4 w-4" /> Academic Details
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="stream">Stream</Label>
                                <Select
                                    value={profileData.stream}
                                    onValueChange={(val) => setProfileData(prev => ({ ...prev, stream: val }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select stream" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Science">Science</SelectItem>
                                        <SelectItem value="Commerce">Commerce</SelectItem>
                                        <SelectItem value="Arts">Arts</SelectItem>
                                        <SelectItem value="N/A">N/A</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="board">Board</Label>
                                <Select
                                    value={profileData.board}
                                    onValueChange={(val) => setProfileData(prev => ({ ...prev, board: val }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select board" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CBSE">CBSE</SelectItem>
                                        <SelectItem value="ICSE">ICSE</SelectItem>
                                        <SelectItem value="STATE">State Board</SelectItem>
                                        <SelectItem value="IB">IB</SelectItem>
                                        <SelectItem value="CAMBRIDGE">Cambridge</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="permanentAddress">Permanent Address</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="permanentAddress"
                                        className="pl-9"
                                        value={profileData.permanentAddress}
                                        onChange={(e) => setProfileData(prev => ({ ...prev, permanentAddress: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>
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