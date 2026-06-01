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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { UserPlus, Loader2, Search, X, Archive, Pencil, RotateCcw, Users, Eye, EyeOff, Trash2 } from "lucide-react";

export default function AdminReceptionistsPage() {
  const [receptionists, setReceptionists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingReceptionist, setEditingReceptionist] = useState<any | null>(null);
  const [deletingReceptionist, setDeletingReceptionist] = useState<any | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState("");

  const fetchReceptionists = useCallback(async () => {
    try {
      const response = await fetch("/api/receptionists");
      if (response.ok) {
        const data = await response.json();
        setReceptionists(data);
      }
    } catch (error) {
      console.error("Error fetching receptionists:", error);
      toast({
        title: "Error",
        description: "Failed to fetch receptionists",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchReceptionists();
  }, [fetchReceptionists]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/receptionists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Failed to create receptionist");
      }

      toast({
        title: "Success",
        description: "Receptionist added successfully",
      });
      setOpen(false);
      fetchReceptionists();
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

  const handleEditClick = (receptionist: any) => {
    setEditingReceptionist(receptionist);
    setEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/receptionists", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingReceptionist.id,
          name: data.name,
          email: data.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Failed to update receptionist");
      }

      toast({
        title: "Success",
        description: "Receptionist updated successfully",
      });
      setEditOpen(false);
      setEditingReceptionist(null);
      fetchReceptionists();
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

  const handleArchiveReceptionist = async (receptionist: any) => {
    try {
      const response = await fetch("/api/receptionists", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: receptionist.id, is_active: false }),
      });

      if (!response.ok) {
        throw new Error("Failed to archive receptionist");
      }

      toast({
        title: "Success",
        description: "Receptionist archived successfully",
      });
      fetchReceptionists();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRestoreReceptionist = async (receptionist: any) => {
    try {
      const response = await fetch("/api/receptionists", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: receptionist.id, is_active: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to restore receptionist");
      }

      toast({
        title: "Success",
        description: "Receptionist restored successfully",
      });
      fetchReceptionists();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (receptionist: any) => {
    setDeletingReceptionist(receptionist);
    setDeleteOpen(true);
  };

  const handleDeleteReceptionist = async () => {
    if (!deletingReceptionist) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/receptionists", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: deletingReceptionist.id }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to delete receptionist");
      }

      toast({
        title: "Success",
        description: "Receptionist deleted successfully",
      });
      setDeleteOpen(false);
      setDeletingReceptionist(null);
      fetchReceptionists();
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

  // Filter receptionists based on search
  const filterReceptionists = (receptionistList: any[]) => {
    return receptionistList.filter(receptionist => {
      // Search filter - search by name or email
      const matchesSearch = searchQuery === "" ||
        receptionist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        receptionist.email.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  };

  const activeReceptionists = filterReceptionists(receptionists.filter(t => t.is_active !== false));
  const archivedReceptionists = filterReceptionists(receptionists.filter(t => t.is_active === false));

  const renderReceptionistTable = (receptionistList: any[], isArchived: boolean = false) => (
    <div className="rounded-md border overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {receptionistList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Users className="h-10 w-10 opacity-50" />
                    <p className="text-sm font-medium">
                      {isArchived ? "No archived receptionists" : "No receptionists found"}
                    </p>
                    <p className="text-xs">
                      {searchQuery
                        ? "Try adjusting your filters"
                        : isArchived
                          ? "Archived receptionists will appear here"
                          : "Create your first receptionist to get started"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              receptionistList.map((receptionist) => (
                <TableRow key={receptionist.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{receptionist.name}</TableCell>
                  <TableCell>{receptionist.email}</TableCell>
                  <TableCell>
                    <Badge variant={receptionist.is_active ? "default" : "secondary"}>
                      {receptionist.is_active ? "Active" : "Archived"}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(receptionist.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {!isArchived ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(receptionist)}
                            title="Edit receptionist"
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleArchiveReceptionist(receptionist)}
                            title="Archive receptionist"
                            className="h-8 w-8"
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(receptionist)}
                            title="Delete receptionist"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRestoreReceptionist(receptionist)}
                          title="Restore receptionist"
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
        {receptionistList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Users className="h-10 w-10 opacity-50 mb-2" />
            <p className="text-sm font-medium">
              {isArchived ? "No archived receptionists" : "No receptionists found"}
            </p>
            <p className="text-xs mt-1">
              {searchQuery
                ? "Try adjusting your filters"
                : isArchived
                  ? "Archived receptionists will appear here"
                  : "Create your first receptionist to get started"}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {receptionistList.map((receptionist) => (
              <div key={receptionist.id} className="p-4 space-y-3 hover:bg-muted/50">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{receptionist.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{receptionist.email}</p>
                  </div>
                  <div className="flex gap-1">
                    {!isArchived ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(receptionist)}
                          title="Edit receptionist"
                          className="h-8 w-8"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleArchiveReceptionist(receptionist)}
                          title="Archive receptionist"
                          className="h-8 w-8"
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(receptionist)}
                          title="Delete receptionist"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRestoreReceptionist(receptionist)}
                        title="Restore receptionist"
                        className="h-8 w-8"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Status</p>
                    <p className="mt-0.5">
                      <Badge variant={receptionist.is_active ? "default" : "secondary"}>
                        {receptionist.is_active ? "Active" : "Archived"}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Joined</p>
                    <p className="mt-0.5 text-muted-foreground">
                      {new Date(receptionist.createdAt).toLocaleDateString("en-US", {
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
          <h1 className="text-2xl sm:text-3xl font-bold">Receptionists</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Manage receptionists in the system</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Receptionist
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Add New Receptionist</DialogTitle>
                <DialogDescription>
                  Create a new receptionist account.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" required placeholder="Jane Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" required placeholder="jane@example.com" />
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
              </div>
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Receptionist
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card className="border-border/50">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
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

            {/* Clear Filters Button */}
            {searchQuery && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                }}
                className="h-10 px-4"
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full max-w-[420px] grid-cols-2 mb-6">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Active</span>
            <Badge variant="outline" className="ml-1 font-normal border-amber-500 text-amber-600">
              {activeReceptionists.length}
              {searchQuery &&
                ` / ${receptionists.filter(t => t.is_active !== false).length}`}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="archived" className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            <span>Archived</span>
            <Badge variant="outline" className="ml-1 font-normal border-amber-500 text-amber-600">
              {archivedReceptionists.length}
              {searchQuery &&
                ` / ${receptionists.filter(t => t.is_active === false).length}`}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-0">
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Active Receptionists</CardTitle>
              <CardDescription>
                Manage and view all active receptionists
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                renderReceptionistTable(activeReceptionists, false)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="archived" className="mt-0">
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Archived Receptionists</CardTitle>
              <CardDescription>
                View and restore archived receptionists
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                renderReceptionistTable(archivedReceptionists, true)
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
              <DialogTitle>Edit Receptionist</DialogTitle>
              <DialogDescription>
                Update receptionist account information.
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
                    placeholder="Jane Doe"
                    defaultValue={editingReceptionist?.name || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    name="email"
                    type="email"
                    required
                    placeholder="jane@example.com"
                    defaultValue={editingReceptionist?.email || ""}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete 
              <span className="font-semibold text-foreground"> {deletingReceptionist?.name} </span>
              from the system.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteReceptionist}
              disabled={submitting}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Receptionist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
