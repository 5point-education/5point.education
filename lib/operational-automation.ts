import { NotificationDeliveryStatus, NotificationEventType, Role } from "@prisma/client";
import { db } from "@/lib/db";
import { recalculateAdmissionBalance } from "@/lib/fee-ledger";
import { sendTrackedWhatsApp } from "@/lib/notification-delivery";
import { WhatsAppService } from "@/lib/whatsapp-service";

function dayName(date: Date) { return ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][date.getDay()]; }

export async function runOperationalAutomation(now = new Date()) {
  const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  let sent = 0;
  const admissions = await db.admission.findMany({ where: { status: "ACTIVE" }, include: { student: { include: { user: true } }, batch: true } });
  for (const admission of admissions) {
    const canonicalPending = await recalculateAdmissionBalance(admission.id);
    if (canonicalPending !== null) admission.fees_pending = canonicalPending;
    const phone = admission.student.parentMobile || admission.student.phone;
    if (phone && admission.fees_pending > 0) {
      const ok = await sendTrackedWhatsApp({
        eventType: NotificationEventType.FEE_REMINDER,
        dedupeKey: `fee-reminder:${admission.id}:${monthKey}`,
        phone,
        recipientUserId: admission.student.userId,
        message: `Fee reminder for ${admission.student.user.name}: Rs ${admission.fees_pending.toFixed(2)} pending`,
        metadata: { admissionId: admission.id, amount: admission.fees_pending },
        send: () => WhatsAppService.sendFeeReminder(phone, admission.student.user.name, admission.fees_pending),
      });
      if (ok) sent += 1;
    }
  }

  const inactiveSince = new Date(now.getTime() - Number(process.env.INACTIVE_STUDENT_DAYS || 30) * 86400000);
  const inactiveStudents = await db.user.findMany({ where: { role: Role.STUDENT, is_active: true, lastActivityAt: { lte: inactiveSince } }, include: { studentProfile: true } });
  for (const student of inactiveStudents) {
    const phone = student.studentProfile?.parentMobile || student.studentProfile?.phone;
    if (!phone) continue;
    const ok = await sendTrackedWhatsApp({
      eventType: NotificationEventType.INACTIVE_STUDENT,
      dedupeKey: `inactive-student:${student.id}:${monthKey}`,
      phone,
      recipientUserId: student.id,
      message: `Learning activity reminder for ${student.name}`,
      send: () => WhatsAppService.sendAnnouncement(phone, "Learning activity reminder", "Please log in to check your latest updates."),
    });
    if (ok) sent += 1;
  }

  const oldNotices = await db.noticeRecipient.findMany({ where: { acknowledgedAt: null, notice: { isDeleted: false, createdAt: { lte: new Date(now.getTime() - 86400000) } } }, include: { notice: true, student: true } });
  for (const recipient of oldNotices) {
    const phone = recipient.student.parentMobile || recipient.student.phone;
    if (!phone) continue;
    const ok = await sendTrackedWhatsApp({
      eventType: NotificationEventType.NOTICE_ACK_REMINDER,
      dedupeKey: `notice-ack:${recipient.noticeId}:${recipient.studentId}`,
      phone,
      recipientUserId: recipient.student.userId,
      message: `Please acknowledge notice: ${recipient.notice.title}`,
      send: () => WhatsAppService.sendAnnouncement(phone, "Notice acknowledgement", `Please acknowledge: ${recipient.notice.title}`),
    });
    if (ok) sent += 1;
  }

  const scheduledBatches = await db.batch.findMany({ where: { isActive: true, schedule: { contains: dayName(now), mode: "insensitive" }, admissions: { some: { status: "ACTIVE" } } }, include: { teacher: true, admissions: { where: { status: "ACTIVE" }, select: { studentId: true } } } });
  for (const batch of scheduledBatches) {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const regular = await db.attendanceSession.findFirst({ where: { batchId: batch.id, date: start, type: "REGULAR" } });
    const count = regular ? await db.attendance.count({ where: { sessionId: regular.id } }) : 0;
    if (count >= batch.admissions.length) continue;
    await db.notificationDelivery.upsert({
      where: { dedupeKey: `missed-attendance:${batch.id}:${start.toISOString().slice(0, 10)}` },
      update: {},
      create: { eventType: NotificationEventType.MISSED_ATTENDANCE, status: NotificationDeliveryStatus.SKIPPED, dedupeKey: `missed-attendance:${batch.id}:${start.toISOString().slice(0, 10)}`, recipientUserId: batch.teacher.id, message: `Attendance is pending for ${batch.name}`, errorMessage: "Teacher phone number is not configured" },
    });
  }
  return { sent, inactiveStudents: inactiveStudents.length, notices: oldNotices.length, scheduledBatches: scheduledBatches.length };
}
