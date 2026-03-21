'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { CalendarIcon, UserRoundCheck, UserRoundX, Plus, Eye, Edit3, History, Users, X, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface AttendanceComponentProps {
  title: string;
  description: string;
  batchApiEndpoint: string;
}

interface AttendanceHistory {
  batchId: string;
  batchName: string;
  subject: string;
  classLevel: string | null;
  date: string;
  present: number;
  absent: number;
  total: number;
}

interface StudentAttendance {
  admissionId: string;
  studentId: string;
  name: string;
  email: string;
  phone: string | null;
  parentName: string | null;
  isPresent: boolean | null;
}

const AttendanceComponent = ({
  title,
  description,
  batchApiEndpoint
}: AttendanceComponentProps) => {
  const { toast } = useToast();
  const [batches, setBatches] = useState<any[]>([]);
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({ present: 0, absent: 0, total: 0 });

  // History states
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('history');

  // Filter states
  const [filterBatch, setFilterBatch] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<AttendanceHistory | null>(null);
  const [viewStudents, setViewStudents] = useState<StudentAttendance[]>([]);
  const [editStudents, setEditStudents] = useState<StudentAttendance[]>([]);
  const [modalLoading, setModalLoading] = useState(false);


  // Fetch batches
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const response = await fetch(batchApiEndpoint);
        const data = await response.json();
        setBatches(data);
      } catch (error) {
        console.error('Error fetching batches:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch batches',
          variant: 'destructive',
        });
      }
    };

    fetchBatches();
  }, [batchApiEndpoint, toast]);

  // Fetch attendance history
  const fetchAttendanceHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const response = await fetch('/api/attendance/history');
      if (!response.ok) throw new Error('Failed to fetch history');
      const data = await response.json();
      setAttendanceHistory(data);
    } catch (error) {
      console.error('Error fetching attendance history:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch attendance history',
        variant: 'destructive',
      });
    } finally {
      setHistoryLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAttendanceHistory();
  }, [fetchAttendanceHistory]);

  // Fetch students when batch and date are selected
  const fetchStudentsForAttendance = useCallback(async () => {
    if (!selectedBatch || !selectedDate) return;

    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd'); // Format as YYYY-MM-DD in local timezone
      const response = await fetch(`/api/attendance?batchId=${selectedBatch}&date=${dateStr}`);

      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }

      const data = await response.json();
      // Set all students to absent by default if they don't have attendance marked
      // This ensures no student has null/undefined status and prevents data inconsistency
      const studentsWithDefaultStatus = data.map((student: StudentAttendance) => ({
        ...student,
        isPresent: student.isPresent === null ? false : student.isPresent
      }));
      setStudents(studentsWithDefaultStatus);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch students for attendance',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [selectedBatch, selectedDate, toast]);

  useEffect(() => {
    if (selectedBatch && activeTab === 'new') {
      fetchStudentsForAttendance();
    }
  }, [selectedBatch, selectedDate, activeTab, fetchStudentsForAttendance]);

  // Update summary when students change
  useEffect(() => {
    const presentCount = students.filter(student => student.isPresent === true).length;
    const absentCount = students.filter(student => student.isPresent === false).length;
    const totalCount = students.length;

    setSummary({
      present: presentCount,
      absent: absentCount,
      total: totalCount
    });
  }, [students]);

  // Derive filter options
  const uniqueBatches = Array.from(new Set(attendanceHistory.map(h => h.batchName))).sort();
  const uniqueSubjects = Array.from(new Set(attendanceHistory.map(h => h.subject))).sort();

  // Filter history
  const filteredHistory = attendanceHistory.filter(history => {
    const matchesBatch = filterBatch === 'all' || history.batchName === filterBatch;
    const matchesSubject = filterSubject === 'all' || history.subject === filterSubject;
    const matchesDate = !filterDate || (() => {
      const historyDate = new Date(history.date);
      const selectedFilterDate = new Date(filterDate);
      return (
        historyDate.getDate() === selectedFilterDate.getDate() &&
        historyDate.getMonth() === selectedFilterDate.getMonth() &&
        historyDate.getFullYear() === selectedFilterDate.getFullYear()
      );
    })();
    return matchesBatch && matchesSubject && matchesDate;
  });

  const clearFilters = () => {
    setFilterBatch('all');
    setFilterSubject('all');
    setFilterDate(undefined);
  };

  const handleAttendanceChange = (studentId: string, isPresent: boolean) => {
    setStudents(prev => prev.map(student =>
      student.studentId === studentId ? { ...student, isPresent } : student
    ));
  };

  const handleEditAttendanceChange = (studentId: string, isPresent: boolean) => {
    setEditStudents(prev => prev.map(student =>
      student.studentId === studentId ? { ...student, isPresent } : student
    ));
  };

  const handleMarkAll = (status: boolean) => {
    setStudents(prev => prev.map(student => ({ ...student, isPresent: status })));
  };

  const handleMarkAllEdit = (status: boolean) => {
    setEditStudents(prev => prev.map(student => ({ ...student, isPresent: status })));
  };

  const saveAttendance = async () => {
    if (!selectedBatch || !selectedDate || students.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select a batch and date, and ensure students are loaded',
        variant: 'destructive',
      });
      return;
    }

    // Validate that all students have attendance marked (not null)
    const unmarkedStudents = students.filter(s => s.isPresent === null);
    if (unmarkedStudents.length > 0) {
      toast({
        title: 'Error',
        description: `Please mark attendance for all students. ${unmarkedStudents.length} student(s) remaining.`,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd'); // Format as YYYY-MM-DD in local timezone
      const attendanceData = students.map(student => ({
        studentId: student.studentId,
        isPresent: student.isPresent
      }));

      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          batchId: selectedBatch,
          date: dateStr,
          attendanceData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save attendance');
      }

      const result = await response.json();
      toast({
        title: 'Success',
        description: result.message || 'Attendance saved successfully',
      });

      // Refresh history after saving
      fetchAttendanceHistory();
      setActiveTab('history');
    } catch (error: any) {
      console.error('Error saving attendance:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save attendance',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveEditedAttendance = async () => {
    if (!selectedHistory || editStudents.length === 0) return;

    // Validate that all students have attendance marked (not null)
    const unmarkedStudents = editStudents.filter(s => s.isPresent === null);
    if (unmarkedStudents.length > 0) {
      toast({
        title: 'Error',
        description: `Please mark attendance for all students. ${unmarkedStudents.length} student(s) remaining.`,
        variant: 'destructive',
      });
      return;
    }

    setModalLoading(true);
    try {
      const attendanceData = editStudents.map(student => ({
        studentId: student.studentId,
        isPresent: student.isPresent
      }));

      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          batchId: selectedHistory.batchId,
          date: selectedHistory.date,
          attendanceData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update attendance');
      }

      toast({
        title: 'Success',
        description: 'Attendance updated successfully',
      });

      setEditModalOpen(false);
      fetchAttendanceHistory();
    } catch (error: any) {
      console.error('Error updating attendance:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update attendance',
        variant: 'destructive',
      });
    } finally {
      setModalLoading(false);
    }
  };

  const openViewModal = async (history: AttendanceHistory) => {
    setSelectedHistory(history);
    setViewModalOpen(true);
    setModalLoading(true);

    try {
      const response = await fetch(`/api/attendance?batchId=${history.batchId}&date=${history.date}`);
      if (!response.ok) throw new Error('Failed to fetch attendance details');
      const data = await response.json();
      setViewStudents(data);
    } catch (error) {
      console.error('Error fetching attendance details:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch attendance details',
        variant: 'destructive',
      });
    } finally {
      setModalLoading(false);
    }
  };

  const openEditModal = async (history: AttendanceHistory) => {
    setSelectedHistory(history);
    setEditModalOpen(true);
    setModalLoading(true);

    try {
      const response = await fetch(`/api/attendance?batchId=${history.batchId}&date=${history.date}`);
      if (!response.ok) throw new Error('Failed to fetch attendance details');
      const data = await response.json();
      // Set default status to false (absent) for any student with null attendance
      const studentsWithDefaultStatus = data.map((student: StudentAttendance) => ({
        ...student,
        isPresent: student.isPresent === null ? false : student.isPresent
      }));
      setEditStudents(studentsWithDefaultStatus);
    } catch (error) {
      console.error('Error fetching attendance details:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch attendance details',
        variant: 'destructive',
      });
    } finally {
      setModalLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'PPP');
  };

  return (
    <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2',
            activeTab === 'history'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          <History className="h-4 w-4" />
          Attendance History
        </button>
        <button
          onClick={() => setActiveTab('new')}
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2',
            activeTab === 'new'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          <Plus className="h-4 w-4" />
          Take New Attendance
        </button>
      </div>

      {/* History Tab */}
      {activeTab === 'history' && (
        <Card className="shadow-lg rounded-xl border-0 bg-white overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-gray-800">Attendance History</CardTitle>
            <CardDescription>View and manage past attendance records</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2 md:mb-0 md:w-auto">
                <Filter className="h-4 w-4" />
                <span className="font-medium">Filters:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                {/* Batch Filter */}
                <Select value={filterBatch} onValueChange={setFilterBatch}>
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="All Batches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Batches</SelectItem>
                    {uniqueBatches.map(batchName => (
                      <SelectItem key={batchName} value={batchName}>{batchName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Subject Filter */}
                <Select value={filterSubject} onValueChange={setFilterSubject}>
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="All Subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {uniqueSubjects.map(subject => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Date Filter */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal bg-white',
                        !filterDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filterDate ? format(filterDate, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filterDate}
                      onSelect={setFilterDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                {/* Clear Filters */}
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="text-gray-500 hover:text-gray-900 md:w-auto w-full"
                  disabled={filterBatch === 'all' && filterSubject === 'all' && !filterDate}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
            {historyLoading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : attendanceHistory.length === 0 ? (
              <div className="text-center py-10">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No attendance records found</p>
                <Button
                  onClick={() => setActiveTab('new')}
                  className="mt-4"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Take First Attendance
                </Button>
              </div>
            ) : (
              <>
                {/* Mobile View - Card Layout */}
                <div className="md:hidden space-y-4">
                  {filteredHistory.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No records match the selected filters
                    </div>
                  ) : (
                    filteredHistory.map((history, index) => (
                      <div
                        key={`${history.batchId}-${history.date}`}
                        className="p-4 rounded-lg border bg-white shadow-sm"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">{history.batchName}</h4>
                            <p className="text-sm text-gray-600">{history.subject}</p>
                            {history.classLevel && (
                              <Badge variant="outline" className="mt-1">{history.classLevel}</Badge>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">{formatDate(history.date)}</span>
                        </div>

                        <div className="flex gap-4 mb-3">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm">Present: <span className="font-semibold text-green-600">{history.present}</span></span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-sm">Absent: <span className="font-semibold text-red-600">{history.absent}</span></span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openViewModal(history)}
                            className="flex-1"
                          >
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(history)}
                            className="flex-1"
                          >
                            <Edit3 className="h-4 w-4 mr-1" /> Edit
                          </Button>
                        </div>
                      </div>
                    )))}
                </div>

                {/* Desktop View - Table Layout */}
                <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Batch Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subject / Class
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Present
                        </th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Absent
                        </th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredHistory.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                            No records match the selected filters
                          </td>
                        </tr>
                      ) : (
                        filteredHistory.map((history, index) => (
                          <tr
                            key={`${history.batchId}-${history.date}`}
                            className={index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{history.batchName}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">{history.subject}</div>
                              {history.classLevel && (
                                <Badge variant="outline" className="mt-1 text-xs">{history.classLevel}</Badge>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">{formatDate(history.date)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {history.present}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                {history.absent}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className="text-sm font-medium text-gray-900">{history.total}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="flex justify-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openViewModal(history)}
                                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditModal(history)}
                                  className="text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* New Attendance Tab */}
      {activeTab === 'new' && (
        <Card className="shadow-lg rounded-xl border-0 bg-white overflow-hidden">
          <CardContent className="pt-6">
            {/* Filters Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="batch" className="text-sm font-medium text-gray-700">Select Batch</Label>
                <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {batches.map(batch => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.name} - {batch.subject}
                        {batch.teacher?.name && ` (Teacher: ${batch.teacher.name})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !selectedDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      disabled={{ after: new Date() }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Summary Section */}
            {selectedBatch && selectedDate && (
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <span className="bg-blue-100 p-1 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </span>
                  Attendance Summary
                </h3>
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm font-medium">Present: <span className="font-bold text-green-600">{summary.present}</span></span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-sm font-medium">Absent: <span className="font-bold text-red-600">{summary.absent}</span></span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium">Total: <span className="font-bold">{summary.total}</span></span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {selectedBatch && selectedDate && (
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <Button
                  variant="outline"
                  onClick={() => handleMarkAll(true)}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                >
                  <UserRoundCheck className="h-4 w-4" />
                  Mark All Present
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleMarkAll(false)}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                >
                  <UserRoundX className="h-4 w-4" />
                  Mark All Absent
                </Button>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            )}

            {/* Attendance Table/List */}
            {!loading && students.length > 0 && (
              <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                {/* Mobile View - Card Layout */}
                <div className="md:hidden space-y-4">
                  {students.map((student, index) => (
                    <div
                      key={student.studentId}
                      className={`p-4 rounded-lg border ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900 text-lg">{student.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">Contact: {student.phone || 'N/A'}</p>
                          <p className="text-sm text-gray-600">Parent: {student.parentName || 'N/A'}</p>
                        </div>

                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleAttendanceChange(student.studentId, true)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${student.isPresent
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-green-100'
                              }`}
                          >
                            Present
                          </button>
                          <button
                            onClick={() => handleAttendanceChange(student.studentId, false)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!student.isPresent
                              ? 'bg-red-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-red-100'
                              }`}
                          >
                            Absent
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop View - Table Layout */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Parent/Guardian
                        </th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Attendance
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {students.map((student, index) => (
                        <tr
                          key={student.studentId}
                          className={index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">{student.phone || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">{student.parentName || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex justify-center space-x-4">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id={`present-${student.studentId}`}
                                  checked={student.isPresent === true}
                                  onCheckedChange={(checked) => handleAttendanceChange(student.studentId, checked as boolean)}
                                  className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 h-5 w-5"
                                />
                                <Label
                                  htmlFor={`present-${student.studentId}`}
                                  className="text-sm font-medium text-gray-700"
                                >
                                  Present
                                </Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id={`absent-${student.studentId}`}
                                  checked={student.isPresent === false}
                                  onCheckedChange={(checked) => handleAttendanceChange(student.studentId, !checked as boolean)}
                                  className="data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500 h-5 w-5"
                                />
                                <Label
                                  htmlFor={`absent-${student.studentId}`}
                                  className="text-sm font-medium text-gray-700"
                                >
                                  Absent
                                </Label>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Save Button */}
            {selectedBatch && selectedDate && students.length > 0 && (
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={saveAttendance}
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all transform hover:scale-105 shadow-md"
                >
                  <div className="flex items-center gap-2">
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Save Attendance
                      </>
                    )}
                  </div>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* View Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              View Attendance
            </DialogTitle>
            <DialogDescription>
              {selectedHistory && (
                <span>
                  <strong>{selectedHistory.batchName}</strong> - {selectedHistory.subject} | {formatDate(selectedHistory.date)}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {modalLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Present: <span className="font-bold text-green-600">{viewStudents.filter(s => s.isPresent).length}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium">Absent: <span className="font-bold text-red-600">{viewStudents.filter(s => !s.isPresent).length}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Total: <span className="font-bold">{viewStudents.length}</span></span>
                </div>
              </div>

              {/* Present Students */}
              <div>
                <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                  <UserRoundCheck className="h-4 w-4" />
                  Present Students ({viewStudents.filter(s => s.isPresent).length})
                </h4>
                <div className="space-y-2">
                  {viewStudents.filter(s => s.isPresent).map(student => (
                    <div key={student.studentId} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                      <div>
                        <span className="font-medium text-gray-900">{student.name}</span>
                        <span className="text-sm text-gray-500 ml-2">({student.phone || 'N/A'})</span>
                      </div>
                      <Badge className="bg-green-500">Present</Badge>
                    </div>
                  ))}
                  {viewStudents.filter(s => s.isPresent).length === 0 && (
                    <p className="text-sm text-gray-500 italic">No students present</p>
                  )}
                </div>
              </div>

              {/* Absent Students */}
              <div>
                <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                  <UserRoundX className="h-4 w-4" />
                  Absent Students ({viewStudents.filter(s => !s.isPresent).length})
                </h4>
                <div className="space-y-2">
                  {viewStudents.filter(s => !s.isPresent).map(student => (
                    <div key={student.studentId} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                      <div>
                        <span className="font-medium text-gray-900">{student.name}</span>
                        <span className="text-sm text-gray-500 ml-2">({student.phone || 'N/A'})</span>
                      </div>
                      <Badge className="bg-red-500">Absent</Badge>
                    </div>
                  ))}
                  {viewStudents.filter(s => !s.isPresent).length === 0 && (
                    <p className="text-sm text-gray-500 italic">No students absent</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-amber-600" />
              Edit Attendance
            </DialogTitle>
            <DialogDescription>
              {selectedHistory && (
                <span>
                  <strong>{selectedHistory.batchName}</strong> - {selectedHistory.subject} | {formatDate(selectedHistory.date)}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {modalLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleMarkAllEdit(true)}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                  size="sm"
                >
                  <UserRoundCheck className="h-4 w-4" />
                  Mark All Present
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleMarkAllEdit(false)}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                  size="sm"
                >
                  <UserRoundX className="h-4 w-4" />
                  Mark All Absent
                </Button>
              </div>

              {/* Summary */}
              <div className="flex gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Present: <span className="font-bold text-green-600">{editStudents.filter(s => s.isPresent).length}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium">Absent: <span className="font-bold text-red-600">{editStudents.filter(s => !s.isPresent).length}</span></span>
                </div>
              </div>

              {/* Student List */}
              <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                {editStudents.map(student => (
                  <div
                    key={student.studentId}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border transition-colors",
                      student.isPresent
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    )}
                  >
                    <div>
                      <span className="font-medium text-gray-900">{student.name}</span>
                      <span className="text-sm text-gray-500 ml-2">({student.phone || 'N/A'})</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditAttendanceChange(student.studentId, true)}
                        className={cn(
                          "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                          student.isPresent
                            ? "bg-green-500 text-white"
                            : "bg-white text-gray-700 border hover:bg-green-100"
                        )}
                      >
                        Present
                      </button>
                      <button
                        onClick={() => handleEditAttendanceChange(student.studentId, false)}
                        className={cn(
                          "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                          !student.isPresent
                            ? "bg-red-500 text-white"
                            : "bg-white text-gray-700 border hover:bg-red-100"
                        )}
                      >
                        Absent
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Save Button */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={saveEditedAttendance}
                  disabled={modalLoading}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {modalLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </div>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AttendanceComponent;