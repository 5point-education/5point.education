import { db } from "@/lib/db";

interface SubscriptionAccessResult {
    hasAccess: boolean;
    status: "active" | "expired" | "none";
    subscription: {
        id: string;
        tierName: string;
        durationMonths: number | null;
        startDate: Date;
        endDate: Date | null;
        isUnlimited: boolean;
    } | null;
}

/**
 * Server-side utility to check if a student has an active subscription.
 * Used in API routes to gate access to premium features (e.g., analytics).
 */
export async function checkSubscriptionAccess(
    studentProfileId: string
): Promise<SubscriptionAccessResult> {
    const subscription = await db.studentSubscription.findFirst({
        where: {
            studentId: studentProfileId,
            isActive: true,
        },
        include: {
            tier: true,
        },
        orderBy: { createdAt: "desc" },
    });

    if (!subscription) {
        return { hasAccess: false, status: "none", subscription: null };
    }

    const now = new Date();
    const isExpired =
        subscription.endDate !== null && subscription.endDate < now;

    return {
        hasAccess: !isExpired,
        status: isExpired ? "expired" : "active",
        subscription: {
            id: subscription.id,
            tierName: subscription.tier.name,
            durationMonths: subscription.tier.durationMonths,
            startDate: subscription.startDate,
            endDate: subscription.endDate,
            isUnlimited: subscription.endDate === null,
        },
    };
}
