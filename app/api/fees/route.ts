import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

export async function GET(req: Request) {
    try {
        const supabase = createAdminClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Fetch all student profiles with their admissions and payments
        const students = await db.studentProfile.findMany({
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                    }
                },
                admissions: {
                    include: {
                        batch: {
                            select: {
                                id: true,
                                name: true,
                                subject: true,
                                feeModel: true,
                            }
                        }
                    }
                },
                payments: {
                    orderBy: {
                        date: 'desc'
                    }
                }
            },
            orderBy: {
                user: {
                    name: 'asc'
                }
            }
        });

        // Transform data to include calculated fields
        const feesData = students.map(student => {
            const totalFees = student.admissions.reduce((sum, adm) => sum + adm.total_fees, 0);
            const totalPending = student.admissions.reduce((sum, adm) => sum + adm.fees_pending, 0);
            const totalPaid = student.payments.reduce((sum, pay) => sum + pay.amount, 0);

            return {
                studentId: student.id,
                studentName: student.user.name,
                email: student.user.email,
                phone: student.phone,
                admissions: student.admissions.map(adm => ({
                    id: adm.id,
                    batchId: adm.batchId,
                    batchName: adm.batch ? `${adm.batch.name} - ${adm.batch.subject}` : 'No Batch',
                    total_fees: adm.total_fees,
                    fees_pending: adm.fees_pending,
                    feeModel: adm.batch?.feeModel || null,
                    admission_date: adm.admission_date,
                })),
                payments: student.payments.map(pay => ({
                    id: pay.id,
                    amount: pay.amount,
                    date: pay.date,
                    mode: pay.mode,
                    receipt_no: pay.receipt_no,
                })),
                totalFees,
                totalPaid,
                totalPending,
            };
        });

        return NextResponse.json(feesData);

    } catch (error) {
        console.log("[FEES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
