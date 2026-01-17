"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { Search, User, Phone, GraduationCap } from "lucide-react";

interface Student {
  admissionId: string;
  studentId: string;
  name: string;
  email: string;
  phone: string;
  parentName: string;
  joinDate: string;
}

interface Batch {
  id: string;
  name: string;
  subject: string;
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
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>(initialStudents);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);

  // Fetch students when batch is selected
  useEffect(() => {
    const fetchStudents = async () => {
      if (selectedBatch) {
        setLoading(true);
        try {
          const response = await fetch(`/api/batches/${selectedBatch}/students`);
          if (response.ok) {
            const data = await response.json();
            setStudents(data);
          } else {
            console.error("Failed to fetch students");
          }
        } catch (error) {
          console.error("Error fetching students:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setStudents([]);
      }
    };

    fetchStudents();
  }, [selectedBatch]);

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

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage);

  const handleBatchChange = (value: string) => {
    setSelectedBatch(value);
    setSearchTerm("");
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  return (
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
                    {batches.map((batch) => (
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
                        <TableHead>Parent/Guardian</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Join Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedStudents.map((student) => (
                        <TableRow key={student.studentId}>
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
                          <TableCell>{student.parentName || "-"}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <GraduationCap className="mr-2 h-4 w-4 text-muted-foreground" />
                              {student.email}
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(student.joinDate)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => alert(`Student details would be shown here for: ${student.name}`)}
                              disabled
                            >
                              View
                            </Button>
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
            Please select a batch to view students
          </div>
        )}
      </CardContent>
    </Card>
  );
}