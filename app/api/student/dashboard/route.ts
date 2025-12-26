import { db } from "@/lib/db";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const session = await auth();

    if (!session || !session.user || session.user.role !== Role.STUDENT) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 1. Get Student Profile ID
    const studentProfile = await db.studentProfile.findUnique({
      where: { userId: session.user.id }
    });

    if (!studentProfile) {
      return new NextResponse("Student profile not found", { status: 404 });
    }

    // 2. Get Admissions (for Fees & Batch info)
    const admissions = await db.admission.findMany({
      where: { studentId: studentProfile.id },
      include: {
        batch: true
      },
      orderBy: { createdAt: 'desc' } // Latest first
    });

    // Calculate Pending Fees & Next Class
    const pendingFees = admissions.reduce((sum, adm) => sum + adm.fees_pending, 0);

    // Simplistic Logic for "Next Class": Take schedule from latest batch
    let nextClass = "Not Assigned";
    if (admissions.length > 0 && admissions[0].batch) {
      nextClass = admissions[0].batch.schedule;
    } else if (studentProfile.service_type === "HOME_TUTOR") {
      nextClass = "Home Tutor Schedule"; // Placeholder, real app might have calendar
    }

    // 3. Get Exam Results
    const results = await db.result.findMany({
      where: { studentId: studentProfile.id },
      include: {
        exam: {
          include: {
            batch: true
          }
        }
      },
      orderBy: {
        exam: { date: 'desc' }
      }
    });

    const totalExams = results.length;

    // Calculate Average Percentage
    let totalPercentage = 0;
    results.forEach(r => {
      totalPercentage += (r.score / r.exam.total_marks) * 100;
    });
    const averageScore = totalExams > 0 ? (totalPercentage / totalExams).toFixed(1) : "0";

    // Format for Chart (Oldest to Newest)
    const performanceData = [...results].reverse().map(r => ({
      examName: r.exam.name,
      score: r.score,
      totalMarks: r.exam.total_marks,
      date: r.exam.date.toISOString(),
    }));

    // Format for Table (Newest to Oldest)
    const recentResults = results.map(r => ({
      id: r.id,
      examName: r.exam.name,
      subject: r.exam.batch.subject, // Assuming batch subject. Exam name usually has context too.
      score: r.score,
      totalMarks: r.exam.total_marks,
      remarks: r.remarks,
      date: r.exam.date.toISOString(),
    }));

    return NextResponse.json({
      overview: {
        totalExams,
        averageScore,
        pendingFees,
        nextClass
      },
      performanceData,
      recentResults
    });

  } catch (error) {
    console.log("[STUDENT_DASHBOARD_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
