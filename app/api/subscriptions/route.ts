import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

// POST: Create a student subscription (ADMIN or RECEPTIONIST)
export async function POST(req: Request) {
    try {
        const supabase = createAdminClient();
        const {
            data: { user },
            error,
        } = await supabase.auth.getUser();

        if (
            error ||
            !user ||
            (user.user_metadata.role !== Role.ADMIN &&
                user.user_metadata.role !== Role.RECEPTIONIST)
        ) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { studentId, tierId } = body;

        if (!studentId || !tierId) {
            return new NextResponse("studentId and tierId are required", {
                status: 400,
            });
        }

        // Verify the tier exists and is active
        const tier = await db.subscriptionTier.findUnique({
            where: { id: tierId },
        });
        if (!tier) {
            return new NextResponse("Subscription tier not found", {
                status: 404,
            });
        }
        if (!tier.isActive) {
            return new NextResponse("This subscription tier is disabled", {
                status: 400,
            });
        }

        // Deactivate any existing active subscriptions for this student
        await db.studentSubscription.updateMany({
            where: { studentId, isActive: true },
            data: { isActive: false },
        });

        // Calculate endDate
        const startDate = new Date();
        let endDate: Date | null = null;
        if (tier.durationMonths !== null) {
            endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + tier.durationMonths);
        }

        const subscription = await db.studentSubscription.create({
            data: {
                studentId,
                tierId,
                startDate,
                endDate,
                isActive: true,
            },
            include: {
                tier: true,
            },
        });

        return NextResponse.json(subscription);
    } catch (error) {
        console.log("[SUBSCRIPTIONS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
