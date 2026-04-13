"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, User, Phone, Eye, PlusCircle, Pencil, Ban, CheckCircle, Loader2, Trash2, Crown, Infinity, Clock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { AddStudentToBatchModal } from "./AddStudentToBatchModal";
import { StudentDetailsModal } from "./StudentDetailsModal";
import { EditStudentModal } from "./EditStudentModal";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BatchInfo {
  id: string;
  name: string;
  subject: string;
  isActive?: boolean; // Make optional to handle cases where it might not be provided
}

interface Student {
  admissionId: string;
  studentId: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  parentName: string;
  joinDate: string;
  isActive?: boolean;
  batches?: BatchInfo[];
  admissions?: Array<{
    id: string;
    batchId?: string;
    batch?: {
      name: string;
      subject: string;
      isActive?: boolean;
    };
  }>;
  subscription?: {
    id: string;
    tierName: string;
    tierId: string;
    durationMonths: number | null;
    startDate: string;
    endDate: string | null;
    status: string;
    isUnlimited: boolean;
  } | null;
}

interface SubscriptionTier {
  id: string;
  name: string;
  durationMonths: number | null;
  isActive: boolean;
}

interface Batch {
  id: string;
  name: string;
  subject: string;
  feeModel?: "ONE_TIME" | "MONTHLY" | "QUARTERLY" | "CUSTOM" | null;
  feeAmount?: number;
  installments?: any[];
  daysWiseFeesEnabled?: boolean;
  daysWiseFees?: Record<string, number>;
  isActive?: boolean;
}

interface StudentListTableProps {
  batches: Batch[];
  initialStudents?: Student[];
  role: 'teacher' | 'receptionist' | 'admin';
}

