import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user || user.user_metadata.role !== Role.STUDENT) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const studentProfile = await db.studentProfile.findUnique({
      where: { userId: user.id }
    });

    if (!studentProfile) {
      return new NextResponse("Student profile not found", { status: 404 });
    }

    const payments = await db.payment.findMany({
      where: { studentId: studentProfile.id },
      include: {
        admission: {
          include: {
            batch: {
              select: {
                name: true,
                subject: true,
              }
            }
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    const formatted = payments.map(p => ({
      id: p.id,
      amount: p.amount,
      date: p.date.toISOString(),
      mode: p.mode,
      receipt_no: p.receipt_no,
      coveredMonths: p.coveredMonths,
      notes: p.notes,
      batchName: p.admission?.batch
        ? `${p.admission.batch.name} - ${p.admission.batch.subject}`
        : 'N/A',
    }));

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    return NextResponse.json({
      payments: formatted,
      summary: {
        totalPaid,
        totalPayments: payments.length,
      }
    });

  } catch (error) {
    console.log("[STUDENT_PAYMENTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
