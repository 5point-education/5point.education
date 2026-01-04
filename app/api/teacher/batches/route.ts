import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const supabase = createAdminClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user || (user.user_metadata.role !== Role.TEACHER && user.user_metadata.role !== Role.ADMIN)) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // If Admin, maybe show all? But strictly for "Teacher Dashboard", it implies "My Classes".
    // If Admin wants to see all, they use Admin Dashboard. 
    // So here we strictly filter by teacherId usually, but if the user IS an admin interacting as teacher?
    // Let's stick to: If Teacher, filter by their ID. If Admin, maybe they are debugging? 
    // Let's filter by user ID regardless to be safe for "My Classes" context.
    // Wait, if an Admin logs in, they might not start with a teacherProfile map.
    // Current design: User -> (optional) TeacherProfile.

    // Actually, `Batch.teacherId` is a FK to `User` table according to schema:
    // teacher    User        @relation(fields: [teacherId], references: [id])
    // So we just match session.user.id.

    const batches = await db.batch.findMany({
      where: {
        teacherId: user.id,
      },
      include: {
        _count: {
          select: {
            admissions: true,
            exams: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      }
    });

    const formattedBatches = batches.map(batch => ({
      id: batch.id,
      name: batch.name,
      subject: batch.subject,
      schedule: batch.schedule,
      capacity: batch.capacity,
      studentCount: batch._count.admissions,
      upcomingExams: batch._count.exams, // Simplification: Total exams for now, or filter by date?
      // Schema doesn't let us easily filter _count by date in top level findMany without select tricks.
      // For now, total exams is fine for the MVP status card.
    }));

    return NextResponse.json(formattedBatches);

  } catch (error) {
    console.log("[TEACHER_BATCHES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
