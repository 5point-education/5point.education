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
  const [admittedOnly, setAdmittedOnly] = useState<boolean>(false);

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
      if (admittedOnly && e.status !== "ADMITTED") return false;
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
            <div className="flex gap-2 items-center">
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
              {/* Subject filter */}
              <input
                type="text"
                placeholder="Subject"
                value={subjectFilter}
                onChange={e => setSubjectFilter(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              />
              {/* Class filter */}
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
              {/* Admitted only toggle */}
              <label className="flex items-center space-x-1 text-sm">
                <input
                  type="checkbox"
                  checked={admittedOnly}
                  onChange={e => setAdmittedOnly(e.target.checked)}
                />
                <span>Admitted only</span>
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Subjects</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Follow-up</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEnquiries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No enquiries found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEnquiries.map((enquiry) => (
                    <TableRow key={enquiry.id}>
                      <TableCell className="font-medium">{enquiry.name}</TableCell>
                      <TableCell>{enquiry.phone}</TableCell>
                      <TableCell>{enquiry.email || "-"}</TableCell>
                      <TableCell>{enquiry.class_level}</TableCell>
                      <TableCell className="max-w-xs truncate">{enquiry.subjects}</TableCell>
                      <TableCell>
                        <span className="text-xs">
                          {enquiry.service_type === "HOME_TUTOR" ? "Home" : "Batch"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(enquiry.status)}`}>
                          {enquiry.status.replace("_", " ")}
                        </span>
                      </TableCell>
                      <TableCell>
                        {enquiry.follow_up_date
                          ? format(new Date(enquiry.follow_up_date), "MMM dd, yyyy")
                          : "-"
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditStatus(enquiry.id)}
                          >
                            Edit
                          </Button>
                          {enquiry.status !== "ADMITTED" && enquiry.status !== "LOST" && (
                            <Button
                              size="sm"
                              onClick={() => handleRegisterStudent(enquiry.id)}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
