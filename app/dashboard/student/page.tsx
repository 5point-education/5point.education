"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { BookOpen, TrendingUp, DollarSign, Calendar } from "lucide-react";
import { format } from "date-fns";

interface DashboardData {
  overview: {
    totalExams: number;
    averageScore: number;
    pendingFees: number;
    nextClass: string;
  };
  performanceData: Array<{
    examName: string;
    score: number;
    totalMarks: number;
    date: string;
  }>;
  recentResults: Array<{
    id: string;
    examName: string;
    subject: string;
    score: number;
    totalMarks: number;
    remarks: string;
    date: string;
  }>;
}

export default function StudentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/student/dashboard");
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  if (!data) {
    return <div className="text-center py-8">No data available</div>;
  }

  const chartData = data.performanceData.map((item) => ({
    name: item.examName,
    score: item.score,
    percentage: ((item.score / item.totalMarks) * 100).toFixed(1),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Student Dashboard</h1>
        <p className="text-muted-foreground">Track your academic progress and performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Total Exams</CardDescription>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-3xl">{data.overview.totalExams}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Average Score</CardDescription>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-3xl text-green-600">
              {data.overview.averageScore}%
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Pending Fees</CardDescription>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-3xl text-red-600">
              ₹{data.overview.pendingFees}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Next Class</CardDescription>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-lg">{data.overview.nextClass}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Trend</CardTitle>
          <CardDescription>Your exam scores over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="percentage" 
                  stroke="#1e40af" 
                  strokeWidth={2}
                  name="Score (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Results */}
      <Card>
        <CardHeader>
          <CardTitle>Exam Results History</CardTitle>
          <CardDescription>Your recent exam performances</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam Name</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recentResults.map((result) => (
                <TableRow key={result.id}>
                  <TableCell className="font-medium">{result.examName}</TableCell>
                  <TableCell>{result.subject}</TableCell>
                  <TableCell>
                    {result.score} / {result.totalMarks}
                  </TableCell>
                  <TableCell>
                    <span className={`font-semibold ${
                      (result.score / result.totalMarks) * 100 >= 75 
                        ? "text-green-600" 
                        : (result.score / result.totalMarks) * 100 >= 60 
                        ? "text-yellow-600" 
                        : "text-red-600"
                    }`}>
                      {((result.score / result.totalMarks) * 100).toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell>{format(new Date(result.date), "MMM dd, yyyy")}</TableCell>
                  <TableCell className="max-w-xs truncate">{result.remarks || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
