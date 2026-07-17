import { AccountAuditAction, Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { recordAccountAudit } from "@/lib/account-audit";

export async function POST(req: Request) {
  try {
    const supabase = createAdminClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return new NextResponse("Unauthorized", { status: 401 });
    const { action } = await req.json();
    const allowed: AccountAuditAction[] = [AccountAuditAction.LOGIN_SUCCESS, AccountAuditAction.PASSWORD_RESET_REQUESTED, AccountAuditAction.PASSWORD_RESET_COMPLETED];
    if (!allowed.includes(action)) return new NextResponse("Invalid audit action", { status: 400 });
    await recordAccountAudit({ action, userId: user.id, email: user.email, request: req });
    await import("@/lib/db").then(({ db }) => db.user.update({ where: { id: user.id }, data: { lastActivityAt: new Date() } }));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ACCOUNT_AUDIT_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
