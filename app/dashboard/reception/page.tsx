"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, UserPlus, ClipboardList } from "lucide-react";
import { format } from "date-fns";

interface Enquiry {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  class_level: number;
  subjects: string;
  service_type: string;
  status: string;
  follow_up_date: string | null;
  lost_reason: string | null;
  createdAt: string;
}

export default function ReceptionDashboard() {
  const router = useRouter();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const [subjectFilter, setSubjectFilter] = useState<string>("");
  const [classFilter, setClassFilter] = useState<string>("");

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const fetchEnquiries = async () => {
    try {
      const response = await fetch("/api/enquiry");
      const data = await response.json();
      setEnquiries(data);
    } catch (error) {
      console.error("Error fetching enquiries:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEnquiries = enquiries
    .filter(e => {
      if (filter !== "ALL" && e.status !== filter) return false;
      if (subjectFilter && !e.subjects.toLowerCase().includes(subjectFilter.toLowerCase())) return false;
      if (classFilter && e.class_level !== parseInt(classFilter)) return false;
      return true;
    });

  const stats = {
    total: enquiries.length,
    pending: enquiries.filter(e => e.status === "PENDING").length,
    discussed: enquiries.filter(e => e.status === "FEES_DISCUSSED").length,
    admitted: enquiries.filter(e => e.status === "ADMITTED").length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-yellow-100 text-yellow-800";
      case "FEES_DISCUSSED": return "bg-blue-100 text-blue-800";
      case "ADMITTED": return "bg-green-100 text-green-800";
      case "LOST": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleEditStatus = (id: string) => {
    router.push(`/dashboard/reception/enquiry/${id}`);
  };

  const handleRegisterStudent = (id: string) => {
    router.push(`/dashboard/reception/admission?enquiryId=${id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reception Dashboard</h1>
          <p className="text-muted-foreground">Manage enquiries and student admissions</p>
        </div>
        <Button onClick={() => router.push("/dashboard/reception/admission")}>
          <UserPlus className="h-4 w-4 mr-2" />
          New Admission
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Enquiries</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Fees Discussed</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.discussed}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Admitted</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.admitted}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Enquiry Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Enquiry Tracker</CardTitle>
              <CardDescription>Manage and track all student enquiries</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Button
                variant={filter === "ALL" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("ALL")}
              >
                All
              </Button>
              <Button
                variant={filter === "PENDING" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("PENDING")}
              >
                Pending
              </Button>
              <Button
                variant={filter === "FEES_DISCUSSED" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("FEES_DISCUSSED")}
              >
                Discussed
              </Button>
              <Button
                variant={filter === "ADMITTED" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("ADMITTED")}
              >
                Admitted
              </Button>
              <input
                type="text"
                placeholder="Subject"
                value={subjectFilter}
                onChange={e => setSubjectFilter(e.target.value)}
                className="border rounded px-2 py-1 text-sm w-24 sm:w-32"
              />
              <select
                value={classFilter}
                onChange={e => setClassFilter(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="">Class</option>
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Name</TableHead>
                    <TableHead className="whitespace-nowrap">Enquiry date</TableHead>
                    <TableHead className="whitespace-nowrap">Phone</TableHead>
                    <TableHead className="whitespace-nowrap">Email</TableHead>
                    <TableHead className="whitespace-nowrap">Class</TableHead>
                    <TableHead className="whitespace-nowrap w-[90px] max-w-[90px]">Subjects</TableHead>
                    <TableHead className="whitespace-nowrap">Service</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="whitespace-nowrap">Follow-up</TableHead>
                    <TableHead className="whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEnquiries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        No enquiries found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEnquiries.map((enquiry) => (
                      <TableRow key={enquiry.id}>
                        <TableCell className="font-medium whitespace-nowrap">{enquiry.name}</TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap text-sm">
                          {enquiry.createdAt
                            ? format(new Date(enquiry.createdAt), "MMM dd, yyyy")
                            : "-"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{enquiry.phone}</TableCell>
                        <TableCell className="text-sm max-w-[120px] truncate">{enquiry.email || "-"}</TableCell>
                        <TableCell className="whitespace-nowrap">{enquiry.class_level}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[90px] truncate" title={enquiry.subjects}>
                          {enquiry.subjects}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <span className="text-xs">
                            {enquiry.service_type === "HOME_TUTOR" ? "Home" : "Batch"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs whitespace-nowrap ${getStatusColor(enquiry.status)}`}>
                            {enquiry.status.replace("_", " ")}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {enquiry.follow_up_date
                            ? format(new Date(enquiry.follow_up_date), "MMM dd, yyyy")
                            : "-"
                          }
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex gap-1 sm:gap-2 flex-wrap">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditStatus(enquiry.id)}
                              className="text-xs sm:text-sm"
                            >
                              Edit
                            </Button>
                            {enquiry.status !== "ADMITTED" && enquiry.status !== "LOST" && (
                              <Button
                                size="sm"
                                onClick={() => handleRegisterStudent(enquiry.id)}
                                className="text-xs sm:text-sm"
                              >
                                Register
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
