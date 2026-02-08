"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Megaphone, AlertTriangle, AlertCircle, Info, ChevronLeft, ChevronRight } from "lucide-react";

interface Notice {
    id: string;
    title: string;
    body: string;
    priority: "NORMAL" | "HIGH" | "URGENT";
    expiresAt: string | null;
    createdAt: string;
    source: string;
    createdBy: string;
}

interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function StudentNoticesPage() {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        fetchNotices(currentPage);
    }, [currentPage]);

    const fetchNotices = async (page: number) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/student/notices?page=${page}&limit=10`);

            if (!response.ok) {
                throw new Error("Failed to fetch notices");
            }

            const data = await response.json();
            setNotices(data.notices);
            setPagination(data.pagination);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const getPriorityBadge = (priority: Notice["priority"]) => {
        switch (priority) {
            case "URGENT":
                return (
                    <Badge className="bg-red-500 hover:bg-red-600 text-white dark:bg-red-600 dark:hover:bg-red-700">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Urgent
                    </Badge>
                );
            case "HIGH":
                return (
                    <Badge className="bg-orange-500 hover:bg-orange-600 text-white dark:bg-orange-600 dark:hover:bg-orange-700">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        High Priority
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
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    if (loading && notices.length === 0) {
        return (
            <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Megaphone className="h-8 w-8 text-primary" />
                    <h1 className="text-2xl font-bold text-foreground">Notices</h1>
                </div>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Megaphone className="h-8 w-8 text-primary" />
                    <h1 className="text-2xl font-bold text-foreground">Notices</h1>
                </div>
                <Card className="border-red-200 dark:border-red-800">
                    <CardContent className="pt-6">
                        <p className="text-red-600 dark:text-red-400">{error}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
                <Megaphone className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">Notices</h1>
            </div>

            {notices.length === 0 ? (
                <Card className="dark:bg-slate-900 dark:border-slate-800">
                    <CardContent className="pt-6 text-center">
                        <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No notices at the moment</p>
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
                ${notice.priority === "URGENT" ? "border-l-4 border-l-red-500 dark:border-l-red-600" : ""}
                ${notice.priority === "HIGH" ? "border-l-4 border-l-orange-500 dark:border-l-orange-600" : ""}
              `}
                        >
                            <CardHeader className="pb-2">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <CardTitle className="text-lg text-foreground">{notice.title}</CardTitle>
                                    {getPriorityBadge(notice.priority)}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-foreground dark:text-slate-200 mb-4 whitespace-pre-wrap">
                                    {notice.body}
                                </p>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Badge variant="outline" className="font-normal dark:border-slate-700 dark:text-slate-300">
                                            {notice.source}
                                        </Badge>
                                    </span>
                                    <span>By {notice.createdBy}</span>
                                    <span>{formatDate(notice.createdAt)}</span>
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
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
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
                                onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                                disabled={currentPage === pagination.totalPages}
                                className="dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    )}

                    {pagination && (
                        <p className="text-center text-sm text-muted-foreground">
                            Showing {notices.length} of {pagination.total} notices
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
