import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const enquirySchema = z.object({
  name: z.string().min(2),
  phone: z.string().regex(/^[0-9]{10}$/),
  class_level: z.number().min(1).max(12),
  subjects: z.string().min(2),
  service_type: z.enum(["HOME_TUTOR", "TUITION_BATCH"]),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = enquirySchema.parse(body);

    const enquiry = await prisma.enquiry.create({
      data: {
        name: validatedData.name,
        phone: validatedData.phone,
        class_level: validatedData.class_level,
        subjects: validatedData.subjects,
        service_type: validatedData.service_type,
        status: "PENDING",
      },
    });

    return NextResponse.json(enquiry, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");

    const where = status ? { status: status as any } : {};

    const enquiries = await prisma.enquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        assignedCounselor: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(enquiries);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
