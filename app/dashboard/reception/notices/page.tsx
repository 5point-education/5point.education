"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Megaphone,
    Plus,
    MoreVertical,
    Pencil,
    Trash2,
    AlertTriangle,
    AlertCircle,
    Info,
    Clock,
    Globe,
    Users,
    User,
    ChevronLeft,
    ChevronRight,
    Filter,
    X,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Notice {
    id: string;
    title: string;
    body: string;
    scope: "GLOBAL" | "BATCH" | "INDIVIDUAL";
    priority: "NORMAL" | "HIGH" | "URGENT";
    expiresAt: string | null;
    createdAt: string;
    isExpired: boolean;
    creator: {
        id: string;
        name: string;
        email: string;
        role: string;
    };
    batch: {
        id: string;
        name: string;
        subject: string;
    } | null;
    _count: {
        recipients: number;
    };
}

interface Batch {
    id: string;
    name: string;
    subject: string;
}

interface Student {
    studentId: string;
    userId: string;
    name: string;
    email: string;
}

interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function ReceptionNoticesPage() {
    const { toast } = useToast();
    const [notices, setNotices] = useState<Notice[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    // Filters
    const [scopeFilter, setScopeFilter] = useState<string>("");
    const [priorityFilter, setPriorityFilter] = useState<string>("");
    const [showExpired, setShowExpired] = useState(false);

    // Create/Edit modal
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingNotice, setEditingNotice] = useState<Notice | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        title: "",
        body: "",
        scope: "GLOBAL" as "GLOBAL" | "BATCH" | "INDIVIDUAL",
        priority: "NORMAL" as "NORMAL" | "HIGH" | "URGENT",
        expiresAt: "",
        batchId: "",
        studentIds: [] as string[],
    });

    // Batches and students for dropdowns
    const [batches, setBatches] = useState<Batch[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loadingBatches, setLoadingBatches] = useState(false);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [studentSearch, setStudentSearch] = useState("");

    // Filter students based on search
    const filteredStudents = students.filter((student) =>
        student.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        student.email.toLowerCase().includes(studentSearch.toLowerCase())
    );

    // Delete confirmation
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deletingNotice, setDeletingNotice] = useState<Notice | null>(null);

    const [submitting, setSubmitting] = useState(false);

    const fetchNotices = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: "10",
                showExpired: showExpired.toString(),
            });
            if (["GLOBAL", "BATCH", "INDIVIDUAL"].includes(scopeFilter)) params.append("scope", scopeFilter);
            if (["NORMAL", "HIGH", "URGENT"].includes(priorityFilter)) params.append("priority", priorityFilter);

            const response = await fetch(`/api/notices?${params}`);
            if (!response.ok) throw new Error("Failed to fetch notices");

            const data = await response.json();
            setNotices(data.notices);
            setPagination(data.pagination);
        } catch (err) {
            toast({
                variant: "destructive",
                title: "Error",
                description: err instanceof Error ? err.message : "Failed to fetch notices",
            });
        } finally {
            setLoading(false);
        }
    }, [currentPage, scopeFilter, priorityFilter, showExpired, toast]);

    useEffect(() => {
        fetchNotices();
    }, [fetchNotices]);

    const fetchBatches = async () => {
        if (batches.length > 0) return;
        try {
            setLoadingBatches(true);
            const response = await fetch("/api/batches");
            if (response.ok) {
                const data = await response.json();
                setBatches(data);
            }
        } catch (err) {
            console.error("Failed to fetch batches", err);
        } finally {
            setLoadingBatches(false);
        }
    };

    const fetchStudents = async () => {
        if (students.length > 0) return;
        try {
            setLoadingStudents(true);
            const response = await fetch("/api/students?limit=500");
            if (response.ok) {
                const data = await response.json();
                setStudents(data.students || data);
            }
        } catch (err) {
            console.error("Failed to fetch students", err);
        } finally {
            setLoadingStudents(false);
        }
    };

    const handleCreateNotice = async () => {
        if (!formData.title || !formData.body) {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Title and body are required",
            });
            return;
        }

        if (formData.scope === "BATCH" && !formData.batchId) {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Please select a batch",
            });
            return;
        }

        if (formData.scope === "INDIVIDUAL" && formData.studentIds.length === 0) {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Please select at least one student",
            });
            return;
        }

        try {
            setSubmitting(true);
            const response = await fetch("/api/notices", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: formData.title,
                    body: formData.body,
                    scope: formData.scope,
                    priority: formData.priority,
                    expiresAt: formData.expiresAt || null,
                    batchId: formData.scope === "BATCH" ? formData.batchId : null,
                    studentIds: formData.scope === "INDIVIDUAL" ? formData.studentIds : null,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Failed to create notice");
            }

            toast({
                title: "Success",
                description: "Notice created successfully",
            });

            setIsCreateModalOpen(false);
            resetForm();
            fetchNotices();
        } catch (err) {
            toast({
                variant: "destructive",
                title: "Error",
                description: err instanceof Error ? err.message : "Failed to create notice",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditNotice = async () => {
        if (!editingNotice) return;

        try {
            setSubmitting(true);
            const response = await fetch(`/api/notices/${editingNotice.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: formData.title,
                    body: formData.body,
                    priority: formData.priority,
                    expiresAt: formData.expiresAt || null,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Failed to update notice");
            }

            toast({
                title: "Success",
                description: "Notice updated successfully",
            });

            setIsEditModalOpen(false);
            setEditingNotice(null);
            resetForm();
            fetchNotices();
        } catch (err) {
            toast({
                variant: "destructive",
                title: "Error",
                description: err instanceof Error ? err.message : "Failed to update notice",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteNotice = async () => {
        if (!deletingNotice) return;

        try {
            setSubmitting(true);
            const response = await fetch(`/api/notices/${deletingNotice.id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Failed to delete notice");
            }

            toast({
                title: "Success",
                description: "Notice deleted successfully",
            });

            setDeleteConfirmOpen(false);
            setDeletingNotice(null);
            fetchNotices();
        } catch (err) {
            toast({
                variant: "destructive",
                title: "Error",
                description: err instanceof Error ? err.message : "Failed to delete notice",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: "",
            body: "",
            scope: "GLOBAL",
            priority: "NORMAL",
            expiresAt: "",
            batchId: "",
            studentIds: [],
        });
        setStudentSearch("");
    };

    const openEditModal = (notice: Notice) => {
        setEditingNotice(notice);
        setFormData({
            title: notice.title,
            body: notice.body,
            scope: notice.scope,
            priority: notice.priority,
            expiresAt: notice.expiresAt ? notice.expiresAt.split("T")[0] : "",
            batchId: notice.batch?.id || "",
            studentIds: [],
        });
        setIsEditModalOpen(true);
    };

    const getScopeIcon = (scope: Notice["scope"]) => {
        switch (scope) {
            case "GLOBAL":
                return <Globe className="h-4 w-4" />;
            case "BATCH":
                return <Users className="h-4 w-4" />;
            case "INDIVIDUAL":
                return <User className="h-4 w-4" />;
        }
    };

    const getScopeBadge = (notice: Notice) => {
        const baseClasses = "dark:border-slate-600";
        switch (notice.scope) {
            case "GLOBAL":
                return (
                    <Badge variant="outline" className={`${baseClasses} text-blue-600 border-blue-300 dark:text-blue-400`}>
                        <Globe className="h-3 w-3 mr-1" />
                        Global
                    </Badge>
                );
            case "BATCH":
                return (
                    <Badge variant="outline" className={`${baseClasses} text-green-600 border-green-300 dark:text-green-400`}>
                        <Users className="h-3 w-3 mr-1" />
                        {notice.batch?.name || "Batch"}
                    </Badge>
                );
            case "INDIVIDUAL":
                return (
                    <Badge variant="outline" className={`${baseClasses} text-purple-600 border-purple-300 dark:text-purple-400`}>
                        <User className="h-3 w-3 mr-1" />
                        {notice._count.recipients} student{notice._count.recipients !== 1 ? "s" : ""}
                    </Badge>
                );
        }
    };

    const getPriorityBadge = (priority: Notice["priority"]) => {
        switch (priority) {
            case "URGENT":
                return (
                    <Badge className="bg-red-500 hover:bg-red-600 text-white dark:bg-red-600">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Urgent
                    </Badge>
                );
            case "HIGH":
                return (
                    <Badge className="bg-orange-500 hover:bg-orange-600 text-white dark:bg-orange-600">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        High
                    </Badge>
                );
                default:
                    return (
                        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            <Info className="h-3 w-3 mr-1" />
                            Normal
                        </Badge>
                    );
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const clearFilters = () => {
        setScopeFilter("");
        setPriorityFilter("");
        setShowExpired(false);
        setCurrentPage(1);
    };

    const hasActiveFilters = scopeFilter || priorityFilter || showExpired;

    return (
        <div className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <Megaphone className="h-8 w-8 text-primary" />
                    <h1 className="text-2xl font-bold text-foreground">Notices</h1>
                </div>
                <Button onClick={() => { resetForm(); setIsCreateModalOpen(true); fetchBatches(); fetchStudents(); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Notice
                </Button>
            </div>

            {/* Filters */}
            <Card className="mb-6 dark:bg-slate-900 dark:border-slate-800">
                <CardContent className="pt-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-muted-foreground">Filters:</span>
                        </div>

                        <Select value={scopeFilter || "all"} onValueChange={(v) => setScopeFilter(v === "all" ? "" : v)}>
                            <SelectTrigger className="w-[140px] dark:bg-slate-800 dark:border-slate-700">
                                <SelectValue placeholder="All Scopes" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Scopes</SelectItem>
                                <SelectItem value="GLOBAL">Global</SelectItem>
                                <SelectItem value="BATCH">Batch</SelectItem>
                                <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={priorityFilter || "all"} onValueChange={(v) => setPriorityFilter(v === "all" ? "" : v)}>
                            <SelectTrigger className="w-[140px] dark:bg-slate-800 dark:border-slate-700">
                                <SelectValue placeholder="All Priorities" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Priorities</SelectItem>
                                <SelectItem value="NORMAL">Normal</SelectItem>
                                <SelectItem value="HIGH">High</SelectItem>
                                <SelectItem value="URGENT">Urgent</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="showExpired"
                                checked={showExpired}
                                onCheckedChange={(checked) => setShowExpired(checked as boolean)}
                            />
                            <Label htmlFor="showExpired" className="text-sm text-muted-foreground cursor-pointer">
                                Show Expired
                            </Label>
                        </div>

                        {hasActiveFilters && (
                            <Button variant="ghost" size="sm" onClick={clearFilters}>
                                <X className="h-4 w-4 mr-1" />
                                Clear
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Notice List */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : notices.length === 0 ? (
                <Card className="dark:bg-slate-900 dark:border-slate-800">
                    <CardContent className="pt-6 text-center">
                        <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No notices found</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {notices.map((notice) => (
                        <Card
                            key={notice.id}
                            className={`
                transition-all duration-200 hover:shadow-md
                dark:bg-slate-900 dark:border-slate-800
                ${notice.isExpired ? "opacity-60" : ""}
                ${notice.priority === "URGENT" ? "border-l-4 border-l-red-500 dark:border-l-red-600" : ""}
                ${notice.priority === "HIGH" ? "border-l-4 border-l-orange-500 dark:border-l-orange-600" : ""}
              `}
                        >
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <CardTitle className="text-lg text-foreground">{notice.title}</CardTitle>
                                            {notice.isExpired && (
                                                <Badge variant="outline" className="text-red-500 border-red-300 dark:border-red-700">
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    Expired
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {getScopeBadge(notice)}
                                            {getPriorityBadge(notice.priority)}
                                        </div>
                                    </div>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => openEditModal(notice)}>
                                                <Pencil className="h-4 w-4 mr-2" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-red-600 dark:text-red-400"
                                                onClick={() => { setDeletingNotice(notice); setDeleteConfirmOpen(true); }}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-foreground dark:text-slate-200 mb-3 line-clamp-2">
                                    {notice.body}
                                </p>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                    <span>By {notice.creator.name}</span>
                                    <span>{formatDate(notice.createdAt)}</span>
                                    {notice.expiresAt && (
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            Expires {formatDate(notice.expiresAt)}
                                        </span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-6">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Previous
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                Page {pagination.page} of {pagination.totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                                disabled={currentPage === pagination.totalPages}
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Create Notice Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="max-w-lg dark:bg-slate-900">
                    <DialogHeader>
                        <DialogTitle>Create Notice</DialogTitle>
                        <DialogDescription>
                            Create a new notice for students
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="title">Title *</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Notice title"
                                className="dark:bg-slate-800 dark:border-slate-700"
                            />
                        </div>

                        <div>
                            <Label htmlFor="body">Message *</Label>
                            <Textarea
                                id="body"
                                value={formData.body}
                                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                                placeholder="Notice message"
                                rows={4}
                                className="dark:bg-slate-800 dark:border-slate-700"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Scope *</Label>
                                <Select
                                    value={formData.scope}
                                    onValueChange={(value: "GLOBAL" | "BATCH" | "INDIVIDUAL") =>
                                        setFormData({ ...formData, scope: value, batchId: "", studentIds: [] })
                                    }
                                >
                                    <SelectTrigger className="dark:bg-slate-800 dark:border-slate-700">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="GLOBAL">
                                            <div className="flex items-center gap-2">
                                                <Globe className="h-4 w-4" />
                                                Global (All Students)
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="BATCH">
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4" />
                                                Batch
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="INDIVIDUAL">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                Individual Students
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Priority</Label>
                                <Select
                                    value={formData.priority}
                                    onValueChange={(value: "NORMAL" | "HIGH" | "URGENT") =>
                                        setFormData({ ...formData, priority: value })
                                    }
                                >
                                    <SelectTrigger className="dark:bg-slate-800 dark:border-slate-700">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NORMAL">Normal</SelectItem>
                                        <SelectItem value="HIGH">High</SelectItem>
                                        <SelectItem value="URGENT">Urgent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {formData.scope === "BATCH" && (
                            <div>
                                <Label>Select Batch *</Label>
                                <Select
                                    value={formData.batchId}
                                    onValueChange={(value) => setFormData({ ...formData, batchId: value })}
                                >
                                    <SelectTrigger className="dark:bg-slate-800 dark:border-slate-700">
                                        <SelectValue placeholder={loadingBatches ? "Loading..." : "Select a batch"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {batches.map((batch) => (
                                            <SelectItem key={batch.id} value={batch.id}>
                                                {batch.name} - {batch.subject}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {formData.scope === "INDIVIDUAL" && (
                            <div>
                                <Label>Select Students *</Label>
                                <Input
                                    placeholder="Search students..."
                                    value={studentSearch}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStudentSearch(e.target.value)}
                                    className="mb-2 dark:bg-slate-800 dark:border-slate-700"
                                />
                                <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1 dark:bg-slate-800 dark:border-slate-700">
                                    {loadingStudents ? (
                                        <p className="text-sm text-muted-foreground">Loading students...</p>
                                    ) : filteredStudents.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No students found</p>
                                    ) : (
                                        filteredStudents.map((student) => (
                                            <div key={student.studentId} className="flex items-center gap-2">
                                                <Checkbox
                                                    id={`student-${student.studentId}`}
                                                    checked={formData.studentIds.includes(student.studentId)}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setFormData({
                                                                ...formData,
                                                                studentIds: [...formData.studentIds, student.studentId],
                                                            });
                                                        } else {
                                                            setFormData({
                                                                ...formData,
                                                                studentIds: formData.studentIds.filter((id) => id !== student.studentId),
                                                            });
                                                        }
                                                    }}
                                                />
                                                <Label htmlFor={`student-${student.studentId}`} className="text-sm cursor-pointer flex-1">
                                                    {student.name} ({student.email})
                                                </Label>
                                            </div>
                                        ))
                                    )}
                                </div>
                                {formData.studentIds.length > 0 && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {formData.studentIds.length} student(s) selected
                                    </p>
                                )}
                            </div>
                        )}

                        <div>
                            <Label htmlFor="expiresAt">Expiry Date (Optional)</Label>
                            <Input
                                id="expiresAt"
                                type="date"
                                value={formData.expiresAt}
                                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                                className="dark:bg-slate-800 dark:border-slate-700"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateNotice} disabled={submitting}>
                            {submitting ? "Creating..." : "Create Notice"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Notice Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-lg dark:bg-slate-900">
                    <DialogHeader>
                        <DialogTitle>Edit Notice</DialogTitle>
                        <DialogDescription>
                            Update notice details (scope and recipients cannot be changed)
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="edit-title">Title *</Label>
                            <Input
                                id="edit-title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="dark:bg-slate-800 dark:border-slate-700"
                            />
                        </div>

                        <div>
                            <Label htmlFor="edit-body">Message *</Label>
                            <Textarea
                                id="edit-body"
                                value={formData.body}
                                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                                rows={4}
                                className="dark:bg-slate-800 dark:border-slate-700"
                            />
                        </div>

                        <div>
                            <Label>Priority</Label>
                            <Select
                                value={formData.priority}
                                onValueChange={(value: "NORMAL" | "HIGH" | "URGENT") =>
                                    setFormData({ ...formData, priority: value })
                                }
                            >
                                <SelectTrigger className="dark:bg-slate-800 dark:border-slate-700">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="NORMAL">Normal</SelectItem>
                                    <SelectItem value="HIGH">High</SelectItem>
                                    <SelectItem value="URGENT">Urgent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="edit-expiresAt">Expiry Date (Optional)</Label>
                            <Input
                                id="edit-expiresAt"
                                type="date"
                                value={formData.expiresAt}
                                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                                className="dark:bg-slate-800 dark:border-slate-700"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleEditNotice} disabled={submitting}>
                            {submitting ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogContent className="dark:bg-slate-900">
                    <DialogHeader>
                        <DialogTitle>Delete Notice</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete &quot;{deletingNotice?.title}&quot;? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteNotice} disabled={submitting}>
                            {submitting ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
