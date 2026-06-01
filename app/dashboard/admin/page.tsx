'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  IndianRupee,
  AlertCircle,
  UserCircle,
  GraduationCap,
  Layers,
  Wallet,
  Calendar,
  FileText,
  ArrowUpRight,
  X,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface AnalyticsData {
  kpis: {
    totalRevenue: number;
    revenueThisMonth: number;
    totalEnquiries: number;
    pendingFollowUps: number;
    totalStudents: number;
    totalTeachers: number;
    totalBatches: number;
    outstandingDues: number;
  };
  overdueFollowUps: Array<{
    id: string;
    name: string;
    phone: string;
    follow_up_date: string | null;
    status: string;
  }>;
  recentEnquiries: Array<{
    id: string;
    name: string;
    phone: string;
    status: string;
    subjects: string;
    createdAt: string;
  }>;
  lostLeadsData: Array<{ reason: string; count: number }>;
  subjectDemandData: Array<{ subject: string; count: number }>;
}

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

export default function AdminDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'all' | 'month' | 'custom'>('all');
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null,
  });
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    fetchAnalytics(dateRange, filterMode);
  }, [dateRange, filterMode]);

  const fetchAnalytics = async (range: { from: Date | null; to: Date | null }, mode: 'all' | 'month' | 'custom') => {
    try {
      setLoading(true);
      let url = '/api/admin/analytics';

      // Only add date params if not viewing all time
      if (mode !== 'all' && range.from && range.to) {
        const params = new URLSearchParams({
          from: range.from.toISOString(),
          to: range.to.toISOString(),
        });
        url = `/api/admin/analytics?${params}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to load');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (month: number, year: number) => {
    const from = new Date(year, month, 1);
    const to = endOfMonth(from);
    setSelectedMonth(from);
    setDateRange({ from, to });
    setShowMonthPicker(false);
  };

  const handleDateRangeApply = () => {
    if (startDate <= endDate) {
      setDateRange({ from: startDate, to: endDate });
      setShowDatePicker(false);
    }
  };

  const handleReset = () => {
    setFilterMode('all');
    setSelectedMonth(new Date());
    setStartDate(startOfMonth(new Date()));
    setEndDate(endOfMonth(new Date()));
    setDateRange({ from: null, to: null });
    setShowMonthPicker(false);
    setShowDatePicker(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (!data?.kpis) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Unable to load dashboard. Try again later.</p>
        </div>
      </div>
    );
  }

  const k = data.kpis;
  const overdue = data.overdueFollowUps ?? [];
  const recent = data.recentEnquiries ?? [];
  const lostLeads = data.lostLeadsData ?? [];
  const subjectDemand = data.subjectDemandData ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Filter */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1">Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Real-time business metrics and operational insights
              </p>
            </div>

            {/* Filter Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded-lg p-1 border border-gray-200 dark:border-slate-700">
                <Button
                  size="sm"
                  variant={filterMode === 'all' ? 'default' : 'ghost'}
                  className="text-xs h-8"
                  onClick={() => {
                    setFilterMode('all');
                    setDateRange({ from: null, to: null });
                    setShowMonthPicker(false);
                    setShowDatePicker(false);
                  }}
                >
                  All Time
                </Button>
                <Button
                  size="sm"
                  variant={filterMode === 'month' ? 'default' : 'ghost'}
                  className="text-xs h-8"
                  onClick={() => {
                    setFilterMode('month');
                    const from = startOfMonth(selectedMonth);
                    const to = endOfMonth(selectedMonth);
                    setDateRange({ from, to });
                    setShowDatePicker(false);
                  }}
                >
                  Month
                </Button>
                <Button
                  size="sm"
                  variant={filterMode === 'custom' ? 'default' : 'ghost'}
                  className="text-xs h-8"
                  onClick={() => {
                    setFilterMode('custom');
                    setDateRange({ from: startDate, to: endDate });
                    setShowMonthPicker(false);
                  }}
                >
                  Custom
                </Button>
              </div>

              {/* Month Filter */}
              {filterMode === 'month' && (
                <Popover open={showMonthPicker} onOpenChange={setShowMonthPicker}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="text-xs h-9 gap-2 bg-white dark:bg-slate-800">
                      <Calendar className="h-4 w-4" />
                      <span>{format(selectedMonth, 'MMM yyyy')}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-4" align="end">
                    <div className="space-y-3">
                      <div className="text-sm font-semibold">Select Month</div>
                      <div className="grid grid-cols-3 gap-2">
                        {Array.from({ length: 12 }).map((_, i) => (
                          <Button
                            key={i}
                            variant={selectedMonth.getMonth() === i ? 'default' : 'outline'}
                            size="sm"
                            className="text-xs"
                            onClick={() => handleMonthChange(i, new Date().getFullYear())}
                          >
                            {format(new Date(2024, i, 1), 'MMM')}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {/* Date Range Filter */}
              {filterMode === 'custom' && (
                <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="text-xs h-9 gap-2 bg-white dark:bg-slate-800">
                      <Calendar className="h-4 w-4" />
                      <span>{format(startDate, 'MMM d')} - {format(endDate, 'MMM d')}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-4" align="end">
                    <div className="space-y-3">
                      <div className="text-sm font-semibold">Select Date Range</div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Start Date</label>
                          <input
                            type="date"
                            value={format(startDate, 'yyyy-MM-dd')}
                            onChange={(e) => setStartDate(new Date(e.target.value))}
                            className="w-full mt-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">End Date</label>
                          <input
                            type="date"
                            value={format(endDate, 'yyyy-MM-dd')}
                            onChange={(e) => setEndDate(new Date(e.target.value))}
                            className="w-full mt-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="w-full text-xs h-8"
                        onClick={handleDateRangeApply}
                        disabled={startDate > endDate}
                      >
                        Apply
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {filterMode !== 'all' && (
                <Button variant="ghost" size="sm" className="text-xs h-9 px-2" onClick={handleReset} title="Show all data">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Key Metrics - Clean Grid Layout */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {/* Total Revenue */}
          <Card className="border-0 shadow-md hover:shadow-lg transition-all bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-slate-900">
            <CardHeader className="pb-3 pt-4 px-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                  <IndianRupee className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <CardDescription className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Total Revenue
                </CardDescription>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                ₹{(k.totalRevenue ?? 0).toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>

          {/* This Month Revenue */}
          <Card className="border-0 shadow-md hover:shadow-lg transition-all bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/30 dark:to-slate-900">
            <CardHeader className="pb-3 pt-4 px-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg">
                  <ArrowUpRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <CardDescription className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  This Month
                </CardDescription>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                ₹{(k.revenueThisMonth ?? 0).toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Pending Dues */}
          <Card className="border-0 shadow-md hover:shadow-lg transition-all bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/30 dark:to-slate-900">
            <CardHeader className="pb-3 pt-4 px-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/40 rounded-lg">
                  <Wallet className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <CardDescription className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Pending Dues
                </CardDescription>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                ₹{(k.outstandingDues ?? 0).toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Enquiries */}
          <Card className="border-0 shadow-md hover:shadow-lg transition-all bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/30 dark:to-slate-900">
            <CardHeader className="pb-3 pt-4 px-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                  <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <CardDescription className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Enquiries
                </CardDescription>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                {k.totalEnquiries ?? 0}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Secondary Metrics - Compact Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {/* Students */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 pt-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardDescription className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Students
                  </CardDescription>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                    {k.totalStudents ?? 0}
                  </CardTitle>
                </div>
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <GraduationCap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Teachers */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 pt-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardDescription className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Teachers
                  </CardDescription>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                    {k.totalTeachers ?? 0}
                  </CardTitle>
                </div>
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                  <UserCircle className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Batches */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 pt-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardDescription className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Batches
                  </CardDescription>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                    {k.totalBatches ?? 0}
                  </CardTitle>
                </div>
                <div className="p-2 bg-teal-50 dark:bg-teal-900/30 rounded-lg">
                  <Layers className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Pending Follow-ups */}
          <Card className={`border-0 shadow-sm hover:shadow-md transition-shadow ${(k.pendingFollowUps ?? 0) > 0 ? 'ring-1 ring-red-200 dark:ring-red-900/50' : ''}`}>
            <CardHeader className="pb-3 pt-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardDescription className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Pending Follow-ups
                  </CardDescription>
                  <CardTitle className={`text-xl font-bold ${(k.pendingFollowUps ?? 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                    {k.pendingFollowUps ?? 0}
                  </CardTitle>
                </div>
                <div className={`p-2 rounded-lg ${(k.pendingFollowUps ?? 0) > 0 ? 'bg-red-50 dark:bg-red-900/30' : 'bg-gray-50 dark:bg-gray-800'}`}>
                  <AlertCircle className={`h-4 w-4 ${(k.pendingFollowUps ?? 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`} />
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Overdue & Recent Enquiries */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {/* Overdue Follow-ups */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <Calendar className="h-4 w-4 text-red-500" />
                    Overdue Follow-ups
                  </CardTitle>
                  <CardDescription className="mt-1 text-xs">Enquiries needing immediate action</CardDescription>
                </div>
                {overdue.length > 0 && (
                  <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex bg-transparent text-xs h-8">
                    <Link href="/dashboard/reception">View all</Link>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {overdue.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-2">
                    <ArrowUpRight className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">All follow-ups on track!</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {overdue.slice(0, 5).map((o) => (
                    <li
                      key={o.id}
                      className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="min-w-0">
                        <Link href={`/dashboard/reception/enquiry/${o.id}`} className="font-medium text-sm text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 block truncate">
                          {o.name}
                        </Link>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{o.phone}</p>
                      </div>
                      <div className="text-right text-xs ml-2 flex-shrink-0">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {o.follow_up_date ? format(new Date(o.follow_up_date), 'MMM d') : '—'}
                        </p>
                        <span className="text-xs text-red-600 dark:text-red-400 uppercase font-semibold">
                          {o.status.replace('_', ' ')}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Recent Enquiries */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <FileText className="h-4 w-4 text-blue-500" />
                    Recent Enquiries
                  </CardTitle>
                  <CardDescription className="mt-1 text-xs">Latest leads requiring attention</CardDescription>
                </div>
                {recent.length > 0 && (
                  <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex bg-transparent text-xs h-8">
                    <Link href="/dashboard/reception">View all</Link>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {recent.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-2">
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">No enquiries yet</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {recent.slice(0, 5).map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <Link href={`/dashboard/reception/enquiry/${r.id}`} className="font-medium text-sm text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 block truncate">
                          {r.name}
                        </Link>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{r.subjects}</p>
                      </div>
                      <div className="text-right ml-2 flex-shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold inline-block ${r.status === 'ADMITTED'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : r.status === 'LOST'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                        >
                          {r.status.replace('_', ' ')}
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{format(new Date(r.createdAt), 'MMM d')}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Lost Leads Analysis */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3 pt-4">
              <CardTitle className="text-base font-semibold">Lost Leads Analysis</CardTitle>
              <CardDescription className="text-xs">Reasons leads were marked as lost</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {lostLeads.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">No lost leads data yet</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={lostLeads} margin={{ top: 15, right: 20, left: -15, bottom: 15 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="reason" stroke="#6b7280" style={{ fontSize: '11px' }} />
                      <YAxis stroke="#6b7280" style={{ fontSize: '11px' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: '1px solid #374151',
                          borderRadius: '6px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Subject Demand */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3 pt-4">
              <CardTitle className="text-base font-semibold">Subject Demand</CardTitle>
              <CardDescription className="text-xs">Most requested subjects in enquiries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {subjectDemand.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">No subject data yet</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={subjectDemand}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ subject, percent }) => `${subject}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {subjectDemand.map((entry, i) => (
                          <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: '1px solid #374151',
                          borderRadius: '6px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
