import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Role, EnquiryStatus } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const supabase = createAdminClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user || user.user_metadata.role !== Role.ADMIN) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Business KPIs
    const totalEnquiries = await db.enquiry.count();

    const admittedEnquiries = await db.enquiry.count({
      where: { status: EnquiryStatus.ADMITTED }
    });

    const revenueResult = await db.payment.aggregate({
      _sum: { amount: true }
    });
    const totalRevenue = revenueResult._sum.amount || 0;

    const revenueThisMonthResult = await db.payment.aggregate({
      _sum: { amount: true },
      where: { date: { gte: startOfMonth } }
    });
    const revenueThisMonth = revenueThisMonthResult._sum.amount || 0;

    const pendingFollowUpsCount = await db.enquiry.count({
      where: {
        status: { in: [EnquiryStatus.PENDING, EnquiryStatus.FEES_DISCUSSED] },
        follow_up_date: { lt: now }
      }
    });

    const conversionRate = totalEnquiries > 0
      ? parseFloat((((admittedEnquiries / totalEnquiries) * 100)).toFixed(1))
      : 0;

    // 2. Organization KPIs (all real DB counts)
    const totalStudents = await db.user.count({
      where: { role: Role.STUDENT }
    });

    const totalTeachers = await db.user.count({
      where: { role: Role.TEACHER }
    });

    const totalBatches = await db.batch.count({
      where: { isActive: true }
    });

    const outstandingResult = await db.admission.aggregate({
      _sum: {
        fees_pending: true,
        admission_charge_pending: true
      },
      where: { status: "ACTIVE" }
    });
    const outstandingDues =
      (outstandingResult._sum.fees_pending || 0) +
      (outstandingResult._sum.admission_charge_pending || 0);

    // 3. Overdue follow-ups (actionable list: who to call)
    const overdueFollowUps = await db.enquiry.findMany({
      where: {
        status: { in: [EnquiryStatus.PENDING, EnquiryStatus.FEES_DISCUSSED] },
        follow_up_date: { lt: now }
      },
      select: { id: true, name: true, phone: true, follow_up_date: true, status: true },
      orderBy: { follow_up_date: "asc" },
      take: 10
    });

    // 4. Recent enquiries (what’s new)
    const recentEnquiries = await db.enquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: 7,
      select: {
        id: true,
        name: true,
        phone: true,
        status: true,
        subjects: true,
        createdAt: true
      }
    });

    // 5. Lost Leads Analysis
    const lostLeadsRaw = await db.enquiry.groupBy({
      by: ["lost_reason"],
      where: {
        status: EnquiryStatus.LOST,
        lost_reason: { not: null }
      },
      _count: { lost_reason: true }
    });

    const lostLeadsData = lostLeadsRaw.map((item) => ({
      reason: item.lost_reason?.replace(/_/g, " ") || "Other",
      count: item._count.lost_reason
    }));

    // 6. Subject Demand
    const allEnquiries = await db.enquiry.findMany({
      select: { subjects: true }
    });
    const subjectCounts: Record<string, number> = {};
    allEnquiries.forEach((e) => {
      if (e.subjects) {
        e.subjects.split(",").map((s) => s.trim()).forEach((s) => {
          if (s) subjectCounts[s] = (subjectCounts[s] || 0) + 1;
        });
      }
    });
    const subjectDemandData = Object.entries(subjectCounts)
      .map(([subject, count]) => ({ subject, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return NextResponse.json({
      kpis: {
        totalRevenue,
        revenueThisMonth,
        conversionRate,
        totalEnquiries,
        pendingFollowUps: pendingFollowUpsCount,
        totalStudents,
        totalTeachers,
        totalBatches,
        outstandingDues
      },
      overdueFollowUps,
      recentEnquiries,
      lostLeadsData,
      subjectDemandData
    });
  } catch (error) {
    console.log("[ADMIN_ANALYTICS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
