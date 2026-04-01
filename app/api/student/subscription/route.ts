import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

// GET: Get the current student's active subscription
export async function GET() {
    try {
        const supabase = createAdminClient();
        const {
            data: { user },
            error,
        } = await supabase.auth.getUser();

        if (error || !user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Find the student profile for this user
        const studentProfile = await db.studentProfile.findUnique({
            where: { userId: user.id },
        });

        if (!studentProfile) {
            return new NextResponse("Student profile not found", {
                status: 404,
            });
        }

        // Get the latest active subscription
        const subscription = await db.studentSubscription.findFirst({
            where: {
                studentId: studentProfile.id,
                isActive: true,
            },
            include: {
                tier: true,
            },
            orderBy: { createdAt: "desc" },
        });

        if (!subscription) {
            return NextResponse.json({
                hasSubscription: false,
                subscription: null,
                status: "none",
            });
        }

        // Check if expired
        const now = new Date();
        const isExpired =
            subscription.endDate !== null && subscription.endDate < now;

        return NextResponse.json({
            hasSubscription: true,
            subscription: {
                id: subscription.id,
                tierName: subscription.tier.name,
                durationMonths: subscription.tier.durationMonths,
                startDate: subscription.startDate,
                endDate: subscription.endDate,
                isUnlimited: subscription.endDate === null,
            },
            status: isExpired ? "expired" : "active",
            daysRemaining: isExpired
                ? 0
                : subscription.endDate === null
                  ? null // unlimited
                  : Math.ceil(
                        (subscription.endDate.getTime() - now.getTime()) /
                            (1000 * 60 * 60 * 24)
                    ),
        });
    } catch (error) {
        console.log("[STUDENT_SUBSCRIPTION_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
