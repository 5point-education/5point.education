"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, User, Mail, Phone, Calendar, MapPin, Users, GraduationCap } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const ENGINEERING_STREAMS = [
    "B.Tech",
    "B.E.",
    "B.Sc",
    "M.Tech",
    "M.E.",
    "M.Sc",
    "BCA",
    "MCA",
    "BBA",
    "MBA",
    "B.Pharm",
    "M.Pharm",
    "B.Arch",
    "B.Des",
    "Diploma in Engineering",
    "Other",
] as const;

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

    // Program level state — inferred from existing stream value
    const [programLevel, setProgramLevel] = useState<string>("");
    const isEngineering = programLevel === "ENGINEERING";

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
                const streamVal = data.stream || "";
                setProfileData({
                    gender: data.gender || "",
                    dob: data.dob ? data.dob.split("T")[0] : "",
                    fatherName: data.fatherName || "",
                    motherName: data.motherName || "",
                    parentMobile: data.parentMobile || "",
                    permanentAddress: data.permanentAddress || "",
                    classLevel: data.classLevel?.toString() || "",
                    age: data.age?.toString() || "",
                    stream: streamVal,
                    board: data.board || "",
                });
                // Infer program level from stream value
                const isEngrStream = ENGINEERING_STREAMS.some(s => s === streamVal);
                setProgramLevel(isEngrStream ? "ENGINEERING" : "");
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
            // Build a combined payload with both basic info and profile fields
            const payload: Record<string, unknown> = {
                ...formData,
            };

            // Add profile fields
            if (profileData.gender) payload.gender = profileData.gender;
            if (profileData.dob) payload.dob = profileData.dob;
            if (profileData.fatherName) payload.fatherName = profileData.fatherName;
            if (profileData.motherName) payload.motherName = profileData.motherName;
            if (profileData.parentMobile) payload.parentMobile = profileData.parentMobile;
            if (profileData.permanentAddress) payload.permanentAddress = profileData.permanentAddress;
            if (profileData.classLevel) payload.classLevel = parseInt(profileData.classLevel);
            if (profileData.age) payload.age = parseInt(profileData.age);
            // Always include stream and board (even if empty, to allow clearing)
            payload.stream = profileData.stream || null;
            payload.board = profileData.board || null;

            const response = await fetch(`/api/students/${student.studentId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
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
                            {/* Class - hidden for Engineering */}
                            {!isEngineering && (
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
                            )}
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
                            <GraduationCap className="h-4 w-4" /> Academic Details
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="programLevel">Program Level</Label>
                                <Select
                                    value={programLevel}
                                    onValueChange={(val) => {
                                        setProgramLevel(val);
                                        // Clear board and class when switching to engineering
                                        if (val === "ENGINEERING") {
                                            setProfileData(prev => ({ ...prev, board: "", classLevel: "", stream: "" }));
                                        } else {
                                            setProfileData(prev => ({ ...prev, stream: "" }));
                                        }
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select program level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PRIMARY">Class (1-7)</SelectItem>
                                        <SelectItem value="SECONDARY">Secondary (Class 8-10)</SelectItem>
                                        <SelectItem value="HIGHER_SECONDARY">Higher Secondary (11-12)</SelectItem>
                                        <SelectItem value="ENGINEERING">Engineering</SelectItem>
                                        <SelectItem value="ROBOTICS">Robotics</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {/* Stream - dropdown with engineering streams when Engineering, regular otherwise */}
                            <div className="space-y-2">
                                <Label htmlFor="stream">{isEngineering ? "Stream / Degree" : "Stream"}</Label>
                                {isEngineering ? (
                                    <Select
                                        value={profileData.stream}
                                        onValueChange={(val) => setProfileData(prev => ({ ...prev, stream: val }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select stream" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ENGINEERING_STREAMS.map((stream) => (
                                                <SelectItem key={stream} value={stream}>{stream}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
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
                                )}
                            </div>
                            {/* Board - hidden for Engineering */}
                            {!isEngineering && (
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
                                            <SelectItem value="WBBSE">WBBSE</SelectItem>
                                            <SelectItem value="OTHER">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
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