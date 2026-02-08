import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Role, NoticePriority } from "@prisma/client";

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

// PATCH /api/notices/[id] - Edit a notice
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userRole = user.user_metadata.role as Role;
    const noticeId = params.id;

    // Only Admin, Receptionist, or Teacher can edit notices
    if (userRole !== Role.ADMIN && userRole !== Role.RECEPTIONIST && userRole !== Role.TEACHER) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Find the notice
    const notice = await db.notice.findUnique({
      where: { id: noticeId }
    });

    if (!notice) {
      return new NextResponse("Notice not found", { status: 404 });
    }

    if (notice.isDeleted) {
      return new NextResponse("Notice has been deleted", { status: 404 });
    }

    // Only creator or Admin can edit
    if (notice.createdById !== user.id && userRole !== Role.ADMIN) {
      return new NextResponse("You can only edit your own notices", { status: 403 });
    }

    const body = await req.json();
    const { title, body: noticeBody, priority, expiresAt } = body;

    // Build update data (only allow editing title, body, priority, expiresAt)
    const updateData: any = {};
    
    if (title !== undefined) updateData.title = title;
    if (noticeBody !== undefined) updateData.body = noticeBody;
    if (priority !== undefined) {
      if (!Object.values(NoticePriority).includes(priority)) {
        return new NextResponse("Invalid priority. Must be NORMAL, HIGH, or URGENT", { status: 400 });
      }
      updateData.priority = priority;
    }
    if (expiresAt !== undefined) {
      updateData.expiresAt = parseExpiresAtEndOfDay(expiresAt);
    }

    const updatedNotice = await db.notice.update({
      where: { id: noticeId },
      data: updateData,
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        batch: {
          select: { id: true, name: true, subject: true }
        }
      }
    });

    return NextResponse.json(updatedNotice);
  } catch (error) {
    console.error("[NOTICES_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// DELETE /api/notices/[id] - Soft delete a notice
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userRole = user.user_metadata.role as Role;
    const noticeId = params.id;

    // Only Admin, Receptionist, or Teacher can delete notices
    if (userRole !== Role.ADMIN && userRole !== Role.RECEPTIONIST && userRole !== Role.TEACHER) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Find the notice
    const notice = await db.notice.findUnique({
      where: { id: noticeId }
    });

    if (!notice) {
      return new NextResponse("Notice not found", { status: 404 });
    }

    if (notice.isDeleted) {
      return new NextResponse("Notice already deleted", { status: 404 });
    }

    // Only creator or Admin can delete
    if (notice.createdById !== user.id && userRole !== Role.ADMIN) {
      return new NextResponse("You can only delete your own notices", { status: 403 });
    }

    // Soft delete
    await db.notice.update({
      where: { id: noticeId },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, message: "Notice deleted successfully" });
  } catch (error) {
    console.error("[NOTICES_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// GET /api/notices/[id] - Get a single notice
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userRole = user.user_metadata.role as Role;
    const noticeId = params.id;

    // Only Admin, Receptionist, or Teacher can view notices
    if (userRole !== Role.ADMIN && userRole !== Role.RECEPTIONIST && userRole !== Role.TEACHER) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const notice = await db.notice.findUnique({
      where: { id: noticeId },
      include: {
        creator: {
          select: { id: true, name: true, email: true, role: true }
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

    if (!notice) {
      return new NextResponse("Notice not found", { status: 404 });
    }

    if (notice.isDeleted) {
      return new NextResponse("Notice has been deleted", { status: 404 });
    }

    // Teacher can only view their own notices
    if (userRole === Role.TEACHER && notice.createdById !== user.id) {
      return new NextResponse("You can only view your own notices", { status: 403 });
    }

    return NextResponse.json(notice);
  } catch (error) {
    console.error("[NOTICES_GET_BY_ID]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
