"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Check, Loader2 } from "lucide-react";

type DuplicateGroup = {
  groupId: string;
  studentName: string;
  email: string;
  subject: string;
  admissions: Array<{ id: string; admission_date: string; batch: { name: string; subject: string; isActive: boolean } | null }>;
};

export default function AdmissionsReviewPage() {
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admissions/duplicates");
      if (!response.ok) throw new Error(await response.text());
      setGroups(await response.json());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load duplicate admissions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const keep = async (groupId: string, keepAdmissionId: string) => {
    setSaving(keepAdmissionId);
    try {
      const response = await fetch("/api/admissions/duplicates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keepAdmissionId }) });
      if (!response.ok) throw new Error(await response.text());
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resolve duplicate");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admission Review</h1>
        <p className="text-muted-foreground">Review students enrolled in more than one batch for the same subject.</p>
      </div>
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {loading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div> : groups.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No duplicate active subject enrollments need review.</CardContent></Card>
      ) : groups.map((group) => (
        <Card key={group.groupId}>
          <CardHeader><CardTitle className="flex flex-wrap items-center gap-3"><AlertTriangle className="h-5 w-5 text-amber-600" />{group.studentName}<Badge variant="outline">{group.subject}</Badge></CardTitle><p className="text-sm text-muted-foreground">{group.email}</p></CardHeader>
          <CardContent className="space-y-3">
            {group.admissions.map((admission) => <div key={admission.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"><div><div className="font-medium">{admission.batch?.name || "Unassigned batch"}</div><div className="text-xs text-muted-foreground">Enrolled {new Date(admission.admission_date).toLocaleDateString("en-IN")}</div></div><Button size="sm" onClick={() => keep(group.groupId, admission.id)} disabled={saving !== null}><Check className="mr-2 h-4 w-4" />{saving === admission.id ? "Saving..." : "Keep this batch"}</Button></div>)}
            <p className="text-xs text-muted-foreground">Choosing a batch withdraws the other duplicate active enrollments. No payment or historical record is deleted.</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
