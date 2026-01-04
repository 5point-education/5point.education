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

    // 1. KPIs
    const totalEnquiries = await db.enquiry.count();

    const admittedEnquiries = await db.enquiry.count({
      where: { status: EnquiryStatus.ADMITTED }
    });

    const revenueResult = await db.payment.aggregate({
      _sum: { amount: true }
    });
    const totalRevenue = revenueResult._sum.amount || 0;

    const pendingFollowUps = await db.enquiry.count({
      where: {
        status: { in: [EnquiryStatus.PENDING, EnquiryStatus.FEES_DISCUSSED] },
        follow_up_date: {
          lt: new Date() // Past due
        }
      }
    });

    const conversionRate = totalEnquiries > 0
      ? ((admittedEnquiries / totalEnquiries) * 100).toFixed(1)
      : "0";

    // 2. Lost Leads Analysis
    // Group by lost_reason
    const lostLeadsRaw = await db.enquiry.groupBy({
      by: ['lost_reason'],
      where: {
        status: EnquiryStatus.LOST,
        lost_reason: { not: null }
      },
      _count: {
        lost_reason: true
      }
    });

    const lostLeadsData = lostLeadsRaw.map(item => ({
      reason: item.lost_reason?.replace("_", " ") || "Other",
      count: item._count.lost_reason
    }));

    // 3. Subject Demand
    // Since subjects is a string (e.g., "Physics, Math"), we need to process it.
    // Fetch all subjects string
    const enquiries = await db.enquiry.findMany({
      select: { subjects: true }
    });

    const subjectCounts: Record<string, number> = {};

    enquiries.forEach(e => {
      if (e.subjects) {
        // Split by comma, trim whitespace
        const subs = e.subjects.split(",").map(s => s.trim());
        subs.forEach(s => {
          if (s) {
            subjectCounts[s] = (subjectCounts[s] || 0) + 1;
          }
        });
      }
    });

    const subjectDemandData = Object.entries(subjectCounts)
      .map(([subject, count]) => ({ subject, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5

    return NextResponse.json({
      kpis: {
        totalRevenue,
        conversionRate,
        totalEnquiries,
        pendingFollowUps
      },
      lostLeadsData,
      subjectDemandData
    });

  } catch (error) {
    console.log("[ADMIN_ANALYTICS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
