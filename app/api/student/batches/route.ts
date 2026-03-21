
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { AdmissionStatus, Role } from "@prisma/client";

export async function GET() {
  const supabase = createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.user_metadata?.role !== Role.STUDENT) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: user.id },
      include: {
        admissions: {
          where: {
            status: AdmissionStatus.ACTIVE,
            batchId: {
              not: null
            },
            batch: {
              is: {
                isActive: true
              }
            },
          },
          include: {
            batch: {
              include: {
                teacher: {
                  select: {
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!studentProfile) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    const batches = studentProfile.admissions
      .map((admission) => admission.batch)
      .filter((batch) => batch !== null);

    return NextResponse.json(batches);
  } catch (error) {
    console.error("Error fetching student batches:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
