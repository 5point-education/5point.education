"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";

type Row = { admissionId: string; studentName: string; batchName: string; stored: number; canonical: number; difference: number };

export default function FeeReconciliationPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/fees/reconciliation");
    const data = await response.json();
    if (!response.ok) setMessage(data?.message || data || "Could not load reconciliation");
    else { setRows(data.rows || []); setMessage(""); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);
  const confirm = async () => {
    if (!window.confirm(`Update ${rows.length} stored fee balances from the canonical ledger?`)) return;
    const response = await fetch("/api/fees/reconciliation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirm: true }) });
    const data = await response.json();
    setMessage(response.ok ? `Updated ${data.updated} balances.` : data?.message || data || "Reconciliation failed");
    if (response.ok) await load();
  };
  return <div className="space-y-6"><div><h1 className="text-3xl font-bold">Fee Reconciliation</h1><p className="text-muted-foreground">Dry-run the stored batch balances before applying a correction.</p></div>{message && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{message}</div>}<Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle>{rows.length} stale balances</CardTitle><div className="flex gap-2"><Button variant="outline" onClick={load} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button><Button onClick={confirm} disabled={loading || rows.length === 0}>Apply correction</Button></div></CardHeader><CardContent>{loading ? <Loader2 className="mx-auto my-12 h-8 w-8 animate-spin" /> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-2">Student</th><th className="p-2">Batch</th><th className="p-2">Stored</th><th className="p-2">Canonical</th><th className="p-2">Difference</th></tr></thead><tbody>{rows.map((row) => <tr key={row.admissionId} className="border-b"><td className="p-2">{row.studentName}</td><td className="p-2">{row.batchName}</td><td className="p-2">Rs {row.stored.toFixed(2)}</td><td className="p-2">Rs {row.canonical.toFixed(2)}</td><td className="p-2">Rs {row.difference.toFixed(2)}</td></tr>)}</tbody></table></div>}</CardContent></Card></div>;
}
