import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

config();
const prisma = new PrismaClient();

async function addDemoData() {
  console.log('Adding additional demo data...');

  try {
    // Get existing users
    const student1 = await prisma.user.findUnique({
      where: { email: 'student1@example.com' },
      include: { studentProfile: true },
    });

    const batch1 = await prisma.batch.findFirst();

    if (!student1?.studentProfile || !batch1) {
      console.log('Base data not found. Run the main seed first.');
      return;
    }

    // Create more exams
    const exams = [];
    const examNames = [
      'Weekly Test 1',
      'Weekly Test 2', 
      'Pre-Final Test',
      'Final Exam',
    ];

    for (let i = 0; i < examNames.length; i++) {
      const exam = await prisma.exam.upsert({
        where: { id: `exam-${i + 4}` },
        create: {
          id: `exam-${i + 4}`,
          batchId: batch1.id,
          name: examNames[i],
          date: new Date(Date.now() - (90 + i * 15) * 24 * 60 * 60 * 1000),
          total_marks: 100,
        },
        update: {},
      });
      exams.push(exam);
    }

    // Create more results for the student
    const scores = [82, 88, 79, 91];
    for (let i = 0; i < exams.length; i++) {
      await prisma.result.upsert({
        where: { id: `result-${i + 4}` },
        create: {
          id: `result-${i + 4}`,
          examId: exams[i].id,
          studentId: student1.studentProfile.id,
          score: scores[i],
          remarks: scores[i] >= 85 ? 'Excellent!' : 'Good work!',
        },
        update: {},
      });
    }

    console.log('✓ Added more exams and results');

    // Create more enquiries with varied statuses and subjects
    const moreEnquiries = [
      {
        name: 'Ankit Gupta',
        phone: '9876543217',
        class_level: 8,
        subjects: 'Mathematics',
        service_type: 'HOME_TUTOR' as const,
        status: 'PENDING' as const,
      },
      {
        name: 'Shreya Das',
        phone: '9876543218',
        class_level: 10,
        subjects: 'Physics, Chemistry',
        service_type: 'TUITION_BATCH' as const,
        status: 'FEES_DISCUSSED' as const,
      },
      {
        name: 'Karan Mehta',
        phone: '9876543219',
        class_level: 11,
        subjects: 'English',
        service_type: 'HOME_TUTOR' as const,
        status: 'LOST' as const,
        lost_reason: 'FEES' as const,
      },
    ];

    const receptionist = await prisma.user.findUnique({
      where: { email: 'reception@5point.edu' },
    });

    for (const enq of moreEnquiries) {
      await prisma.enquiry.create({
        data: {
          ...enq,
          assigned_counselor_id: receptionist?.id,
          follow_up_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        },
      });
    }

    console.log('✓ Added more enquiries');
    console.log('\n✅ Demo data enhanced successfully!');
  } catch (error) {
    console.error('Error adding demo data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addDemoData();
