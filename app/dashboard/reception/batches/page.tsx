"use client";

import { useState, useEffect } from "react";
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
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Archive, Layers, Loader2, Pencil, Plus, RotateCcw, Search, Trash2, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { TimePicker } from "@/components/ui/time-picker";

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

interface ScheduleItem {
  day: string;
  startTime: string;
  endTime: string;
}

interface InstallmentItem {
  name: string;
  amount: number;
  dueDate: string;
}

type FeeModel = "ONE_TIME" | "MONTHLY" | "QUARTERLY" | "CUSTOM" | null;

interface Batch {
  id: string;
  name: string;
  subject: string;
  teacherId: string;
  teacher?: { name: string };
  schedule: string;
  capacity: number | null;
  isActive: boolean;
  createdAt: string;
  feeModel?: FeeModel;
  feeAmount?: number;
  installments?: InstallmentItem[];
  daysWiseFeesEnabled?: boolean;
  daysWiseFees?: Record<string, number>;
  _count: { admissions: number };
}

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const { toast } = useToast();

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [teacherFilter, setTeacherFilter] = useState<string>("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [feeModelFilter, setFeeModelFilter] = useState<string>("all");

  // Schedule State
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([
    { day: "", startTime: "12:00", endTime: "13:00" }
  ]);

  // Fee Configuration State (Create)
  const [feeModel, setFeeModel] = useState<FeeModel>(null);
  const [feeAmount, setFeeAmount] = useState("");
  const [installments, setInstallments] = useState<InstallmentItem[]>([]);
  const [daysWiseFeesEnabled, setDaysWiseFeesEnabled] = useState(false);
  const [daysWiseFees, setDaysWiseFees] = useState<Record<string, string>>({});

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    name: "",
    subject: "",
    teacherId: "",
    capacity: "",
  });
  const [editScheduleItems, setEditScheduleItems] = useState<ScheduleItem[]>([]);
  
  // Fee Configuration State (Edit)
  const [editFeeModel, setEditFeeModel] = useState<FeeModel>(null);
  const [editFeeAmount, setEditFeeAmount] = useState("");
  const [editInstallments, setEditInstallments] = useState<InstallmentItem[]>([]);
  const [editDaysWiseFeesEnabled, setEditDaysWiseFeesEnabled] = useState(false);
  const [editDaysWiseFees, setEditDaysWiseFees] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [batchesRes, teachersRes] = await Promise.all([
        fetch("/api/batches"),
        fetch("/api/teachers")
      ]);

      if (batchesRes.ok && teachersRes.ok) {
        const batchesData = await batchesRes.json();
        const teachersData = await teachersRes.json();
        setBatches(batchesData);
        setTeachers(teachersData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddScheduleItem = () => {
    setScheduleItems([...scheduleItems, { day: "", startTime: "12:00", endTime: "13:00" }]);
  };

  const handleRemoveScheduleItem = (index: number) => {
    const newItems = [...scheduleItems];
    newItems.splice(index, 1);
    setScheduleItems(newItems);
  };

  const handleScheduleChange = (index: number, field: keyof ScheduleItem, value: string) => {
    const newItems = [...scheduleItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setScheduleItems(newItems);
  };

  // Edit schedule handlers
  const handleAddEditScheduleItem = () => {
    setEditScheduleItems([...editScheduleItems, { day: "", startTime: "12:00", endTime: "13:00" }]);
  };

  const handleRemoveEditScheduleItem = (index: number) => {
    const newItems = [...editScheduleItems];
    newItems.splice(index, 1);
    setEditScheduleItems(newItems);
  };

  const handleEditScheduleChange = (index: number, field: keyof ScheduleItem, value: string) => {
    const newItems = [...editScheduleItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setEditScheduleItems(newItems);
  };

  // Installment Handlers (Create)
  const handleAddInstallment = () => {
    setInstallments([...installments, { name: `Installment ${installments.length + 1}`, amount: 0, dueDate: "" }]);
  };

  const handleRemoveInstallment = (index: number) => {
    const newItems = [...installments];
    newItems.splice(index, 1);
    setInstallments(newItems);
  };

  const handleInstallmentChange = (index: number, field: keyof InstallmentItem, value: string | number) => {
    const newItems = [...installments];
    newItems[index] = { ...newItems[index], [field]: value };
    setInstallments(newItems);
  };

  // Installment Handlers (Edit)
  const handleAddEditInstallment = () => {
    setEditInstallments([...editInstallments, { name: `Installment ${editInstallments.length + 1}`, amount: 0, dueDate: "" }]);
  };

  const handleRemoveEditInstallment = (index: number) => {
    const newItems = [...editInstallments];
    newItems.splice(index, 1);
    setEditInstallments(newItems);
  };

  const handleEditInstallmentChange = (index: number, field: keyof InstallmentItem, value: string | number) => {
    const newItems = [...editInstallments];
    newItems[index] = { ...newItems[index], [field]: value };
    setEditInstallments(newItems);
  };

  const handleEditClick = (batch: Batch) => {
    setEditingBatch(batch);
    setEditFormData({
      name: batch.name,
      subject: batch.subject,
      teacherId: batch.teacherId,
      capacity: batch.capacity?.toString() || "",
    });
    try {
      const schedule = JSON.parse(batch.schedule);
      setEditScheduleItems(Array.isArray(schedule) ? schedule : [{ day: "", startTime: "12:00", endTime: "13:00" }]);
    } catch {
      setEditScheduleItems([{ day: "", startTime: "12:00", endTime: "13:00" }]);
    }
    // Load fee configuration
    setEditFeeModel(batch.feeModel || null);
    setEditFeeAmount(batch.feeAmount?.toString() || "");
    setEditInstallments(batch.installments || []);
    // Load days-wise fees configuration
    setEditDaysWiseFeesEnabled(batch.daysWiseFeesEnabled || false);
    if (batch.daysWiseFees) {
      // Convert number values to string for input fields
      const daysFeesAsStrings: Record<string, string> = {};
      Object.entries(batch.daysWiseFees).forEach(([key, value]) => {
        daysFeesAsStrings[key] = value.toString();
      });
      setEditDaysWiseFees(daysFeesAsStrings);
    } else {
      setEditDaysWiseFees({});
    }
    setEditOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    // Validate schedule
    const validSchedule = scheduleItems.every(item => item.day.trim() !== "" && item.startTime !== "" && item.endTime !== "");
    
    if (!validSchedule) {
      toast({
        title: "Incomplete Schedule",
        description: "Please select a Day, Start Time, and End Time for all schedule entries.",
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }

    // Convert days-wise fees from string to number
    const daysWiseFeesNumeric: Record<string, number> = {};
    if (daysWiseFeesEnabled) {
      Object.entries(daysWiseFees).forEach(([key, value]) => {
        if (value) {
          daysWiseFeesNumeric[key] = parseFloat(value);
        }
      });
    }

    const payload = {
      ...data,
      schedule: JSON.stringify(scheduleItems),
      feeModel: feeModel,
      feeAmount: feeAmount,
      installments: feeModel === "CUSTOM" ? installments : null,
      daysWiseFeesEnabled: daysWiseFeesEnabled,
      daysWiseFees: daysWiseFeesEnabled ? daysWiseFeesNumeric : null,
    };
    
    try {
      const response = await fetch("/api/batches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Failed to create batch");
      }

      toast({
        title: "Success",
        description: "Batch created successfully",
      });
      setOpen(false);
      setScheduleItems([{ day: "", startTime: "12:00", endTime: "13:00" }]);
      // Reset fee state
      setFeeModel(null);
      setFeeAmount("");
      setInstallments([]);
      setDaysWiseFeesEnabled(false);
      setDaysWiseFees({});
      fetchData();
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

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingBatch) return;
    
    setSubmitting(true);

    // Validate schedule
    const validSchedule = editScheduleItems.every(item => item.day.trim() !== "" && item.startTime !== "" && item.endTime !== "");
    
    if (!validSchedule) {
      toast({
        title: "Incomplete Schedule",
        description: "Please select a Day, Start Time, and End Time for all schedule entries.",
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }

    // Convert days-wise fees from string to number
    const editDaysWiseFeesNumeric: Record<string, number> = {};
    if (editDaysWiseFeesEnabled) {
      Object.entries(editDaysWiseFees).forEach(([key, value]) => {
        if (value) {
          editDaysWiseFeesNumeric[key] = parseFloat(value);
        }
      });
    }

    const payload = {
      id: editingBatch.id,
      ...editFormData,
      schedule: JSON.stringify(editScheduleItems),
      feeModel: editFeeModel,
      feeAmount: editFeeAmount,
      installments: editFeeModel === "CUSTOM" ? editInstallments : null,
      daysWiseFeesEnabled: editDaysWiseFeesEnabled,
      daysWiseFees: editDaysWiseFeesEnabled ? editDaysWiseFeesNumeric : null,
    };
    
    try {
      const response = await fetch("/api/batches", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Failed to update batch");
      }

      toast({
        title: "Success",
        description: "Batch updated successfully",
      });
      setEditOpen(false);
      setEditingBatch(null);
      fetchData();
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

  const handleArchiveBatch = async (batch: Batch) => {
    try {
      const response = await fetch("/api/batches", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: batch.id, isActive: false }),
      });

      if (!response.ok) {
        throw new Error("Failed to archive batch");
      }

      toast({
        title: "Success",
        description: "Batch archived successfully",
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRestoreBatch = async (batch: Batch) => {
    try {
      const response = await fetch("/api/batches", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: batch.id, isActive: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to restore batch");
      }

      toast({
        title: "Success",
        description: "Batch restored successfully",
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatSchedule = (scheduleString: string) => {
    try {
      const items = JSON.parse(scheduleString);
      if (Array.isArray(items)) {
        return (
          <div className="flex flex-col gap-1">
            {items.map((item: ScheduleItem, i: number) => (
              <div key={i} className="text-xs">
                <span className="font-medium">{item.day.slice(0, 3)}:</span> {item.startTime} - {item.endTime}
              </div>
            ))}
          </div>
        );
      }
      return scheduleString;
    } catch (e) {
      return scheduleString;
    }
  };

  // Get unique subjects for filter dropdown
  const uniqueSubjects = Array.from(new Set(batches.map(b => b.subject).filter(Boolean))).sort();

  // Filter batches based on search and filters
  const filterBatches = (batchList: Batch[]) => {
    return batchList.filter(batch => {
      // Search filter - search by name, subject, or teacher name
      const matchesSearch = searchQuery === "" || 
        batch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        batch.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        batch.teacher?.name.toLowerCase().includes(searchQuery.toLowerCase());

      // Teacher filter
      const matchesTeacher = teacherFilter === "all" || batch.teacherId === teacherFilter;

      // Subject filter
      const matchesSubject = subjectFilter === "all" || batch.subject === subjectFilter;

      // Fee model filter
      const matchesFeeModel = feeModelFilter === "all" || batch.feeModel === feeModelFilter;

      return matchesSearch && matchesTeacher && matchesSubject && matchesFeeModel;
    });
  };

  const activeBatches = filterBatches(batches.filter(b => b.isActive !== false));
  const archivedBatches = filterBatches(batches.filter(b => b.isActive === false));

  const renderBatchTable = (batchList: Batch[], isArchived: boolean = false) => (
    <div className="rounded-md border overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch Name</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batchList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Layers className="h-10 w-10 opacity-50" />
                    <p className="text-sm font-medium">
                      {isArchived ? "No archived batches" : "No batches found"}
                    </p>
                    <p className="text-xs">
                      {searchQuery || teacherFilter !== "all" || subjectFilter !== "all" || feeModelFilter !== "all"
                        ? "Try adjusting your filters"
                        : isArchived 
                          ? "Archived batches will appear here"
                          : "Create your first batch to get started"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              batchList.map((batch) => (
                <TableRow key={batch.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{batch.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">
                      {batch.subject}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{batch.teacher?.name || "—"}</TableCell>
                  <TableCell className="text-sm">{formatSchedule(batch.schedule)}</TableCell>
                  <TableCell className="text-sm">
                    {batch._count.admissions} / {batch.capacity ?? "∞"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(batch.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {!isArchived ? (
                        <>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEditClick(batch)}
                            title="Edit batch"
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleArchiveBatch(batch)}
                            title="Archive batch"
                            className="h-8 w-8"
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleRestoreBatch(batch)}
                          title="Restore batch"
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

      {/* Mobile Cards */}
      <div className="md:hidden">
        {batchList.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Layers className="h-10 w-10 opacity-50" />
              <p className="text-sm font-medium">
                {isArchived ? "No archived batches" : "No batches found"}
              </p>
              <p className="text-xs">
                {searchQuery || teacherFilter !== "all" || subjectFilter !== "all" || feeModelFilter !== "all"
                  ? "Try adjusting your filters"
                  : isArchived 
                    ? "Archived batches will appear here"
                    : "Create your first batch to get started"}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y">
            {batchList.map((batch) => (
              <div key={batch.id} className="p-4 space-y-3 hover:bg-muted/50">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{batch.name}</h3>
                    <div className="mt-1">
                      <Badge variant="outline" className="font-normal text-xs">
                        {batch.subject}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {!isArchived ? (
                      <>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEditClick(batch)}
                          title="Edit batch"
                          className="h-8 w-8"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleArchiveBatch(batch)}
                          title="Archive batch"
                          className="h-8 w-8"
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleRestoreBatch(batch)}
                        title="Restore batch"
                        className="h-8 w-8"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Teacher</p>
                    <p className="mt-0.5">{batch.teacher?.name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Capacity</p>
                    <p className="mt-0.5">{batch._count.admissions} / {batch.capacity ?? "∞"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs">Schedule</p>
                    <p className="mt-0.5">{formatSchedule(batch.schedule)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Created</p>
                    <p className="mt-0.5 text-muted-foreground">
                      {new Date(batch.createdAt).toLocaleDateString("en-US", {
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

  const renderScheduleEditor = (
    items: ScheduleItem[],
    onAdd: () => void,
    onRemove: (index: number) => void,
    onChange: (index: number, field: keyof ScheduleItem, value: string) => void
  ) => (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label>Schedule</Label>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={onAdd}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Time
        </Button>
      </div>
      
      <div className="space-y-2 border rounded-md p-3 bg-muted/20">
        {items.map((item, index) => (
          <div key={index} className="flex gap-2 items-end">
            <div className="flex-1 space-y-1">
               <Label className="text-xs text-muted-foreground">Day</Label>
               <Select 
                value={item.day} 
                onValueChange={(val) => onChange(index, 'day', val)}
               >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map(day => (
                    <SelectItem key={day} value={day}>{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-[130px] space-y-1">
              <Label className="text-xs text-muted-foreground">Start</Label>
              <TimePicker 
                value={item.startTime}
                onChange={(val) => onChange(index, 'startTime', val)}
              />
            </div>
             <div className="w-[130px] space-y-1">
              <Label className="text-xs text-muted-foreground">End</Label>
              <TimePicker 
                value={item.endTime}
                onChange={(val) => onChange(index, 'endTime', val)}
              />
            </div>
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 text-destructive hover:text-destructive/90"
              onClick={() => onRemove(index)}
              disabled={items.length === 1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFeeEditor = (
    currentModel: FeeModel,
    setModel: (val: FeeModel) => void,
    amount: string,
    setAmount: (val: string) => void,
    instItems: InstallmentItem[],
    onAddInst: () => void,
    onRemoveInst: (index: number) => void,
    onChangeInst: (index: number, field: keyof InstallmentItem, value: string | number) => void,
    scheduleItemsForDays: ScheduleItem[],
    daysWiseEnabled: boolean,
    setDaysWiseEnabled: (val: boolean) => void,
    daysWiseFeesMap: Record<string, string>,
    setDaysWiseFeesMap: (val: Record<string, string>) => void
  ) => {
    // Calculate unique days from schedule
    const uniqueDays = new Set(scheduleItemsForDays.filter(item => item.day).map(item => item.day));
    const totalScheduledDays = uniqueDays.size;

    return (
    <div className="space-y-3 border rounded-md p-4 bg-muted/10">
      <div className="flex justify-between items-center">
        <Label className="text-base font-medium">Fee Configuration</Label>
      </div>
      
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Fee Model</Label>
        <Select 
          value={currentModel || ""} 
          onValueChange={(val) => setModel(val as FeeModel)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select fee model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ONE_TIME">One-time Fee</SelectItem>
            <SelectItem value="MONTHLY">Monthly Fee</SelectItem>
            <SelectItem value="QUARTERLY">Quarterly Fee</SelectItem>
            <SelectItem value="CUSTOM">Custom Installments</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {currentModel && currentModel !== "CUSTOM" && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            {currentModel === "ONE_TIME" && "Total Fee Amount"}
            {currentModel === "MONTHLY" && "Monthly Fee Amount"}
            {currentModel === "QUARTERLY" && "Quarterly Fee Amount"}
          </Label>
          <Input 
            type="number" 
            placeholder="₹0" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)}
            min="0"
          />
        </div>
      )}

      {currentModel === "CUSTOM" && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-xs text-muted-foreground">Installments</Label>
            <Button type="button" variant="outline" size="sm" onClick={onAddInst}>
              <Plus className="h-3 w-3 mr-1" /> Add Installment
            </Button>
          </div>
          
          {instItems.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">No installments added yet</p>
          )}
          
          {instItems.map((item, index) => (
            <div key={index} className="flex gap-2 items-end bg-background p-2 rounded border">
              <div className="flex-1 space-y-1">
                <Label className="text-xs text-muted-foreground">Name</Label>
                <Input 
                  placeholder="Installment name" 
                  value={item.name} 
                  onChange={(e) => onChangeInst(index, 'name', e.target.value)}
                />
              </div>
              <div className="w-[120px] space-y-1">
                <Label className="text-xs text-muted-foreground">Amount</Label>
                <Input 
                  type="number" 
                  placeholder="₹0" 
                  value={item.amount || ""} 
                  onChange={(e) => onChangeInst(index, 'amount', parseFloat(e.target.value) || 0)}
                  min="0"
                />
              </div>
              <div className="w-[130px] space-y-1">
                <Label className="text-xs text-muted-foreground">Due Date</Label>
                <Input 
                  type="date" 
                  value={item.dueDate} 
                  onChange={(e) => onChangeInst(index, 'dueDate', e.target.value)}
                />
              </div>
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 text-destructive hover:text-destructive/90"
                onClick={() => onRemoveInst(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          {instItems.length > 0 && (
            <div className="text-sm font-medium text-right pt-2 border-t">
              Total: ₹{instItems.reduce((sum, i) => sum + (i.amount || 0), 0).toLocaleString()}
            </div>
          )}
        </div>
      )}

      {/* Days-wise Fees Toggle - Only show for non-CUSTOM fee models */}
      {currentModel && currentModel !== "CUSTOM" && (
        <div className="space-y-3 pt-3 border-t">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Days-wise Fees</Label>
              <p className="text-xs text-muted-foreground">
                Set different fees based on attendance days per week
              </p>
            </div>
            <Switch
              checked={daysWiseEnabled}
              onCheckedChange={(checked) => {
                setDaysWiseEnabled(checked);
                if (!checked) {
                  setDaysWiseFeesMap({});
                }
              }}
            />
          </div>

          {daysWiseEnabled && (
            <div className="space-y-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
              {totalScheduledDays === 0 ? (
                <p className="text-sm text-amber-600">
                  Please add schedule days first to configure days-wise fees.
                </p>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      Add fee options for different attendance days (max {totalScheduledDays} days)
                    </p>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        // Find the first available day not yet added
                        const usedDays = Object.keys(daysWiseFeesMap).map(Number);
                        const availableDays = Array.from({ length: totalScheduledDays }, (_, i) => i + 1)
                          .filter(d => !usedDays.includes(d));
                        if (availableDays.length > 0) {
                          const newMap = { ...daysWiseFeesMap };
                          newMap[availableDays[0].toString()] = "";
                          setDaysWiseFeesMap(newMap);
                        }
                      }}
                      disabled={Object.keys(daysWiseFeesMap).length >= totalScheduledDays}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add Day Fee
                    </Button>
                  </div>
                  
                  {Object.keys(daysWiseFeesMap).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">No day fees added yet. Click "Add Day Fee" to start.</p>
                  )}

                  <div className="space-y-2">
                    {Object.entries(daysWiseFeesMap)
                      .sort(([a], [b]) => parseInt(a) - parseInt(b))
                      .map(([days, fee]) => {
                        // Get list of days already used (except current)
                        const usedDays = Object.keys(daysWiseFeesMap).map(Number).filter(d => d !== parseInt(days));
                        const availableDays = Array.from({ length: totalScheduledDays }, (_, i) => i + 1)
                          .filter(d => !usedDays.includes(d));
                        
                        return (
                          <div key={days} className="flex items-center gap-2 bg-white p-2 rounded border">
                            <div className="w-32">
                              <Select 
                                value={days} 
                                onValueChange={(newDays) => {
                                  const newMap = { ...daysWiseFeesMap };
                                  const currentFee = newMap[days];
                                  delete newMap[days];
                                  newMap[newDays] = currentFee;
                                  setDaysWiseFeesMap(newMap);
                                }}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableDays.map((dayCount) => (
                                    <SelectItem key={dayCount} value={dayCount.toString()}>
                                      {dayCount} day{dayCount > 1 ? 's' : ''}/week
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Input
                              type="number"
                              placeholder="₹0"
                              value={fee}
                              onChange={(e) => {
                                const newMap = { ...daysWiseFeesMap };
                                newMap[days] = e.target.value;
                                setDaysWiseFeesMap(newMap);
                              }}
                              min="0"
                              className="flex-1"
                            />
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              className="h-9 w-9 text-destructive hover:text-destructive/90"
                              onClick={() => {
                                const newMap = { ...daysWiseFeesMap };
                                delete newMap[days];
                                setDaysWiseFeesMap(newMap);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Batches</h1>
          <p className="text-muted-foreground mt-1">Manage student batches and schedules</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Layers className="mr-2 h-4 w-4" />
              Create Batch
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Create New Batch</DialogTitle>
                <DialogDescription>
                  Setup a new batch and assign a teacher.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Batch Name</Label>
                  <Input id="name" name="name" required placeholder="Class 12 Physics - Batch A" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" name="subject" required placeholder="Physics" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teacher">Assign Teacher</Label>
                  <Select name="teacherId" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {renderScheduleEditor(scheduleItems, handleAddScheduleItem, handleRemoveScheduleItem, handleScheduleChange)}

                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity (Optional)</Label>
                  <Input id="capacity" name="capacity" type="number" min="1" placeholder="30" />
                </div>

                {renderFeeEditor(feeModel, setFeeModel, feeAmount, setFeeAmount, installments, handleAddInstallment, handleRemoveInstallment, handleInstallmentChange, scheduleItems, daysWiseFeesEnabled, setDaysWiseFeesEnabled, daysWiseFees, setDaysWiseFees)}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Batch
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
            <form onSubmit={handleEditSubmit}>
              <DialogHeader>
                <DialogTitle>Edit Batch</DialogTitle>
                <DialogDescription>
                  Update batch details.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Batch Name</Label>
                  <Input 
                    id="edit-name" 
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                    required 
                    placeholder="Class 12 Physics - Batch A" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-subject">Subject</Label>
                  <Input 
                    id="edit-subject" 
                    value={editFormData.subject}
                    onChange={(e) => setEditFormData({...editFormData, subject: e.target.value})}
                    required 
                    placeholder="Physics" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-teacher">Assign Teacher</Label>
                  <Select 
                    value={editFormData.teacherId}
                    onValueChange={(val) => setEditFormData({...editFormData, teacherId: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {renderScheduleEditor(editScheduleItems, handleAddEditScheduleItem, handleRemoveEditScheduleItem, handleEditScheduleChange)}

                <div className="space-y-2">
                  <Label htmlFor="edit-capacity">Capacity (Optional)</Label>
                  <Input 
                    id="edit-capacity" 
                    type="number" 
                    value={editFormData.capacity}
                    onChange={(e) => setEditFormData({...editFormData, capacity: e.target.value})}
                    min="1" 
                    placeholder="30" 
                  />
                </div>

                {renderFeeEditor(editFeeModel, setEditFeeModel, editFeeAmount, setEditFeeAmount, editInstallments, handleAddEditInstallment, handleRemoveEditInstallment, handleEditInstallmentChange, editScheduleItems, editDaysWiseFeesEnabled, setEditDaysWiseFeesEnabled, editDaysWiseFees, setEditDaysWiseFees)}
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
                  placeholder="Search by batch name, subject, or teacher..."
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
              {/* Teacher Filter */}
              <div className="w-full sm:w-[180px]">
                <Select value={teacherFilter} onValueChange={setTeacherFilter}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="All Teachers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teachers</SelectItem>
                    {teachers.map(teacher => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name}
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

              {/* Fee Model Filter */}
              <div className="w-full sm:w-[160px]">
                <Select value={feeModelFilter} onValueChange={setFeeModelFilter}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="All Fee Models" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Fee Models</SelectItem>
                    <SelectItem value="ONE_TIME">One-time</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                    <SelectItem value="CUSTOM">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters Button */}
              {(searchQuery || teacherFilter !== "all" || subjectFilter !== "all" || feeModelFilter !== "all") && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setTeacherFilter("all");
                    setSubjectFilter("all");
                    setFeeModelFilter("all");
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
            <Layers className="h-4 w-4" />
            <span>Active</span>
            <Badge variant="secondary" className="ml-1">
              {activeBatches.length}
              {(searchQuery || teacherFilter !== "all" || subjectFilter !== "all" || feeModelFilter !== "all") && 
                ` / ${batches.filter(b => b.isActive !== false).length}`}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="archived" className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            <span>Archived</span>
            <Badge variant="secondary" className="ml-1">
              {archivedBatches.length}
              {(searchQuery || teacherFilter !== "all" || subjectFilter !== "all" || feeModelFilter !== "all") && 
                ` / ${batches.filter(b => b.isActive === false).length}`}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-0">
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Active Batches</CardTitle>
              <CardDescription>
                Manage and view all active batches
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                renderBatchTable(activeBatches, false)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="archived" className="mt-0">
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Archived Batches</CardTitle>
              <CardDescription>
                View and restore archived batches
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                renderBatchTable(archivedBatches, true)
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
