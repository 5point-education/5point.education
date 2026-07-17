import { NoticeScope, Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(_req: Request, { params }: { params: { noticeId: string } }) {
  try {
    const supabase = createAdminClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user || user.user_metadata.role !== Role.STUDENT) return new NextResponse("Unauthorized", { status: 401 });
    const profile = await db.studentProfile.findUnique({ where: { userId: user.id }, include: { admissions: { where: { status: "ACTIVE" }, select: { batchId: true } } } });
    const notice = await db.notice.findUnique({ where: { id: params.noticeId }, select: { id: true, scope: true, batchId: true, isDeleted: true, expiresAt: true, recipients: { where: { studentId: profile?.id }, select: { studentId: true } } } });
    if (!profile || !notice || notice.isDeleted || (notice.expiresAt && notice.expiresAt < new Date())) return new NextResponse("Notice not found", { status: 404 });
    const batchIds = profile.admissions.map((admission) => admission.batchId).filter((id): id is string => Boolean(id));
    const allowed = notice.scope === NoticeScope.GLOBAL || (notice.scope === NoticeScope.BATCH && Boolean(notice.batchId && batchIds.includes(notice.batchId))) || (notice.scope === NoticeScope.INDIVIDUAL && notice.recipients.length > 0);
    if (!allowed) return new NextResponse("Notice is not addressed to this student", { status: 403 });
    const recipient = await db.noticeRecipient.upsert({ where: { noticeId_studentId: { noticeId: notice.id, studentId: profile.id } }, update: { acknowledgedAt: new Date() }, create: { noticeId: notice.id, studentId: profile.id, acknowledgedAt: new Date() } });
    return NextResponse.json({ success: true, acknowledgedAt: recipient.acknowledgedAt });
  } catch (error) {
    console.error("[NOTICE_ACK_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
