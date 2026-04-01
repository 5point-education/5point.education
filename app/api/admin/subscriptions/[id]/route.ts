import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

// PATCH: Update a subscription tier (ADMIN only)
export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createAdminClient();
        const {
            data: { user },
            error,
        } = await supabase.auth.getUser();

        if (error || !user || user.user_metadata.role !== Role.ADMIN) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const tierId = params.id;
        const body = await req.json();
        const { name, durationMonths, isActive, displayOrder } = body;

        // Verify tier exists
        const existing = await db.subscriptionTier.findUnique({
            where: { id: tierId },
        });
        if (!existing) {
            return new NextResponse("Subscription tier not found", {
                status: 404,
            });
        }

        // If renaming, check for duplicates
        if (name && name.trim() !== existing.name) {
            const duplicate = await db.subscriptionTier.findUnique({
                where: { name: name.trim() },
            });
            if (duplicate) {
                return new NextResponse(
                    "A tier with this name already exists",
                    { status: 409 }
                );
            }
        }

        // Build update data — only include provided fields
        const updateData: any = {};
        if (name !== undefined) updateData.name = name.trim();
        if (durationMonths !== undefined)
            updateData.durationMonths =
                durationMonths === null ? null : parseInt(durationMonths);
        if (isActive !== undefined) updateData.isActive = Boolean(isActive);
        if (displayOrder !== undefined)
            updateData.displayOrder = parseInt(displayOrder);

        const tier = await db.subscriptionTier.update({
            where: { id: tierId },
            data: updateData,
        });

        return NextResponse.json(tier);
    } catch (error) {
        console.log("[SUBSCRIPTION_TIERS_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
