import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/server";

const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

type SheetRowInput = {
  studentId?: string | null;
  admissionId?: string | null;
  studentName?: string | null;
  totalReceived?: number | string | null;
  fivePointFees?: number | string | null;
  developmentFees?: number | string | null;
  discount?: number | string | null;
};

type ExistingSheetRow = {
  studentId: string | null;
  admissionId: string | null;
  studentName: string;
  totalReceived: number;
  fivePointFees: number;
  developmentFees: number;
  discount: number;
};

type TeacherFeeRow = ExistingSheetRow & {
  teacherAmount: number;
  isArchived: boolean;
};

type AdmissionWithStudentName = {
  id: string;
  studentId: string;
  student: {
    user: {
      name: string;
    };
  };
};

type PaymentRecord = {
  admissionId: string | null;
  amount: number;
};

type TeacherBatch = {
  id: string;
  name: string;
  subject: string;
};

type TeacherOption = {
  id: string;
  name: string;
};

type BatchWithTeacher = {
  id: string;
  name: string;
  subject: string;
  teacherId: string;
  teacher: {
    id: string;
    name: string;
  };
};

type SelectedBatch = {
  id: string;
  name: string;
  subject: string;
  teacherId: string;
  teacher: {
    id: string;
    name: string;
  };
};

type TeacherSheetWithBatch = {
  id: string;
  batchId: string;
  totalReceived: number;
  totalDeductions: number;
  totalTeacherAmount: number;
  updatedAt: Date;
  batch: {
    id: string;
    name: string;
    subject: string;
  };
};

type SheetWithRows = {
  id: string;
  month: string;
  batchId: string;
  teacherId: string;
  updatedAt: Date;
  rows: ExistingSheetRow[];
};

type AdmissionReference = {
  id: string;
  studentId: string;
};

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function parseMonth(month: string | null) {
  const resolved = month || getCurrentMonth();
  if (!MONTH_REGEX.test(resolved)) {
    throw new Error("Invalid month format. Expected YYYY-MM.");
  }
  return resolved;
}

function getMonthRange(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, monthNumber - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, monthNumber, 0, 23, 59, 59, 999));
  return { start, end };
}

