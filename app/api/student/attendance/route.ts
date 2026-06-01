import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

export async function GET(req: Request) {
    try {
        const supabase = createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user || user.user_metadata.role !== Role.STUDENT) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const studentProfile = await db.studentProfile.findUnique({
            where: {
                userId: user.id,
            },
        });

        if (!studentProfile) {
            return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
        }

        const attendance = await db.attendance.findMany({
            where: {
                studentId: studentProfile.id,
            },
            include: {
                batch: {
                    select: {
                        name: true,
                        subject: true,
                    },
                },
            },
            orderBy: {
                date: "desc",
            },
        });

        // Calculate statistics
        const total = attendance.length;
        const present = attendance.filter((a) => a.status).length;
        const absent = total - present;
        const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : "0";

        return NextResponse.json({
            attendance,
            stats: {
                total,
                present,
                absent,
                percentage,
            },
        });
    } catch (error) {
        console.error("Error fetching attendance:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
