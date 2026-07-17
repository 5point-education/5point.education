import { Role, PaymentKind } from "@prisma/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/server";

function dateBounds(fromValue: string | null, toValue: string | null) {
  const from = fromValue ? new Date(`${fromValue}T00:00:00.000Z`) : new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));
  const to = toValue ? new Date(`${toValue}T23:59:59.999Z`) : new Date();
  return { gte: from, lte: to };
}

function toCsv(rows: Array<Record<string, unknown>>) {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  return [keys.join(","), ...rows.map((row) => keys.map((key) => JSON.stringify(row[key] ?? "")).join(","))].join("\n");
}

export async function GET(req: Request) {
  try {
    const supabase = createAdminClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user || user.user_metadata.role !== Role.ADMIN) return new NextResponse("Unauthorized", { status: 401 });
    const params = new URL(req.url).searchParams;
    const bounds = dateBounds(params.get("from"), params.get("to"));
    const report = params.get("report") || "summary";
    const [activeStudents, activeBatches, activeTeachers, admissions, payments, attendance, pending, enquiries] = await Promise.all([
      db.studentProfile.count({ where: { user: { is_active: true } } }),
      db.batch.count({ where: { isActive: true } }),
      db.user.count({ where: { role: Role.TEACHER, is_active: true } }),
      db.admission.findMany({ where: { createdAt: bounds }, select: { status: true, createdAt: true, batch: { select: { name: true, subject: true } } } }),
      db.payment.findMany({ where: { date: bounds, kind: { not: PaymentKind.ADMISSION_CHARGE } }, select: { amount: true, date: true, kind: true, admission: { select: { batch: { select: { name: true } } } } } }),
      db.attendance.findMany({ where: { date: bounds }, select: { date: true, status: true, batch: { select: { name: true } } } }),
      db.admission.aggregate({ where: { status: "ACTIVE" }, _sum: { fees_pending: true } }),
      db.enquiry.findMany({ where: { createdAt: bounds }, select: { status: true, service_type: true, subjects: true } }),
    ]);
    const admissionStatus = admissions.reduce<Record<string, number>>((acc, item) => { acc[item.status] = (acc[item.status] || 0) + 1; return acc; }, {});
    const sourceDemand = enquiries.reduce<Record<string, number>>((acc, item) => { const key = item.service_type || "Unknown"; acc[key] = (acc[key] || 0) + 1; return acc; }, {});
    const subjectDemand = enquiries.reduce<Record<string, number>>((acc, item) => { item.subjects.split(",").map((subject) => subject.trim()).filter(Boolean).forEach((subject) => { acc[subject] = (acc[subject] || 0) + 1; }); return acc; }, {});
    const collection = payments.reduce((sum, item) => sum + item.amount, 0);
    const present = attendance.filter((item) => item.status).length;
    const table = report === "admissions" ? admissions.map((item) => ({ date: item.createdAt.toISOString().slice(0, 10), status: item.status, batch: item.batch?.name || "Unassigned", subject: item.batch?.subject || "" })) : report === "attendance" ? attendance.map((item) => ({ date: item.date.toISOString().slice(0, 10), batch: item.batch.name, status: item.status ? "Present" : "Absent" })) : report === "fees" ? payments.map((item) => ({ date: item.date.toISOString().slice(0, 10), batch: item.admission?.batch?.name || "Unallocated", amount: item.amount, kind: item.kind })) : Object.entries(sourceDemand).map(([source, count]) => ({ source, count }));
    const payload = { filters: { from: bounds.gte.toISOString().slice(0, 10), to: bounds.lte.toISOString().slice(0, 10) }, kpis: { activeStudents, activeBatches, activeTeachers, admissions: admissions.length, collection, pending: pending._sum.fees_pending || 0, attendanceRate: attendance.length ? Math.round((present / attendance.length) * 10000) / 100 : 0 }, admissionStatus, sourceDemand, subjectDemand, table };
    if (params.get("format") === "csv") return new NextResponse(toCsv(table), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename=5-point-${report}.csv` } });
    return NextResponse.json(payload);
  } catch (error) { console.error("[ADMIN_REPORTS_GET]", error); return new NextResponse("Internal Error", { status: 500 }); }
}
