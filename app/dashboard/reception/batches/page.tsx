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
import { Archive, Layers, Loader2, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
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
  capacity: number;
  isActive: boolean;
  createdAt: string;
  feeModel?: FeeModel;
  feeAmount?: number;
  installments?: InstallmentItem[];
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

  // Schedule State
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([
    { day: "", startTime: "12:00", endTime: "13:00" }
  ]);

  // Fee Configuration State (Create)
  const [feeModel, setFeeModel] = useState<FeeModel>(null);
  const [feeAmount, setFeeAmount] = useState("");
  const [installments, setInstallments] = useState<InstallmentItem[]>([]);

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
      capacity: batch.capacity.toString(),
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

    const payload = {
      ...data,
      schedule: JSON.stringify(scheduleItems),
      feeModel: feeModel,
      feeAmount: feeAmount,
      installments: feeModel === "CUSTOM" ? installments : null,
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

    const payload = {
      id: editingBatch.id,
      ...editFormData,
      schedule: JSON.stringify(editScheduleItems),
      feeModel: editFeeModel,
      feeAmount: editFeeAmount,
      installments: editFeeModel === "CUSTOM" ? editInstallments : null,
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

  const activeBatches = batches.filter(b => b.isActive !== false);
  const archivedBatches = batches.filter(b => b.isActive === false);

  const renderBatchTable = (batchList: Batch[], isArchived: boolean = false) => (
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
            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
              {isArchived ? "No archived batches" : "No active batches found"}
            </TableCell>
          </TableRow>
        ) : (
          batchList.map((batch) => (
            <TableRow key={batch.id}>
              <TableCell className="font-medium">{batch.name}</TableCell>
              <TableCell>{batch.subject}</TableCell>
              <TableCell>{batch.teacher?.name}</TableCell>
              <TableCell>{formatSchedule(batch.schedule)}</TableCell>
              <TableCell>
                {batch._count.admissions} / {batch.capacity}
              </TableCell>
              <TableCell>{new Date(batch.createdAt).toLocaleDateString()}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {!isArchived ? (
                    <>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => handleEditClick(batch)}
                        title="Edit batch"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => handleArchiveBatch(batch)}
                        title="Archive batch"
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleRestoreBatch(batch)}
                      title="Restore batch"
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
    onChangeInst: (index: number, field: keyof InstallmentItem, value: string | number) => void
  ) => (
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
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Batches</h1>
          <p className="text-muted-foreground">Manage student batches and schedules</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
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
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input id="capacity" name="capacity" type="number" required min="1" placeholder="30" />
                </div>

                {renderFeeEditor(feeModel, setFeeModel, feeAmount, setFeeAmount, installments, handleAddInstallment, handleRemoveInstallment, handleInstallmentChange)}
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
                  <Label htmlFor="edit-capacity">Capacity</Label>
                  <Input 
                    id="edit-capacity" 
                    type="number" 
                    value={editFormData.capacity}
                    onChange={(e) => setEditFormData({...editFormData, capacity: e.target.value})}
                    required 
                    min="1" 
                    placeholder="30" 
                  />
                </div>

                {renderFeeEditor(editFeeModel, setEditFeeModel, editFeeAmount, setEditFeeAmount, editInstallments, handleAddEditInstallment, handleRemoveEditInstallment, handleEditInstallmentChange)}
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

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Active ({activeBatches.length})
          </TabsTrigger>
          <TabsTrigger value="archived" className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            Archived ({archivedBatches.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Active Batches</CardTitle>
              <CardDescription>
                List of all active batches and their occupancy
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                renderBatchTable(activeBatches, false)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="archived">
          <Card>
            <CardHeader>
              <CardTitle>Archived Batches</CardTitle>
              <CardDescription>
                List of archived batches that are no longer active
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
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
