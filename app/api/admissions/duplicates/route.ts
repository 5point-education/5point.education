import { AdmissionStatus, Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recalculateAdmissionBalance } from "@/lib/fee-ledger";

async function authorized(req: Request) {
  const { createAdminClient } = await import("@/lib/supabase/server");
  const supabase = createAdminClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  const role = user?.user_metadata.role as Role | undefined;
  return error || !user || (role !== Role.ADMIN && role !== Role.RECEPTIONIST) ? null : user;
}

export async function GET(req: Request) {
  try {
    if (!await authorized(req)) return new NextResponse("Unauthorized", { status: 401 });
    const admissions = await db.admission.findMany({
      where: { status: AdmissionStatus.ACTIVE, activeSubjectKey: { not: null }, batchId: { not: null } },
      include: {
        student: { include: { user: { select: { name: true, email: true } } } },
        batch: { select: { id: true, name: true, subject: true, isActive: true } },
      },
      orderBy: [{ studentId: "asc" }, { activeSubjectKey: "asc" }, { admission_date: "asc" }],
    });
    const groups = new Map<string, { groupId: string; studentId: string; studentName: string; email: string; subject: string; admissions: typeof admissions }>();
    for (const admission of admissions) {
      if (!admission.batch || !admission.activeSubjectKey) continue;
      const groupId = `${admission.studentId}:${admission.activeSubjectKey}`;
      const group = groups.get(groupId) || {
        groupId,
        studentId: admission.studentId,
        studentName: admission.student.user.name,
        email: admission.student.user.email,
        subject: admission.batch.subject,
        admissions: [],
      };
      group.admissions.push(admission);
      groups.set(groupId, group);
    }
    return NextResponse.json(Array.from(groups.values()).filter((group) => group.admissions.length > 1));
  } catch (error) {
    console.error("[ADMISSION_DUPLICATES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const actor = await authorized(req);
    if (!actor) return new NextResponse("Unauthorized", { status: 401 });
    const { keepAdmissionId } = await req.json();
    if (!keepAdmissionId) return new NextResponse("keepAdmissionId is required", { status: 400 });
    const keep = await db.admission.findUnique({ where: { id: keepAdmissionId }, select: { studentId: true, activeSubjectKey: true, status: true } });
    if (!keep || keep.status !== AdmissionStatus.ACTIVE || !keep.activeSubjectKey) return new NextResponse("Admission is not an active duplicate", { status: 404 });

    const duplicateAdmissions = await db.admission.findMany({
      where: {
        studentId: keep.studentId,
        activeSubjectKey: keep.activeSubjectKey,
        status: AdmissionStatus.ACTIVE,
        id: { not: keepAdmissionId },
      },
      select: { id: true },
    });
    const result = await db.$transaction(async (tx) => {
      const withdrawn = await tx.admission.updateMany({
        where: {
          studentId: keep.studentId,
          activeSubjectKey: keep.activeSubjectKey,
          status: AdmissionStatus.ACTIVE,
          id: { not: keepAdmissionId },
        },
        data: { status: AdmissionStatus.WITHDRAWN, endDate: new Date(), activeSubjectKey: null },
      });
      return withdrawn.count;
    });
    await Promise.all(duplicateAdmissions.map((admission) => recalculateAdmissionBalance(admission.id)));
    return NextResponse.json({ success: true, withdrawn: result });
  } catch (error) {
    console.error("[ADMISSION_DUPLICATES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
