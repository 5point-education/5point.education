import { PrismaClient, Role, ServiceType, EnquiryStatus, LostReason, Board, Gender } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

// Load environment variables
config();

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@point.edu' },
    update: {},
    create: {
      email: 'admin@point.edu',
      name: 'Admin User',
      // password_hash removed as it's not in schema (Supabase Auth used)
      role: Role.ADMIN,
      is_active: true,
    },
  });
  console.log('Created admin:', admin.email);

  // Create Receptionist User
  const receptionist = await prisma.user.upsert({
    where: { email: 'reception@5point.edu' },
    update: {},
    create: {
      email: 'reception@5point.edu',
      name: 'Reception Desk',
      // password_hash removed

      role: Role.RECEPTIONIST,
      is_active: true,
    },
  });
  console.log('Created receptionist:', receptionist.email);

  // Create Teacher Users
  const teacherPassword = await bcrypt.hash('teacher123', 10);
  const teacher1 = await prisma.user.upsert({
    where: { email: 'teacher1@5point.edu' },
    update: {},
    create: {
      email: 'teacher1@5point.edu',
      name: 'Dr. Rajesh Kumar',
      // password_hash removed

      role: Role.TEACHER,
      is_active: true,
    },
  });

  const teacher2 = await prisma.user.upsert({
    where: { email: 'teacher2@5point.edu' },
    update: {},
    create: {
      email: 'teacher2@5point.edu',
      name: 'Ms. Priya Sharma',
      // password_hash removed

      role: Role.TEACHER,
      is_active: true,
    },
  });
  console.log('Created teachers');

  // Create Teacher Profiles
  await prisma.teacherProfile.upsert({
    where: { userId: teacher1.id },
    update: {},
    create: {
      userId: teacher1.id,
      qualifications: 'M.Sc Physics, B.Ed',
      experience_years: 10,
      subjects_specialization: 'Physics, Mathematics',
    },
  });

  await prisma.teacherProfile.upsert({
    where: { userId: teacher2.id },
    update: {},
    create: {
      userId: teacher2.id,
      qualifications: 'M.A English, B.Ed',
      experience_years: 7,
      subjects_specialization: 'English, Social Studies',
    },
  });
  console.log('Created teacher profiles');

  // Create Batches
  const batch1 = await prisma.batch.upsert({
    where: { id: 'batch-class10-physics' },
    update: {},
    create: {
      id: 'batch-class10-physics',
      name: 'Class 10 Physics',
      subject: 'Physics',
      teacherId: teacher1.id,
      schedule: 'Mon, Wed, Fri - 4:00 PM to 5:30 PM',
      capacity: 25,
    },
  });

  const batch2 = await prisma.batch.upsert({
    where: { id: 'batch-class9-english' },
    update: {},
    create: {
      id: 'batch-class9-english',
      name: 'Class 9 English',
      subject: 'English',
      teacherId: teacher2.id,
      schedule: 'Tue, Thu, Sat - 3:00 PM to 4:30 PM',
      capacity: 20,
    },
  });
  console.log('Created batches');

  // Create Sample Enquiries
  const enquiries: any[] = [
    {
      name: 'Amit Verma',
      phone: '9876543210',
      class_level: 10,
      subjects: 'Physics, Mathematics',
      service_type: ServiceType.TUITION_BATCH,
      status: EnquiryStatus.PENDING,
      follow_up_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      assigned_counselor_id: receptionist.id,
    },
    {
      name: 'Sneha Das',
      phone: '9876543211',
      class_level: 9,
      subjects: 'English, Science',
      service_type: ServiceType.HOME_TUTOR,
      status: EnquiryStatus.FEES_DISCUSSED,
      follow_up_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      assigned_counselor_id: receptionist.id,
    },
    {
      name: 'Rahul Chatterjee',
      phone: '9876543212',
      class_level: 10,
      subjects: 'All Subjects',
      service_type: ServiceType.TUITION_BATCH,
      status: EnquiryStatus.LOST,
      lost_reason: LostReason.FEES,
      assigned_counselor_id: receptionist.id,
    },
    {
      name: 'Ananya Roy',
      phone: '9876543213',
      class_level: 8,
      subjects: 'Mathematics, Science',
      service_type: 'TUITION_BATCH',
      status: 'PENDING',
      follow_up_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      assigned_counselor_id: receptionist.id,
    },
  ];

  for (const enquiry of enquiries) {
    await prisma.enquiry.create({ data: enquiry });
  }
  console.log('Created sample enquiries');

  // Create a sample student
  const studentPassword = await bcrypt.hash('student123', 10);
  const student1 = await prisma.user.create({
    data: {
      email: 'student1@example.com',
      name: 'Rohan Mukherjee',
      // password_hash removed

      role: Role.STUDENT,
      is_active: true,
    },
  });

  const studentProfile1 = await prisma.studentProfile.create({
    data: {
      userId: student1.id,
      age: 15,
      gender: Gender.MALE,
      fatherName: 'Mr. Subhas Mukherjee',
      phone: '9876543220',
      board: Board.CBSE,
      class_level: 10,
      service_type: ServiceType.TUITION_BATCH,
      correspondenceAddress: 'Salt Lake, Kolkata',
    },
  });

  // Create admission for the student
  await prisma.admission.create({
    data: {
      studentId: studentProfile1.id,
      batchId: batch1.id,
      admission_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      total_fees: 10000,
      fees_pending: 5000,
    },
  });

  // Create payment record
  await prisma.payment.create({
    data: {
      studentId: studentProfile1.id,
      amount: 5000,
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      mode: 'UPI',
      receipt_no: 'REC001',
    },
  });

  // Create exams
  const exam1 = await prisma.exam.create({
    data: {
      batchId: batch1.id,
      name: 'Unit Test 1',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      total_marks: 100,
    },
  });

  const exam2 = await prisma.exam.create({
    data: {
      batchId: batch1.id,
      name: 'Mid Term',
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      total_marks: 100,
    },
  });

  const exam3 = await prisma.exam.create({
    data: {
      batchId: batch1.id,
      name: 'Unit Test 2',
      date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      total_marks: 100,
    },
  });

  // Create results
  await prisma.result.create({
    data: {
      examId: exam1.id,
      studentId: studentProfile1.id,
      score: 85,
      remarks: 'Excellent performance!',
    },
  });

  await prisma.result.create({
    data: {
      examId: exam2.id,
      studentId: studentProfile1.id,
      score: 78,
      remarks: 'Good improvement',
    },
  });

  await prisma.result.create({
    data: {
      examId: exam3.id,
      studentId: studentProfile1.id,
      score: 92,
      remarks: 'Outstanding!',
    },
  });

  // Create more students
  const student2 = await prisma.user.create({
    data: {
      email: 'student2@example.com',
      name: 'Priya Sharma',
      // password_hash removed

      role: 'STUDENT',
      is_active: true,
    },
  });

  const studentProfile2 = await prisma.studentProfile.create({
    data: {
      userId: student2.id,
      age: 16,
      gender: Gender.FEMALE,
      fatherName: 'Mr. Sharma',
      phone: '9876543221',
      board: Board.CBSE,
      class_level: 10,
      service_type: ServiceType.TUITION_BATCH,
      correspondenceAddress: 'Park Street, Kolkata',
    },
  });

  await prisma.admission.create({
    data: {
      studentId: studentProfile2.id,
      batchId: batch1.id,
      admission_date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      total_fees: 10000,
      fees_pending: 0,
    },
  });

  await prisma.payment.create({
    data: {
      studentId: studentProfile2.id,
      amount: 10000,
      date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      mode: 'Cash',
      receipt_no: 'REC002',
    },
  });

  // Add results for student 2
  await prisma.result.create({
    data: {
      examId: exam1.id,
      studentId: studentProfile2.id,
      score: 75,
      remarks: 'Good job',
    },
  });

  // More enquiries
  await prisma.enquiry.create({
    data: {
      name: 'Sanjay Kumar',
      phone: '9876543214',
      class_level: 9,
      subjects: 'Mathematics, Science',
      service_type: ServiceType.TUITION_BATCH,
      status: EnquiryStatus.LOST,
      lost_reason: LostReason.TIMING,
      assigned_counselor_id: receptionist.id,
    },
  });

  await prisma.enquiry.create({
    data: {
      name: 'Meera Devi',
      phone: '9876543215',
      class_level: 11,
      subjects: 'Chemistry, Biology',
      service_type: ServiceType.HOME_TUTOR,
      status: EnquiryStatus.LOST,
      lost_reason: LostReason.SUBJECT_ISSUES,
      assigned_counselor_id: receptionist.id,
    },
  });

  await prisma.enquiry.create({
    data: {
      name: 'Arjun Singh',
      phone: '9876543216',
      class_level: 12,
      subjects: 'Physics, Mathematics',
      service_type: ServiceType.TUITION_BATCH,
      status: EnquiryStatus.ADMITTED,
      assigned_counselor_id: receptionist.id,
    },
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
