import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { WhatsAppService } from "@/lib/whatsapp-service";
import { calculatePendingFees } from "@/lib/fees-utils";

export async function POST(req: Request) {
  try {
    const supabase = createAdminClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user || (user.user_metadata.role !== Role.ADMIN && user.user_metadata.role !== Role.RECEPTIONIST)) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { admissionIds } = await req.json();

    if (!admissionIds || !Array.isArray(admissionIds)) {
      return new NextResponse("Missing admissionIds array", { status: 400 });
    }

    let successCount = 0;
    let failCount = 0;

    for (const admissionId of admissionIds) {
      // 1. Fetch admission details
      const admission = await db.admission.findUnique({
        where: { id: admissionId },
        include: {
          batch: true,
          student: {
            include: { user: true }
          },
          payments: {
            select: { coveredMonths: true }
          }
        }
      });

      if (!admission || !admission.batch) {
        failCount++;
        continue;
      }

      // 2. Calculate pending fees
      const pendingData = await calculatePendingFees(
        {
          ...admission,
          batch: admission.batch,
        },
        admission.selectedDays
      );

      // Only send if there is a pending amount > 0
      if (pendingData.pendingAmount > 0) {
        const phone = admission.student.parentMobile || admission.student.phone;
        
        if (phone) {
          const sent = await WhatsAppService.sendFeeReminder(
            phone,
            admission.student.user.name,
            pendingData.pendingAmount
          );
          
          if (sent) successCount++;
          else failCount++;
        } else {
          failCount++;
        }
      } else {
        // No pending fees, skip
      }
    }

    return NextResponse.json({ 
        success: true, 
        message: `Sent ${successCount} reminders, failed to send ${failCount} reminders.` 
    });

  } catch (error) {
    console.error("[FEES_REMIND_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
