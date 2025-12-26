import { db } from "@/lib/db";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const session = await auth();

        if (!session || !session.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const batches = await db.batch.findMany({
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                teacher: {
                    select: {
                        name: true
                    }
                }
            }
        });

        return NextResponse.json(batches);

    } catch (error) {
        console.log("[BATCHES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
