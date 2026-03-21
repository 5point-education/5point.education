import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Role, NoticeScope, NoticePriority } from "@prisma/client";

// GET /api/student/notices - List notices for current student
export async function GET(req: Request) {
  try {
    const supabase = createAdminClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userRole = user.user_metadata.role as Role;

    // Only students can use this endpoint
    if (userRole !== Role.STUDENT) {
      return new NextResponse("This endpoint is for students only", { status: 403 });
    }

    // Get student profile
    const studentProfile = await db.studentProfile.findUnique({
      where: { userId: user.id },
      include: {
        admissions: {
          where: { status: "ACTIVE" },
          select: { batchId: true }
        }
      }
    });

    if (!studentProfile) {
      return new NextResponse("Student profile not found", { status: 404 });
    }

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Get batch IDs for this student
    const batchIds = studentProfile.admissions
      .map(a => a.batchId)
      .filter((id): id is string => id !== null);

    const now = new Date();

    // Build query - student sees:
    // 1. GLOBAL notices
    // 2. BATCH notices for their batches
    // 3. INDIVIDUAL notices targeted to them
    const where = {
      isDeleted: false,
      OR: [
        { expiresAt: null },
        { expiresAt: { gte: now } }
      ],
      AND: [
        {
          OR: [
            // Global notices
            { scope: NoticeScope.GLOBAL },
            // Batch notices for student's batches
            {
              scope: NoticeScope.BATCH,
              batchId: { in: batchIds }
            },
            // Individual notices for this student
            {
              scope: NoticeScope.INDIVIDUAL,
              recipients: {
                some: { studentId: studentProfile.id }
              }
            }
          ]
        }
      ]
    };

    // Get total count
    const total = await db.notice.count({ where });
    const latestNotice = await db.notice.findFirst({
      where,
      orderBy: { createdAt: "desc" },
      select: { createdAt: true }
    });

    // Get notices ordered by priority (URGENT > HIGH > NORMAL) then by date
    const notices = await db.notice.findMany({
      where,
      skip,
      take: limit,
      orderBy: [
        { priority: "desc" }, // URGENT > HIGH > NORMAL (alphabetically desc)
        { createdAt: "desc" }
      ],
      include: {
        creator: {
          select: { name: true, role: true }
        },
        batch: {
          select: { id: true, name: true, subject: true }
        }
      }
    });

    // Format response with user-friendly info
    const formattedNotices = notices.map(notice => ({
      id: notice.id,
      title: notice.title,
      body: notice.body,
      priority: notice.priority,
      expiresAt: notice.expiresAt,
      createdAt: notice.createdAt,
      // User-friendly source info
      source: notice.scope === NoticeScope.GLOBAL 
        ? "All Students" 
        : notice.scope === NoticeScope.BATCH 
          ? `Batch: ${notice.batch?.name || "Unknown"}` 
          : "To: You",
      createdBy: notice.creator.name
    }));

    return NextResponse.json({
      notices: formattedNotices,
      metadata: {
        latestNoticeCreatedAt: latestNotice?.createdAt ?? null
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("[STUDENT_NOTICES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
