'use client';

import { useState, useEffect } from 'react';
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
import { format } from 'date-fns';
import { CalendarIcon, UserRoundCheck, UserRoundX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AttendanceComponentProps {
  title: string;
  description: string;
  batchApiEndpoint: string;
}

const AttendanceComponent = ({
  title,
  description,
  batchApiEndpoint
}: AttendanceComponentProps) => {
  const { toast } = useToast();
  const [batches, setBatches] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({ present: 0, absent: 0, total: 0 });


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
  }, [batchApiEndpoint]);

  // Fetch students when batch and date are selected
  useEffect(() => {
    if (selectedBatch) {
      fetchStudentsForAttendance();
    }
  }, [selectedBatch, selectedDate]);

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

  const fetchStudentsForAttendance = async () => {
    if (!selectedBatch || !selectedDate) return;

    setLoading(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      const response = await fetch(`/api/attendance?batchId=${selectedBatch}&date=${dateStr}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      
      const data = await response.json();
      setStudents(data);
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
  };

  const handleAttendanceChange = (studentId: string, isPresent: boolean) => {
    setStudents(prev => prev.map(student => 
      student.studentId === studentId ? { ...student, isPresent } : student
    ));
  };

  const handleMarkAll = (status: boolean) => {
    setStudents(prev => prev.map(student => ({ ...student, isPresent: status })));
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

    setLoading(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
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

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <Card className="shadow-lg rounded-xl border-0 bg-white overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-4">
          <CardTitle className="text-2xl font-bold text-gray-900">{title}</CardTitle>
          <CardDescription className="text-gray-600">{description}</CardDescription>
        </CardHeader>
        <CardContent>
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
                    className={`p-4 rounded-lg border ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
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
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            student.isPresent 
                              ? 'bg-green-500 text-white' 
                              : 'bg-gray-100 text-gray-700 hover:bg-green-100'
                          }`}
                        >
                          Present
                        </button>
                        <button
                          onClick={() => handleAttendanceChange(student.studentId, false)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            !student.isPresent 
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
    </div>
  );
};

export default AttendanceComponent;