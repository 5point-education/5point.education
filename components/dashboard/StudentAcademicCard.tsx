"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, GraduationCap, Target, BarChart3, Loader2 } from "lucide-react";

type ProfileData = {
  profile: {
    stream?: string | null;
    aspirant_of?: string | null;
    board?: string | null;
    class_level?: number | null;
    subjects?: string | null;
    service_type?: string;
    phone?: string;
    fatherName?: string | null;
    motherName?: string | null;
    parentMobile?: string | null;
  };
  batches: { id: string; name: string; subject: string; schedule: string }[];
  performanceSummary: {
    totalExams: number;
    averageScore: number | null;
  };
};

export function StudentAcademicCard() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/student/profile");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.error("Failed to fetch student profile", e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <Card className="rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const { profile, batches, performanceSummary } = data;
  const subjectsList = profile.subjects ? profile.subjects.split(",").map((s) => s.trim()).filter(Boolean) : [];

  return (
    <Card className="rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          Academic & Enrolment
        </CardTitle>
        <CardDescription>Your batches, stream, and performance at a glance.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {(profile.class_level != null || profile.stream || profile.aspirant_of || profile.board) && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Academic details</h4>
            <div className="flex flex-wrap gap-2">
              {profile.class_level != null && (
                <Badge variant="secondary">Class {profile.class_level}</Badge>
              )}
              {profile.stream && <Badge variant="secondary">{profile.stream}</Badge>}
              {profile.aspirant_of && (
                <Badge variant="default" className="bg-primary/90">
                  <Target className="h-3 w-3 mr-1" />
                  {profile.aspirant_of}
                </Badge>
              )}
              {profile.board && <Badge variant="outline">{profile.board}</Badge>}
            </div>
          </div>
        )}

        {subjectsList.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Subjects</h4>
            <p className="text-sm text-foreground">{profile.subjects}</p>
          </div>
        )}

        {batches.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Enrolled batches</h4>
            <ul className="space-y-2">
              {batches.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50"
                >
                  <BookOpen className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{b.name}</p>
                    <p className="text-xs text-muted-foreground">{b.subject} · {b.schedule}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(performanceSummary.totalExams > 0 || performanceSummary.averageScore != null) && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">
                  {performanceSummary.totalExams} exam{performanceSummary.totalExams !== 1 ? "s" : ""} taken
                  {performanceSummary.averageScore != null && (
                    <> · {performanceSummary.averageScore}% average</>
                  )}
                </span>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/student/analytics">View analytics</Link>
              </Button>
            </div>
          </div>
        )}

        {batches.length === 0 && !profile.stream && !profile.aspirant_of && !profile.subjects && performanceSummary.totalExams === 0 && (
          <p className="text-sm text-muted-foreground">No academic details yet. Complete your profile or get enrolled in a batch.</p>
        )}
      </CardContent>
    </Card>
  );
}
