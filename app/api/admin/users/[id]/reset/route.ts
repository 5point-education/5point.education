import { AccountAuditAction, Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/server";
import { getPasswordResetRedirect } from "@/lib/app-url";
import { recordAccountAudit } from "@/lib/account-audit";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createAdminClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    const actorRole = user?.user_metadata?.role as Role | undefined;
    if (error || !user || (actorRole !== Role.ADMIN && actorRole !== Role.RECEPTIONIST)) return new NextResponse("Unauthorized", { status: 401 });
    const target = await db.user.findUnique({ where: { id: params.id }, select: { id: true, email: true, role: true } });
    if (!target) return new NextResponse("User not found", { status: 404 });
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(target.email, { redirectTo: getPasswordResetRedirect(req) });
    if (resetError) return new NextResponse(resetError.message, { status: 502 });
    await recordAccountAudit({ action: AccountAuditAction.PASSWORD_RESET_REQUESTED, userId: target.id, actorId: user.id, email: target.email, request: req, metadata: { role: target.role } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN_RESET_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
