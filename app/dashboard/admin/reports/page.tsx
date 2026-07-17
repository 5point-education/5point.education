"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Download, Loader2 } from "lucide-react";

type Report = { kpis: Record<string, number>; table: Array<Record<string, unknown>> };

export default function AdminReportsPage() {
  const today = new Date();
  const [from, setFrom] = useState(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`);
  const [to, setTo] = useState(today.toISOString().slice(0, 10));
  const [reportType, setReportType] = useState("summary");
  const [data, setData] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => { setLoading(true); const response = await fetch(`/api/admin/reports?from=${from}&to=${to}&report=${reportType}`); const payload = await response.json(); if (!response.ok) setError(payload); else { setData(payload); setError(""); } setLoading(false); }, [from, to, reportType]);
  useEffect(() => { load(); }, [load]);
  const download = () => { window.location.href = `/api/admin/reports?from=${from}&to=${to}&report=${reportType}&format=csv`; };
  return <div className="space-y-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-3xl font-bold">Reports</h1><p className="text-muted-foreground">Operational reporting across admissions, attendance and fees.</p></div><Button onClick={download} disabled={!data}><Download className="mr-2 h-4 w-4" />Export CSV</Button></div><Card><CardContent className="grid gap-4 p-5 md:grid-cols-3"><div><label className="text-sm font-medium">From</label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div><div><label className="text-sm font-medium">To</label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div><div><label className="text-sm font-medium">Report</label><Select value={reportType} onValueChange={setReportType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="summary">Executive summary</SelectItem><SelectItem value="admissions">Admissions</SelectItem><SelectItem value="attendance">Attendance</SelectItem><SelectItem value="fees">Fee collection</SelectItem></SelectContent></Select></div></CardContent></Card>{error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}{loading ? <Loader2 className="mx-auto my-12 h-8 w-8 animate-spin" /> : data && <><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">{Object.entries(data.kpis).map(([key, value]) => <Card key={key}><CardHeader className="pb-2"><CardTitle className="text-xs font-medium uppercase text-muted-foreground">{key.replace(/([A-Z])/g, " $1")}</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{value.toLocaleString("en-IN")}</CardContent></Card>)}</div><Card><CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />{reportType} data</CardTitle></CardHeader><CardContent><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left">{Object.keys(data.table[0] || {}).map((key) => <th className="p-2" key={key}>{key}</th>)}</tr></thead><tbody>{data.table.map((row, index) => <tr className="border-b" key={index}>{Object.values(row).map((value, cell) => <td className="p-2" key={cell}>{String(value)}</td>)}</tr>)}</tbody></table>{data.table.length === 0 && <p className="py-8 text-center text-muted-foreground">No records in this date range.</p>}</div></CardContent></Card></>}</div>;
}