function normalizeAmount(value: number | string | null | undefined, fieldName: string) {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${fieldName} must be a non-negative number`);
  }
  return Math.round(parsed * 100) / 100;
}

function calculateTeacherAmount(
  totalReceived: number,
  fivePointFees: number,
  developmentFees: number,
  discount: number
) {
  return Math.round((totalReceived - fivePointFees - developmentFees - discount) * 100) / 100;
}

async function buildRowsForBatch(
  batchId: string,
  month: string,
  existingRows: ExistingSheetRow[]
): Promise<TeacherFeeRow[]> {
  const admissions = (await db.admission.findMany({
    where: { batchId },
    select: {
      id: true,
      studentId: true,
      student: {
        select: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      student: {
        user: {
          name: "asc",
        },
      },
    },
  })) as AdmissionWithStudentName[];

  const admissionIds = admissions.map((admission) => admission.id);
  const { start, end } = getMonthRange(month);
  const payments: PaymentRecord[] =
    admissionIds.length === 0
      ? []
      : ((await db.payment.findMany({
          where: {
            admissionId: { in: admissionIds },
            OR: [
              {
                coveredMonths: {
                  has: month,
                },
              },
              {
                date: {
                  gte: start,
                  lte: end,
                },
              },
            ],
          },
          select: {
            admissionId: true,
            amount: true,
          },
        })) as PaymentRecord[]);

  const receivedByAdmission = new Map<string, number>();
  for (const payment of payments) {
    if (!payment.admissionId) continue;
    const current = receivedByAdmission.get(payment.admissionId) || 0;
    receivedByAdmission.set(payment.admissionId, current + payment.amount);
  }

  const existingByAdmissionId = new Map(
    existingRows
      .filter((row): row is ExistingSheetRow & { admissionId: string } => Boolean(row.admissionId))
      .map((row) => [row.admissionId, row] as const)
  );
  const existingByStudentId = new Map(
    existingRows
      .filter((row): row is ExistingSheetRow & { studentId: string } => Boolean(row.studentId))
      .map((row) => [row.studentId, row] as const)
  );

  const matchedKeys = new Set<string>();

  const rows = admissions.map((admission: AdmissionWithStudentName) => {
    const existing =
      existingByAdmissionId.get(admission.id) ||
      existingByStudentId.get(admission.studentId);
    if (existing?.admissionId) matchedKeys.add(existing.admissionId);
    else if (existing?.studentId) matchedKeys.add(existing.studentId);

    const totalReceived = Math.round(
      ((receivedByAdmission.get(admission.id) || 0) + Number.EPSILON) * 100
    ) / 100;
    const fivePointFees = Math.round(
      (((existing?.fivePointFees as number | undefined) || 0) + Number.EPSILON) * 100
    ) / 100;
    const developmentFees = Math.round(
      (((existing?.developmentFees as number | undefined) || 0) + Number.EPSILON) * 100
    ) / 100;
    const discount = Math.round(
      (((existing?.discount as number | undefined) || 0) + Number.EPSILON) * 100
    ) / 100;

    return {
      studentId: admission.studentId,
      admissionId: admission.id,
      studentName: admission.student.user.name,
      totalReceived,
      fivePointFees,
      developmentFees,
      discount,
      teacherAmount: calculateTeacherAmount(
        totalReceived,
        fivePointFees,
        developmentFees,
        discount
      ),
      isArchived: false,
    };
  });

  const archivedRows = existingRows
    .filter((row: ExistingSheetRow) => {
      const rowKey = row.admissionId || row.studentId || "";
      return rowKey && !matchedKeys.has(rowKey);
    })
    .map((row: ExistingSheetRow) => {
      const totalReceived = Math.round((row.totalReceived + Number.EPSILON) * 100) / 100;
      const fivePointFees = Math.round((row.fivePointFees + Number.EPSILON) * 100) / 100;
      const developmentFees = Math.round((row.developmentFees + Number.EPSILON) * 100) / 100;
      const discount = Math.round((row.discount + Number.EPSILON) * 100) / 100;
      return {
        studentId: row.studentId,
        admissionId: row.admissionId,
        studentName: row.studentName,
        totalReceived,
        fivePointFees,
        developmentFees,
        discount,
        teacherAmount: calculateTeacherAmount(
          totalReceived,
          fivePointFees,
          developmentFees,
          discount
        ),
        isArchived: true,
      };
    });

  return [...rows, ...archivedRows];
}

export async function GET(req: Request) {
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
        user.user_metadata.role !== Role.RECEPTIONIST &&
        user.user_metadata.role !== Role.TEACHER)
    ) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const url = new URL(req.url);
    const month = parseMonth(url.searchParams.get("month"));
    const teacherIdFilter = url.searchParams.get("teacherId");
    const batchId = url.searchParams.get("batchId");

    if (user.user_metadata.role === Role.TEACHER) {
      const teacherBatches = (await db.batch.findMany({
        where: { teacherId: user.id },
        select: { id: true, name: true, subject: true },
        orderBy: { name: "asc" },
      })) as TeacherBatch[];

      if (batchId && !teacherBatches.some((batch: TeacherBatch) => batch.id === batchId)) {
        return new NextResponse("Unauthorized batch access", { status: 403 });
      }

      const where: {
        month: string;
        teacherId: string;
        batchId?: string;
      } = {
        month,
        teacherId: user.id,
      };
      if (batchId) where.batchId = batchId;

      const sheets = (await db.teacherFeeSheet.findMany({
        where,
        include: {
          batch: {
            select: {
              id: true,
              name: true,
              subject: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      })) as TeacherSheetWithBatch[];

      return NextResponse.json({
        month,
        batches: teacherBatches.map((batch: TeacherBatch) => ({
          id: batch.id,
          name: `${batch.name} - ${batch.subject}`,
        })),
        sheets: sheets.map((sheet: TeacherSheetWithBatch) => ({
          id: sheet.id,
          batchId: sheet.batchId,
          batchName: `${sheet.batch.name} - ${sheet.batch.subject}`,
          totalReceived: sheet.totalReceived,
          totalDeductions: sheet.totalDeductions,
          totalTeacherAmount: sheet.totalTeacherAmount,
          updatedAt: sheet.updatedAt,
        })),
        totalTeacherAmount: sheets.reduce(
          (sum: number, sheet: TeacherSheetWithBatch) => sum + sheet.totalTeacherAmount,
          0
        ),
      });
    }

    const teachers = (await db.user.findMany({
      where: { role: Role.TEACHER },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    })) as TeacherOption[];

    const batches = (await db.batch.findMany({
      where: teacherIdFilter ? { teacherId: teacherIdFilter } : undefined,
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })) as BatchWithTeacher[];

    if (!batchId) {
      return NextResponse.json({
        month,
        teachers,
        batches: batches.map((batch: BatchWithTeacher) => ({
          id: batch.id,
          name: batch.name,
          subject: batch.subject,
          teacherId: batch.teacherId,
          teacherName: batch.teacher.name,
        })),
        sheet: null,
        rows: [],
      });
    }

    const batch = (await db.batch.findUnique({
      where: { id: batchId },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })) as SelectedBatch | null;

    if (!batch) {
      return new NextResponse("Batch not found", { status: 404 });
    }

    if (teacherIdFilter && batch.teacherId !== teacherIdFilter) {
      return new NextResponse("Selected batch does not belong to selected teacher", {
        status: 400,
      });
    }

    const sheet = (await db.teacherFeeSheet.findUnique({
      where: {
        month_batchId: {
          month,
          batchId,
        },
      },
      include: {
        rows: true,
      },
    })) as SheetWithRows | null;

    const rows: TeacherFeeRow[] = await buildRowsForBatch(batchId, month, sheet?.rows || []);
    const totalReceived = rows.reduce((sum: number, row: TeacherFeeRow) => sum + row.totalReceived, 0);
    const totalDeductions = rows.reduce(
      (sum: number, row: TeacherFeeRow) =>
        sum + row.fivePointFees + row.developmentFees + row.discount,
      0
    );
    const totalTeacherAmount = rows.reduce(
      (sum: number, row: TeacherFeeRow) => sum + row.teacherAmount,
      0
    );

    return NextResponse.json({
      month,
      teachers,
      batches: batches.map((item: BatchWithTeacher) => ({
        id: item.id,
        name: item.name,
        subject: item.subject,
        teacherId: item.teacherId,
        teacherName: item.teacher.name,
      })),
      batch: {
        id: batch.id,
        name: batch.name,
        subject: batch.subject,
        teacherId: batch.teacher.id,
        teacherName: batch.teacher.name,
      },
      sheet: sheet
        ? {
            id: sheet.id,
            month: sheet.month,
            batchId: sheet.batchId,
            teacherId: sheet.teacherId,
            updatedAt: sheet.updatedAt,
          }
        : null,
      rows,
      totals: {
        totalReceived: Math.round((totalReceived + Number.EPSILON) * 100) / 100,
        totalDeductions: Math.round((totalDeductions + Number.EPSILON) * 100) / 100,
        totalTeacherAmount: Math.round((totalTeacherAmount + Number.EPSILON) * 100) / 100,
      },
    });
  } catch (error: any) {
    console.log("[TEACHER_FEE_SHEETS_GET]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}

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
    const month = parseMonth(body.month || null);
    const batchId = body.batchId as string;
    const rows = (body.rows || []) as SheetRowInput[];

    if (!batchId) {
      return new NextResponse("Batch is required", { status: 400 });
    }

    if (!Array.isArray(rows)) {
      return new NextResponse("Rows must be an array", { status: 400 });
    }

    const batch = await db.batch.findUnique({
      where: { id: batchId },
      select: {
        id: true,
        teacherId: true,
      },
    });

    if (!batch) {
      return new NextResponse("Batch not found", { status: 404 });
    }

    const admissions = (await db.admission.findMany({
      where: { batchId },
      select: { id: true, studentId: true },
    })) as AdmissionReference[];
    const validAdmissionIds = new Set(admissions.map((admission: AdmissionReference) => admission.id));
    const validStudentIds = new Set(
      admissions.map((admission: AdmissionReference) => admission.studentId)
    );

    const sanitizedRows = rows.map((row, index) => {
      const totalReceived = normalizeAmount(row.totalReceived, `row ${index + 1} totalReceived`);
      const fivePointFees = normalizeAmount(row.fivePointFees, `row ${index + 1} fivePointFees`);
      const developmentFees = normalizeAmount(
        row.developmentFees,
        `row ${index + 1} developmentFees`
      );
      const discount = normalizeAmount(row.discount, `row ${index + 1} discount`);

      const deductions = fivePointFees + developmentFees + discount;
      if (deductions > totalReceived) {
        throw new Error(
          `row ${index + 1} deductions exceed total received for ${row.studentName || "student"}`
        );
      }

      const teacherAmount = calculateTeacherAmount(
        totalReceived,
        fivePointFees,
        developmentFees,
        discount
      );

      const normalizedAdmissionId =
        row.admissionId && validAdmissionIds.has(row.admissionId)
          ? row.admissionId
          : null;
      const normalizedStudentId =
        row.studentId && validStudentIds.has(row.studentId) ? row.studentId : null;

      return {
        studentId: normalizedStudentId,
        admissionId: normalizedAdmissionId,
        studentName: (row.studentName || "").trim() || "Unknown Student",
        totalReceived,
        fivePointFees,
        developmentFees,
        discount,
        teacherAmount,
      };
    });

    const totalReceived = sanitizedRows.reduce((sum, row) => sum + row.totalReceived, 0);
    const totalDeductions = sanitizedRows.reduce(
      (sum, row) => sum + row.fivePointFees + row.developmentFees + row.discount,
      0
    );
    const totalTeacherAmount = sanitizedRows.reduce((sum, row) => sum + row.teacherAmount, 0);

    const savedSheet = await db.$transaction(async (tx) => {
      const sheet = await tx.teacherFeeSheet.upsert({
        where: {
          month_batchId: {
            month,
            batchId,
          },
        },
        create: {
          month,
          batchId,
          teacherId: batch.teacherId,
          createdById: user.id,
          totalReceived,
          totalDeductions,
          totalTeacherAmount,
        },
        update: {
          teacherId: batch.teacherId,
          createdById: user.id,
          totalReceived,
          totalDeductions,
          totalTeacherAmount,
        },
      });

      await tx.teacherFeeSheetRow.deleteMany({
        where: { sheetId: sheet.id },
      });

      if (sanitizedRows.length > 0) {
        await tx.teacherFeeSheetRow.createMany({
          data: sanitizedRows.map((row) => ({
            sheetId: sheet.id,
            studentId: row.studentId,
            admissionId: row.admissionId,
            studentName: row.studentName,
            totalReceived: row.totalReceived,
            fivePointFees: row.fivePointFees,
            developmentFees: row.developmentFees,
            discount: row.discount,
            teacherAmount: row.teacherAmount,
          })),
        });
      }

      return tx.teacherFeeSheet.findUnique({
        where: { id: sheet.id },
        include: {
          rows: true,
        },
      });
    });

    return NextResponse.json({
      success: true,
      sheet: savedSheet,
    });
  } catch (error: any) {
    console.log("[TEACHER_FEE_SHEETS_POST]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
