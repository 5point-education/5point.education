import { NotificationDeliveryStatus, NotificationEventType, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { WhatsAppService } from "@/lib/whatsapp-service";

type SendAction = () => Promise<boolean>;

export async function sendTrackedWhatsApp(input: {
  eventType: NotificationEventType;
  dedupeKey: string;
  phone: string;
  message: string;
  recipientUserId?: string;
  metadata?: Record<string, unknown>;
  send: SendAction;
}) {
  try {
    await db.notificationDelivery.create({ data: { eventType: input.eventType, status: NotificationDeliveryStatus.SKIPPED, dedupeKey: input.dedupeKey, recipientPhone: input.phone, recipientUserId: input.recipientUserId, message: input.message, metadata: input.metadata as Prisma.InputJsonValue | undefined } });
  } catch (error: any) {
    if (error?.code === "P2002") return false;
    throw error;
  }
  try {
    const sent = await input.send();
    await db.notificationDelivery.update({ where: { dedupeKey: input.dedupeKey }, data: { status: sent ? NotificationDeliveryStatus.SENT : NotificationDeliveryStatus.FAILED, sentAt: sent ? new Date() : null, errorMessage: sent ? null : "WhatsApp provider did not accept the message" } });
    return sent;
  } catch (error) {
    await db.notificationDelivery.update({ where: { dedupeKey: input.dedupeKey }, data: { status: NotificationDeliveryStatus.FAILED, errorMessage: error instanceof Error ? error.message : "Unknown notification error" } });
    return false;
  }
}

export async function sendTrackedAbsence(phone: string, studentName: string, date: string, dedupeKey: string) {
  return sendTrackedWhatsApp({ eventType: NotificationEventType.ABSENCE_ALERT, dedupeKey, phone, message: `Absence alert for ${studentName} on ${date}`, send: () => WhatsAppService.sendAbsenceNotification(phone, studentName, date) });
}
