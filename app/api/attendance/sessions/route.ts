import { AttendanceSessionType, Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/server";

async function getUser() {
  const supabase = createAdminClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  const role = user?.user_metadata.role as Role | undefined;
  return error || !user || (role !== Role.TEACHER && role !== Role.RECEPTIONIST && role !== Role.ADMIN) ? null : user;
}

export async function GET(req: Request) {
  const user = await getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const params = new URL(req.url).searchParams;
  const batchId = params.get("batchId");
  if (!batchId) return new NextResponse("batchId is required", { status: 400 });
  const batch = await db.batch.findUnique({ where: { id: batchId }, select: { teacherId: true } });
  if (!batch || (user.user_metadata.role === Role.TEACHER && batch.teacherId !== user.id)) return new NextResponse("Unauthorized", { status: 403 });
  const sessions = await db.attendanceSession.findMany({ where: { batchId }, orderBy: [{ date: "desc" }, { createdAt: "asc" }] });
  return NextResponse.json(sessions);
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const { batchId, date, label } = await req.json();
  if (!batchId || !date || !label?.trim()) return new NextResponse("batchId, date and label are required", { status: 400 });
  const batch = await db.batch.findUnique({ where: { id: batchId }, select: { teacherId: true } });
  if (!batch || (user.user_metadata.role === Role.TEACHER && batch.teacherId !== user.id)) return new NextResponse("Unauthorized", { status: 403 });
  const parsedDate = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsedDate.getTime())) return new NextResponse("Invalid date", { status: 400 });
  const session = await db.attendanceSession.create({ data: { batchId, date: parsedDate, type: AttendanceSessionType.EXTRA, label: label.trim(), createdById: user.id } });
  return NextResponse.json(session, { status: 201 });
}
