import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Role, AdmissionStatus } from "@prisma/client";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user || (user.user_metadata.role !== Role.ADMIN && user.user_metadata.role !== Role.RECEPTIONIST)) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { action, endDate } = body;

    if (!action) {
      return new NextResponse("Action is required", { status: 400 });
    }

    const admissionId = params.id;

    // Find the admission
    const admission = await db.admission.findUnique({
      where: { id: admissionId },
      include: {
        student: {
          include: {
            user: {
              select: { name: true }
            }
          }
        },
        batch: {
          select: { name: true, subject: true }
        }
      }
    });

    if (!admission) {
      return new NextResponse("Admission not found", { status: 404 });
    }

    let result;

    if (action === "remove_from_batch" || action === "withdraw") {
      let parsedEndDate: Date | null = null;
      if (endDate) {
        parsedEndDate = new Date(endDate);
        if (Number.isNaN(parsedEndDate.getTime())) {
          return new NextResponse("Invalid endDate", { status: 400 });
        }
      }

      // Update admission status to WITHDRAWN
      result = await db.admission.update({
        where: { id: admissionId },
        data: {
          status: AdmissionStatus.WITHDRAWN,
          endDate: parsedEndDate ?? new Date()
        }
      });

      // Log the withdrawal
      const studentName = admission.student.user?.name || "Unknown Student";
      const batchName = admission.batch?.name || "Home Tutor";
      console.log(`Student ${studentName} removed from batch ${batchName} (Admission ID: ${admissionId})`);
    } else {
      return new NextResponse("Invalid action", { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.log("[ADMISSIONS_PATCH]", error);
    const message = error?.message || "Internal Error";
    return new NextResponse(message, { status: 500 });
  }
}