import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

// GET: Fetch all subscription tiers (sorted by displayOrder)
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const activeOnly = searchParams.get("active_only") === "true";

        const tiers = await db.subscriptionTier.findMany({
            where: activeOnly ? { isActive: true } : {},
            orderBy: { displayOrder: "asc" },
            include: {
                _count: {
                    select: { subscriptions: true },
                },
            },
        });

        return NextResponse.json(tiers);
    } catch (error) {
        console.log("[SUBSCRIPTION_TIERS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// POST: Create a new subscription tier (ADMIN only)
export async function POST(req: Request) {
    try {
        const supabase = createAdminClient();
        const {
            data: { user },
            error,
        } = await supabase.auth.getUser();

        if (error || !user || user.user_metadata.role !== Role.ADMIN) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { name, durationMonths, displayOrder } = body;

        if (!name || name.trim().length === 0) {
            return new NextResponse("Name is required", { status: 400 });
        }

        // Check for duplicates
        const existing = await db.subscriptionTier.findUnique({
            where: { name: name.trim() },
        });
        if (existing) {
            return new NextResponse("A tier with this name already exists", {
                status: 409,
            });
        }

        const tier = await db.subscriptionTier.create({
            data: {
                name: name.trim(),
                durationMonths:
                    durationMonths === null || durationMonths === undefined
                        ? null
                        : parseInt(durationMonths),
                displayOrder: displayOrder ? parseInt(displayOrder) : 0,
            },
        });

        return NextResponse.json(tier);
    } catch (error) {
        console.log("[SUBSCRIPTION_TIERS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
