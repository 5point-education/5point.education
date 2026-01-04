import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const supabase = createAdminClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
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