export default function StudentListTable({
  batches,
  initialStudents = [],
  role
}: StudentListTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedBatch, setSelectedBatch] = useState<string>(searchParams.get("batchId") || "all");
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>(initialStudents);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast } = useToast();
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);

  // Modal State
  const [isAddBatchOpen, setIsAddBatchOpen] = useState(false);
  const [selectedStudentForBatch, setSelectedStudentForBatch] = useState<{ id: string, name: string, existingBatchIds: string[] } | null>(null);

  // Details Modal State
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState<Student | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState<Student | null>(null);

  // Remove from Batch Modal State
  const [isRemoveBatchOpen, setIsRemoveBatchOpen] = useState(false);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [selectedStudentForRemoval, setSelectedStudentForRemoval] = useState<{
    student: Student;
    admissionId: string;
    batchName: string;
  } | null>(null);

  // Subscription Renewal Modal State
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [selectedStudentForSub, setSelectedStudentForSub] = useState<Student | null>(null);
  const [subscriptionTiers, setSubscriptionTiers] = useState<SubscriptionTier[]>([]);
  const [selectedTierId, setSelectedTierId] = useState<string>("");
  const [subLoading, setSubLoading] = useState(false);

  const openDetailsModal = (student: Student) => {
    setSelectedStudentDetails(student);
    setIsDetailsOpen(true);
  };

  const openEditModal = (student: Student) => {
    setSelectedStudentForEdit(student);
    setIsEditModalOpen(true);
  };

  // Fetch students when batch is selected or refreshKey changes
  useEffect(() => {
    const fetchStudents = async () => {
      if (selectedBatch) {
        setLoading(true);
        try {
          let url = "";
          if (selectedBatch === "all") {
            // Teachers use their own endpoint (students in their batches); admin/receptionist use global list
            url = role === "teacher" ? "/api/teacher/students" : "/api/students";
          } else {
            url = `/api/batches/${selectedBatch}/students`;
          }

          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            const sortedData = [...data].sort((a, b) => a.name.localeCompare(b.name));
            setStudents(sortedData);
          } else {
            console.error("Failed to fetch students");
            setStudents([]);
          }
        } catch (error) {
          console.error("Error fetching students:", error);
          setStudents([]);
        } finally {
          setLoading(false);
        }
      } else {
        setStudents([]);
      }
    };

    fetchStudents();
  }, [selectedBatch, refreshKey, role]);

  // Fetch subscription tiers
  useEffect(() => {
    if (role === 'receptionist' || role === 'admin') {
      fetch("/api/admin/subscriptions?active_only=true")
        .then(res => res.json())
        .then(data => setSubscriptionTiers(data))
        .catch(err => console.error("Failed to fetch tiers", err));
    }
  }, [role]);

  // Apply search filter
  useEffect(() => {
    let result = students;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = students.filter(student =>
        student.name.toLowerCase().includes(term) ||
        student.phone.includes(term) ||
        student.email.toLowerCase().includes(term) ||
        (student.parentName && student.parentName.toLowerCase().includes(term))
      );
    }

    setFilteredStudents(result);
    setCurrentPage(1); // Reset to first page when search changes
  }, [searchTerm, students]);

  // Sync state with URL search params
  useEffect(() => {
    const batchIdFromUrl = searchParams.get("batchId") || "all";
    if (batchIdFromUrl !== selectedBatch) {
      setSelectedBatch(batchIdFromUrl);
    }
  }, [searchParams, selectedBatch]);

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage);

  const handleBatchChange = (value: string) => {
    setSelectedBatch(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("batchId");
    } else {
      params.set("batchId", value);
    }
    router.push(`${pathname}?${params.toString()}`);
    setSearchTerm("");
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const openAddBatchModal = (student: Student) => {
    const existingIds = student.batches ? student.batches.map(b => b.id) : [];
    setSelectedStudentForBatch({
      id: student.studentId,
      name: student.name,
      existingBatchIds: existingIds
    });
    setIsAddBatchOpen(true);
  };

  const handleToggleStudentStatus = async (student: Student) => {
    // If undefined, assume active
    const currentStatus = student.isActive !== false;
    const newStatus = !currentStatus;

    setToggleLoading(student.studentId);
    try {
      const response = await fetch("/api/students", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: student.studentId,
          isActive: newStatus
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update student status");
      }

      toast({
        title: "Success",
        description: `Student ${newStatus ? 'activated' : 'disabled'} successfully`,
      });

      // Refresh list
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update student status",
        variant: "destructive",
      });
    } finally {
      setToggleLoading(null);
    }
  };

  const openRemoveBatchModal = (student: Student, admissionId: string, batchName: string) => {
    setSelectedStudentForRemoval({
      student,
      admissionId,
      batchName
    });
    setIsRemoveBatchOpen(true);
  };

  const handleRemoveFromBatch = async () => {
    if (!selectedStudentForRemoval) return;

    const { student, admissionId, batchName } = selectedStudentForRemoval;
    setRemoveLoading(true);

    try {
      const response = await fetch(`/api/admissions/${admissionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "remove_from_batch",
          endDate: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to remove student from batch");
      }

      toast({
        title: "Success",
        description: `Student has been removed from ${batchName}`,
      });

      // Close modal and refresh list
      setIsRemoveBatchOpen(false);
      setSelectedStudentForRemoval(null);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error("Error removing from batch:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove student from batch",
        variant: "destructive",
      });
    } finally {
      setRemoveLoading(false);
    }
  };

  const openSubscriptionModal = (student: Student) => {
    setSelectedStudentForSub(student);
    setSelectedTierId(student.subscription?.tierId || "");
    setIsSubscriptionModalOpen(true);
  };

  const handleUpdateSubscription = async () => {
    if (!selectedStudentForSub || !selectedTierId) return;

    setSubLoading(true);
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudentForSub.studentId,
          tierId: selectedTierId,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      toast({
        title: "Subscription Updated",
        description: `Subscription for ${selectedStudentForSub.name} has been updated.`,
      });

      setIsSubscriptionModalOpen(false);
      setSelectedStudentForSub(null);
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update subscription",
      });
    } finally {
      setSubLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Student List</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 w-full">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-64">
                  <Select value={selectedBatch} onValueChange={handleBatchChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a batch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Students </SelectItem>
                      {batches.filter(b => b.isActive !== false).map((batch) => (
                        <SelectItem key={batch.id} value={batch.id}>
                          {batch.name} ({batch.subject})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading students...</div>
          ) : selectedBatch ? (
            <>
              {filteredStudents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? (
                    <div>
                      <p>No students match your search for &quot;{searchTerm}&quot;</p>
                      <p className="text-sm mt-2">Try adjusting your search term</p>
                    </div>
                  ) : (
                    <div>
                      <p>This batch has no students enrolled yet</p>
                      <p className="text-sm mt-2">Students will appear here once they are admitted to this batch</p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Photo</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Batches</TableHead>
                          {(role === 'receptionist' || role === 'admin') && (
                            <TableHead>Subscription</TableHead>
                          )}
                          <TableHead>Join Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedStudents.map((student) => (
                          <TableRow key={`${student.studentId}-${student.admissionId}`}>
                            <TableCell>
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-5 w-5 text-primary" />
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{student.name}</TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                                {student.phone}
                              </div>
                            </TableCell>
                            <TableCell className="align-top">
                              <div className="flex flex-wrap gap-2 min-w-0 max-w-[280px]">
                                {student.batches && student.batches.length > 0 ? (
                                  <>
                                    {student.batches.slice(0, 4).map((batch) => (
                                      <div
                                        key={batch.id}
                                        className="inline-flex items-center gap-1 min-w-0 max-w-[180px] rounded-md bg-muted/60 px-2 py-1 text-xs font-medium text-muted-foreground border border-border/60"
                                      >
                                        <span title={batch.name} className="truncate">
                                          {batch.name}
                                        </span>
                                        {(role === "receptionist" || role === "admin") && (
                                          <button
                                            type="button"
                                            className="text-orange-600 hover:text-orange-700"
                                            title={`Remove from ${batch.name}`}
                                            onClick={() => {
                                              const matchingAdmission = student.admissions?.find(
                                                (admission) => admission.batchId === batch.id
                                              );
                                              if (matchingAdmission?.id) {
                                                openRemoveBatchModal(student, matchingAdmission.id, batch.name);
                                              } else {
                                                toast({
                                                  title: "Admission not found",
                                                  description: "Unable to identify this batch enrollment for removal.",
                                                  variant: "destructive",
                                                });
                                              }
                                            }}
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                    {student.batches.length > 4 && (
                                      <span className="text-xs text-muted-foreground self-center">
                                        +{student.batches.length - 4} more
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-muted-foreground text-sm">—</span>
                                )}
                              </div>
                            </TableCell>
                            {(role === 'receptionist' || role === 'admin') && (
                              <TableCell>
                                {student.subscription ? (
                                  <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-1.5">
                                      <Crown className="h-3.5 w-3.5 text-amber-500" />
                                      <span className="text-sm font-medium">{student.subscription.tierName}</span>
                                      <Badge
                                        variant="secondary"
                                        className={`text-[10px] px-1.5 py-0 ${
                                          student.subscription.status === 'active'
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                                            : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                                        }`}
                                      >
                                        {student.subscription.status === 'active' ? 'Active' : 'Expired'}
                                      </Badge>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                      {student.subscription.isUnlimited ? (
                                        <><Infinity className="h-2.5 w-2.5" /> Unlimited</>  
                                      ) : student.subscription.endDate ? (
                                        <><Clock className="h-2.5 w-2.5" /> Ends: {new Date(student.subscription.endDate).toLocaleDateString('en-IN')}</>  
                                      ) : null}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground italic">No subscription</span>
                                )}
                              </TableCell>
                            )}
                            <TableCell>{formatDate(student.joinDate)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {/* Only show Add to Batch & Edit if role is receptionist or admin */}
                                {(role === 'receptionist' || role === 'admin') && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openEditModal(student)}
                                      title="Edit details"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openAddBatchModal(student)}
                                      title="Add to another batch"
                                    >
                                      <PlusCircle className="h-4 w-4" />
                                    </Button>
                                    {/* Disable/Enable Button */}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleToggleStudentStatus(student)}
                                      disabled={toggleLoading === student.studentId}
                                      title={student.isActive !== false ? "Disable student" : "Enable student"}
                                      className={student.isActive === false ? "text-green-600 hover:text-green-700" : "text-destructive hover:text-destructive"}
                                    >
                                      {toggleLoading === student.studentId ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : student.isActive === false ? (
                                        <CheckCircle className="h-4 w-4" />
                                      ) : (
                                        <Ban className="h-4 w-4" />
                                      )}
                                    </Button>
                                    {/* Subscription Button */}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openSubscriptionModal(student)}
                                      title={student.subscription ? "Update subscription" : "Assign subscription"}
                                      className="text-amber-600 hover:text-amber-700"
                                    >
                                      <Crown className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openDetailsModal(student)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {totalPages > 1 && (
                    <div className="mt-6 flex justify-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>

                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  )}

                  <div className="mt-4 text-sm text-muted-foreground text-center">
                    Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredStudents.length)} of {filteredStudents.length} students
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Please select a batch or &quot;All Students&quot; to view details
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add to Batch Modal */}
      {selectedStudentForBatch && (
        <AddStudentToBatchModal
          studentId={selectedStudentForBatch.id}
          studentName={selectedStudentForBatch.name}
          isOpen={isAddBatchOpen}
          onOpenChange={setIsAddBatchOpen}
          batches={batches}
          onSuccess={() => {
            // Added to batch - forcing list refresh
            setRefreshKey(k => k + 1);
          }}
          existingBatchIds={selectedStudentForBatch.existingBatchIds}
        />
      )}

      {/* Edit Student Modal */}
      <EditStudentModal
        student={selectedStudentForEdit}
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSuccess={() => {
          setRefreshKey(k => k + 1);
        }}
      />

      {/* Student Details Modal */}
      <StudentDetailsModal
        student={selectedStudentDetails}
        isOpen={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        role={role}
      />

      {/* Remove from Batch Confirmation Dialog */}
      <Dialog open={isRemoveBatchOpen} onOpenChange={setIsRemoveBatchOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Remove from Batch</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedStudentForRemoval?.student.name} from the batch &quot;{selectedStudentForRemoval?.batchName}&quot;?
              <br /><br />
              This will mark the admission as withdrawn and the student will no longer be enrolled in this batch.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRemoveBatchOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRemoveFromBatch}
              disabled={removeLoading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {removeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Remove from Batch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subscription Renewal/Assignment Dialog */}
      <Dialog open={isSubscriptionModalOpen} onOpenChange={setIsSubscriptionModalOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              {selectedStudentForSub?.subscription ? 'Update Subscription' : 'Assign Subscription'}
            </DialogTitle>
            <DialogDescription>
              {selectedStudentForSub?.subscription
                ? `Update or renew the subscription for ${selectedStudentForSub?.name}.`
                : `Assign a subscription tier to ${selectedStudentForSub?.name}.`}
            </DialogDescription>
          </DialogHeader>

          {/* Current Subscription Info */}
          {selectedStudentForSub?.subscription && (
            <div className="p-3 bg-muted/50 rounded-lg border text-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Current tier</span>
                <span className="font-medium flex items-center gap-1">
                  <Crown className="h-3.5 w-3.5 text-amber-500" />
                  {selectedStudentForSub.subscription.tierName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge
                  variant="secondary"
                  className={`text-[10px] ${
                    selectedStudentForSub.subscription.status === 'active'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {selectedStudentForSub.subscription.status === 'active' ? 'Active' : 'Expired'}
                </Badge>
              </div>
              {selectedStudentForSub.subscription.startDate && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Started</span>
                  <span className="text-xs">{new Date(selectedStudentForSub.subscription.startDate).toLocaleDateString('en-IN')}</span>
                </div>
              )}
              {selectedStudentForSub.subscription.endDate && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{selectedStudentForSub.subscription.status === 'active' ? 'Expires' : 'Expired'}</span>
                  <span className="text-xs">{new Date(selectedStudentForSub.subscription.endDate).toLocaleDateString('en-IN')}</span>
                </div>
              )}
              {selectedStudentForSub.subscription.isUnlimited && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="text-xs flex items-center gap-1"><Infinity className="h-3 w-3" /> Unlimited</span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3 pt-2">
            <Label className="text-sm font-medium">
              {selectedStudentForSub?.subscription ? 'New Subscription Tier' : 'Select Tier'}
            </Label>
            <Select value={selectedTierId} onValueChange={setSelectedTierId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a tier..." />
              </SelectTrigger>
              <SelectContent>
                {subscriptionTiers.map(tier => (
                  <SelectItem key={tier.id} value={tier.id} className="py-3">
                    <div className="flex items-center gap-2">
                      <Crown className="h-3.5 w-3.5 text-amber-500" />
                      <span className="font-medium">{tier.name}</span>
                      <span className="text-xs text-muted-foreground ml-1">
                        {tier.durationMonths === null
                          ? '— Unlimited'
                          : `— ${tier.durationMonths} month${tier.durationMonths !== 1 ? 's' : ''}`}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {selectedStudentForSub?.subscription
                ? 'Selecting a new tier will replace the current subscription. A new start date will be set from today.'
                : 'The subscription will start from today.'}
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSubscriptionModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateSubscription}
              disabled={subLoading || !selectedTierId}
              className="bg-amber-600 hover:bg-amber-700 gap-1"
            >
              {subLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Crown className="h-4 w-4" />
              )}
              {selectedStudentForSub?.subscription ? 'Update' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}