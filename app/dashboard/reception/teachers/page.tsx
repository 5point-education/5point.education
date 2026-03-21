"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { UserPlus, Loader2, Search, X, Archive, Pencil, RotateCcw, Users, Eye, EyeOff, Trash2 } from "lucide-react";

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any | null>(null);
  const [deletingTeacher, setDeletingTeacher] = useState<any | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [qualificationFilter, setQualificationFilter] = useState<string>("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");

  const fetchTeachers = useCallback(async () => {
    try {
      const response = await fetch("/api/teachers");
      if (response.ok) {
        const data = await response.json();
        setTeachers(data);
      }
    } catch (error) {
      console.error("Error fetching teachers:", error);
      toast({
        title: "Error",
        description: "Failed to fetch teachers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/teachers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Failed to create teacher");
      }

      toast({
        title: "Success",
        description: "Teacher added successfully",
      });
      setOpen(false);
      fetchTeachers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (teacher: any) => {
    setEditingTeacher(teacher);
    setEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/teachers", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingTeacher.id,
          name: data.name,
          email: data.email,
          qualifications: data.qualifications,
          experience_years: data.experience_years,
          subjects_specialization: data.subjects_specialization,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Failed to update teacher");
      }

      toast({
        title: "Success",
        description: "Teacher updated successfully",
      });
      setEditOpen(false);
      setEditingTeacher(null);
      fetchTeachers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchiveTeacher = async (teacher: any) => {
    try {
      const response = await fetch("/api/teachers", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: teacher.id, isActive: false }),
      });

      if (!response.ok) {
        throw new Error("Failed to archive teacher");
      }

      toast({
        title: "Success",
        description: "Teacher archived successfully",
      });
      fetchTeachers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRestoreTeacher = async (teacher: any) => {
    try {
      const response = await fetch("/api/teachers", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: teacher.id, isActive: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to restore teacher");
      }

      toast({
        title: "Success",
        description: "Teacher restored successfully",
      });
      fetchTeachers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (teacher: any) => {
    setDeletingTeacher(teacher);
    setDeleteOpen(true);
  };

  const handleDeleteTeacher = async () => {
    if (!deletingTeacher) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/teachers", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: deletingTeacher.id }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to delete teacher");
      }

      toast({
        title: "Success",
        description: "Teacher deleted successfully",
      });
      setDeleteOpen(false);
      setDeletingTeacher(null);
      fetchTeachers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Extract unique values for filters
  const uniqueQualifications = useMemo(() => {
    const quals = new Set<string>();
    teachers.forEach(teacher => {
      if (teacher.teacherProfile?.qualifications) {
        quals.add(teacher.teacherProfile.qualifications);
      }
    });
    return Array.from(quals).sort();
  }, [teachers]);

  const uniqueSubjects = useMemo(() => {
    const subjects = new Set<string>();
    teachers.forEach(teacher => {
      if (teacher.teacherProfile?.subjects_specialization) {
        const teacherSubjects = teacher.teacherProfile.subjects_specialization
          .split(",")
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0);
        teacherSubjects.forEach((subject: string) => subjects.add(subject));
      }
    });
    return Array.from(subjects).sort();
  }, [teachers]);

  // Filter teachers based on search and filters
  const filterTeachers = (teacherList: any[]) => {
    return teacherList.filter(teacher => {
      // Search filter - search by name, email, qualifications, or subjects
      const matchesSearch = searchQuery === "" ||
        teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (teacher.teacherProfile?.qualifications || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (teacher.teacherProfile?.subjects_specialization || "").toLowerCase().includes(searchQuery.toLowerCase());

      // Qualification filter
      const matchesQualification = qualificationFilter === "all" ||
        teacher.teacherProfile?.qualifications === qualificationFilter;

      // Subject filter
      const matchesSubject = subjectFilter === "all" ||
        (teacher.teacherProfile?.subjects_specialization || "").toLowerCase().includes(subjectFilter.toLowerCase());

      return matchesSearch && matchesQualification && matchesSubject;
    });
  };

  const activeTeachers = filterTeachers(teachers.filter(t => t.teacherProfile?.isActive !== false));
  const archivedTeachers = filterTeachers(teachers.filter(t => t.teacherProfile?.isActive === false));

  const renderTeacherTable = (teacherList: any[], isArchived: boolean = false) => (
    <div className="rounded-md border overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Qualifications</TableHead>
              <TableHead>Subjects</TableHead>
              <TableHead>Experience</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teacherList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Users className="h-10 w-10 opacity-50" />
                    <p className="text-sm font-medium">
                      {isArchived ? "No archived teachers" : "No teachers found"}
                    </p>
                    <p className="text-xs">
                      {searchQuery || qualificationFilter !== "all" || subjectFilter !== "all"
                        ? "Try adjusting your filters"
                        : isArchived
                          ? "Archived teachers will appear here"
                          : "Create your first teacher to get started"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              teacherList.map((teacher) => (
                <TableRow key={teacher.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{teacher.name}</TableCell>
                  <TableCell>{teacher.email}</TableCell>
                  <TableCell>{teacher.teacherProfile?.qualifications || "-"}</TableCell>
                  <TableCell>{teacher.teacherProfile?.subjects_specialization || "-"}</TableCell>
                  <TableCell>{teacher.teacherProfile?.experience_years || 0} years</TableCell>
                  <TableCell>{new Date(teacher.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {!isArchived ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(teacher)}
                            title="Edit teacher"
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleArchiveTeacher(teacher)}
                            title="Archive teacher"
                            className="h-8 w-8"
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(teacher)}
                            title="Delete teacher"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRestoreTeacher(teacher)}
                          title="Restore teacher"
                          className="h-8 w-8"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        {teacherList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Users className="h-10 w-10 opacity-50 mb-2" />
            <p className="text-sm font-medium">
              {isArchived ? "No archived teachers" : "No teachers found"}
            </p>
            <p className="text-xs mt-1">
              {searchQuery || qualificationFilter !== "all" || subjectFilter !== "all"
                ? "Try adjusting your filters"
                : isArchived
                  ? "Archived teachers will appear here"
                  : "Create your first teacher to get started"}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {teacherList.map((teacher) => (
              <div key={teacher.id} className="p-4 space-y-3 hover:bg-muted/50">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{teacher.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{teacher.email}</p>
                  </div>
                  <div className="flex gap-1">
                    {!isArchived ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(teacher)}
                          title="Edit teacher"
                          className="h-8 w-8"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleArchiveTeacher(teacher)}
                          title="Archive teacher"
                          className="h-8 w-8"
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(teacher)}
                          title="Delete teacher"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRestoreTeacher(teacher)}
                        title="Restore teacher"
                        className="h-8 w-8"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Qualifications</p>
                    <p className="mt-0.5">{teacher.teacherProfile?.qualifications || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Experience</p>
                    <p className="mt-0.5">{teacher.teacherProfile?.experience_years || 0} years</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs">Subjects</p>
                    <p className="mt-0.5">{teacher.teacherProfile?.subjects_specialization || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Joined</p>
                    <p className="mt-0.5 text-muted-foreground">
                      {new Date(teacher.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Teachers</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Manage teachers and their profiles</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Teacher
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Add New Teacher</DialogTitle>
                <DialogDescription>
                  Create a new teacher account and profile.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" required placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" required placeholder="john@example.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input id="password" name="password" type={showPassword ? "text" : "password"} required className="pr-10" />
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
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="qualifications">Qualifications</Label>
                    <Input id="qualifications" name="qualifications" required placeholder="M.Sc. Physics" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experience">Experience (Years)</Label>
                    <Input id="experience" name="experience_years" type="number" required min="0" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subjects">Specialization Subjects</Label>
                  <Input id="subjects" name="subjects_specialization" required placeholder="Physics, Mathematics" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Teacher
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card className="border-border/50">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, qualifications, or subjects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10 h-10"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-transparent"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap gap-3">
              {/* Qualification Filter */}
              <div className="w-full sm:w-[180px]">
                <Select value={qualificationFilter} onValueChange={setQualificationFilter}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="All Qualifications" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Qualifications</SelectItem>
                    {uniqueQualifications.map(qual => (
                      <SelectItem key={qual} value={qual}>
                        {qual}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subject Filter */}
              <div className="w-full sm:w-[160px]">
                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="All Subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {uniqueSubjects.map(subject => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters Button */}
              {(searchQuery || qualificationFilter !== "all" || subjectFilter !== "all") && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setQualificationFilter("all");
                    setSubjectFilter("all");
                  }}
                  className="h-10 px-4"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full max-w-[420px] grid-cols-2 mb-6">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Active</span>
            <Badge variant="outline" className="ml-1 font-normal border-amber-500 text-amber-600">
              {activeTeachers.length}
              {(searchQuery || qualificationFilter !== "all" || subjectFilter !== "all") &&
                ` / ${teachers.filter(t => t.teacherProfile?.isActive !== false).length}`}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="archived" className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            <span>Archived</span>
            <Badge variant="outline" className="ml-1 font-normal border-amber-500 text-amber-600">
              {archivedTeachers.length}
              {(searchQuery || qualificationFilter !== "all" || subjectFilter !== "all") &&
                ` / ${teachers.filter(t => t.teacherProfile?.isActive === false).length}`}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-0">
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Active Teachers</CardTitle>
              <CardDescription>
                Manage and view all active teachers
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                renderTeacherTable(activeTeachers, false)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="archived" className="mt-0">
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Archived Teachers</CardTitle>
              <CardDescription>
                View and restore archived teachers
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                renderTeacherTable(archivedTeachers, true)
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Teacher</DialogTitle>
              <DialogDescription>
                Update teacher information and profile.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    required
                    placeholder="John Doe"
                    defaultValue={editingTeacher?.name || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    name="email"
                    type="email"
                    required
                    placeholder="john@example.com"
                    defaultValue={editingTeacher?.email || ""}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-qualifications">Qualifications</Label>
                  <Input
                    id="edit-qualifications"
                    name="qualifications"
                    required
                    placeholder="M.Sc. Physics"
                    defaultValue={editingTeacher?.teacherProfile?.qualifications || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-experience">Experience (Years)</Label>
                  <Input
                    id="edit-experience"
                    name="experience_years"
                    type="number"
                    required
                    min="0"
                    defaultValue={editingTeacher?.teacherProfile?.experience_years || 0}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-subjects">Specialization Subjects</Label>
                <Input
                  id="edit-subjects"
                  name="subjects_specialization"
                  required
                  placeholder="Physics, Mathematics"
                  defaultValue={editingTeacher?.teacherProfile?.subjects_specialization || ""}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Teacher
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Teacher</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete this teacher? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deletingTeacher && (
            <div className="py-4">
              <p className="text-sm">
                <span className="font-semibold">Teacher:</span> {deletingTeacher.name}
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold">Email:</span> {deletingTeacher.email}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteOpen(false);
                setDeletingTeacher(null);
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteTeacher}
              disabled={submitting}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Teacher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
