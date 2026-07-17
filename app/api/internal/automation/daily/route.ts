import { NextResponse } from "next/server";
import { runOperationalAutomation } from "@/lib/operational-automation";

export async function POST(req: Request) {
  const expected = process.env.CRON_SECRET;
  const supplied = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || req.headers.get("x-cron-secret");
  if (!expected || supplied !== expected) return new NextResponse("Unauthorized", { status: 401 });
  try { return NextResponse.json(await runOperationalAutomation()); }
  catch (error) { console.error("[DAILY_AUTOMATION]", error); return new NextResponse("Automation failed", { status: 500 }); }
}
