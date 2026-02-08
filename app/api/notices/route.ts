import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Role, NoticeScope, NoticePriority } from "@prisma/client";

/** Parse expiry as end of day (23:59:59.999) when date-only YYYY-MM-DD is provided. */
function parseExpiresAtEndOfDay(expiresAt: string | null | undefined): Date | null {
  if (expiresAt == null || typeof expiresAt !== "string") return null;
  const s = expiresAt.trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d, 23, 59, 59, 999);
  }
  return new Date(expiresAt);
}

// POST /api/notices - Create a notice
export async function POST(req: Request) {
  try {
    const supabase = createAdminClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userRole = user.user_metadata.role as Role;

    // Only Admin, Receptionist, or Teacher can create notices
    if (userRole !== Role.ADMIN && userRole !== Role.RECEPTIONIST && userRole !== Role.TEACHER) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json();
    const { title, body: noticeBody, scope, priority = "NORMAL", expiresAt, batchId, studentIds } = body;

    // Validate required fields
    if (!title || !noticeBody || !scope) {
      return new NextResponse("Missing required fields: title, body, scope", { status: 400 });
    }

    // Validate scope enum
    if (!Object.values(NoticeScope).includes(scope)) {
      return new NextResponse("Invalid scope. Must be GLOBAL, BATCH, or INDIVIDUAL", { status: 400 });
    }

    // Teacher restrictions
    if (userRole === Role.TEACHER) {
      // Teacher can only create BATCH notices
      if (scope !== NoticeScope.BATCH) {
        return new NextResponse("Teachers can only create BATCH notices", { status: 403 });
      }

      // Verify teacher owns the batch
      if (!batchId) {
        return new NextResponse("Batch ID is required for BATCH scope", { status: 400 });
      }

      const batch = await db.batch.findFirst({
        where: {
          id: batchId,
          teacherId: user.id
        }
      });

      if (!batch) {
        return new NextResponse("You can only create notices for your own batches", { status: 403 });
      }
    }

    // Validate scope-specific requirements
    if (scope === NoticeScope.BATCH && !batchId) {
      return new NextResponse("Batch ID is required for BATCH scope", { status: 400 });
    }

    if (scope === NoticeScope.INDIVIDUAL && (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0)) {
      return new NextResponse("Student IDs are required for INDIVIDUAL scope", { status: 400 });
    }

    // If BATCH scope, verify batch exists
    if (scope === NoticeScope.BATCH) {
      const batch = await db.batch.findUnique({ where: { id: batchId } });
      if (!batch) {
        return new NextResponse("Batch not found", { status: 404 });
      }
    }

    // Create the notice
    const notice = await db.notice.create({
      data: {
        title,
        body: noticeBody,
        scope: scope as NoticeScope,
        priority: (priority as NoticePriority) || NoticePriority.NORMAL,
        expiresAt: parseExpiresAtEndOfDay(expiresAt),
        createdById: user.id,
        batchId: scope === NoticeScope.BATCH ? batchId : null,
        // Create recipients if INDIVIDUAL scope
        ...(scope === NoticeScope.INDIVIDUAL && {
          recipients: {
            create: studentIds.map((studentId: string) => ({
              studentId
            }))
          }
        })
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        batch: {
          select: { id: true, name: true, subject: true }
        },
        recipients: {
          include: {
            student: {
              include: {
                user: { select: { name: true, email: true } }
              }
            }
          }
        }
      }
    });

    return NextResponse.json(notice, { status: 201 });
  } catch (error) {
    console.error("[NOTICES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// GET /api/notices - List notices for staff
export async function GET(req: Request) {
  try {
    const supabase = createAdminClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userRole = user.user_metadata.role as Role;

    // Only Admin, Receptionist, or Teacher can view notices list
    if (userRole !== Role.ADMIN && userRole !== Role.RECEPTIONIST && userRole !== Role.TEACHER) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const showExpired = url.searchParams.get("showExpired") === "true";
    const scopeFilter = url.searchParams.get("scope");
    const priorityFilter = url.searchParams.get("priority");

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      isDeleted: false
    };

    // Teacher sees only their own notices
    if (userRole === Role.TEACHER) {
      where.createdById = user.id;
    }

    // Filter by scope if provided
    if (scopeFilter && Object.values(NoticeScope).includes(scopeFilter as NoticeScope)) {
      where.scope = scopeFilter;
    }

    // Filter by priority if provided
    if (priorityFilter && Object.values(NoticePriority).includes(priorityFilter as NoticePriority)) {
      where.priority = priorityFilter;
    }

    // Filter expired notices if not showing them
    if (!showExpired) {
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gte: new Date() } }
      ];
    }

    // Get total count
    const total = await db.notice.count({ where });

    // Get notices
    const notices = await db.notice.findMany({
      where,
      skip,
      take: limit,
      orderBy: [
        { createdAt: "desc" }
      ],
      include: {
        creator: {
          select: { id: true, name: true, email: true, role: true }
        },
        batch: {
          select: { id: true, name: true, subject: true }
        },
        _count: {
          select: { recipients: true }
        }
      }
    });

    // Add expired flag to each notice
    const now = new Date();
    const noticesWithExpiredFlag = notices.map(notice => ({
      ...notice,
      isExpired: notice.expiresAt ? notice.expiresAt < now : false
    }));

    return NextResponse.json({
      notices: noticesWithExpiredFlag,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("[NOTICES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
