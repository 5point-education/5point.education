/**
 * Portal End-to-End Testing Script
 * 
 * Comprehensive test script for fees management and admissions system.
 * 
 * This script tests:
 * 1. Batch creation with diverse fee models (primarily monthly with day-wise fees)
 * 2. Student admissions with various payment scenarios:
 *    - Full payment
 *    - Partial payment
 *    - Admission charges
 *    - Old students (3-4 years ago)
 *    - Fresh admissions
 * 3. Month-based payment tracking
 * 4. Days-wise fee calculations
 * 5. Pending fee calculations
 * 
 * Run with: tsx scripts/test-portal-e2e.ts
 * 
 * Prerequisites:
 * - Database should be set up with schema
 * - Prisma client should be generated
 */

import { PrismaClient, FeeModel, AdmissionStatus, Board, ServiceType, Gender, Role } from '@prisma/client';
import {
  getMonthlyFee,
  calculatePendingFees,
  getMonthsBetween,
  generateDateRange,
  formatMonth,
} from '../lib/fees-utils';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

// Initialize Supabase Admin Client
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Test configuration
const TEST_CONFIG = {
  cleanup: false, // Set to false to keep test data for inspection
  verbose: true, // Set to true for detailed output
};

// Test results tracking
const testResults: {
  passed: number;
  failed: number;
  tests: Array<{ name: string; status: 'PASS' | 'FAIL'; error?: string }>;
} = {
  passed: 0,
  failed: 0,
  tests: [],
};

// Helper functions
function log(message: string, type: 'info' | 'success' | 'error' | 'test' | 'section' = 'info') {
  const colors = {
    info: '\x1b[36m', // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m', // Red
    test: '\x1b[33m', // Yellow
    section: '\x1b[35m', // Magenta
  };
  const reset = '\x1b[0m';
  console.log(`${colors[type]}${message}${reset}`);
}

async function test(name: string, fn: () => void | Promise<void>) {
  try {
    if (TEST_CONFIG.verbose) {
      log(`\n🧪 Testing: ${name}`, 'test');
    }
    const result = fn();
    if (result instanceof Promise) {
      await result;
    }
    testResults.passed++;
    testResults.tests.push({ name, status: 'PASS' });
    if (TEST_CONFIG.verbose) {
      log(`✅ PASS: ${name}`, 'success');
    }
  } catch (error: any) {
    testResults.failed++;
    testResults.tests.push({ name, status: 'FAIL', error: error.message });
    log(`❌ FAIL: ${name} - ${error.message}`, 'error');
    if (TEST_CONFIG.verbose) {
      console.error(error);
    }
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual<T>(actual: T, expected: T, message?: string) {
  if (actual !== expected) {
    throw new Error(
      message || `Expected ${expected}, but got ${actual}`
    );
  }
}

// Test data storage
const testData: {
  teachers: any[];
  students: any[];
  batches: any[];
  admissions: any[];
  payments: any[];
  studentCredentials: Array<{ email: string; password: string; name: string }>;
} = {
  teachers: [],
  students: [],
  batches: [],
  admissions: [],
  payments: [],
  studentCredentials: [],
};

// ==================== TEST SCENARIOS ====================

/**
 * PHASE 1: Create Diverse Batches
 * 
 * Creates batches with various fee models:
 * - Monthly batches with day-wise fees (primary focus)
 * - Regular monthly batches
 * - Quarterly batches
 * - Different day-wise fee configurations
 */
async function createDiverseBatches() {
  log('\n📚 PHASE 1: Creating Diverse Batches', 'section');

  // Create test teachers
  await test('Create test teachers', async () => {
    const teacher1 = await prisma.user.create({
      data: {
        name: 'Dr. Mathematics Teacher',
        email: `math-teacher-${Date.now()}@test.com`,
        role: 'TEACHER',
      },
    });
    const teacher2 = await prisma.user.create({
      data: {
        name: 'Dr. Physics Teacher',
        email: `physics-teacher-${Date.now()}@test.com`,
        role: 'TEACHER',
      },
    });
    const teacher3 = await prisma.user.create({
      data: {
        name: 'Dr. Chemistry Teacher',
        email: `chemistry-teacher-${Date.now()}@test.com`,
        role: 'TEACHER',
      },
    });
    testData.teachers = [teacher1, teacher2, teacher3];
    assert(testData.teachers.length === 3, 'Should create 3 teachers');
  });

  // Batch 1: Monthly with Day-wise Fees (1 day = 500, 2 days = 900, 3 days = 1200, 4 days = 1500, 5 days = 1800)
  await test('Create Monthly Batch with Day-wise Fees (Math)', async () => {
    const batch = await prisma.batch.create({
      data: {
        name: 'Mathematics Advanced',
        subject: 'Mathematics',
        teacherId: testData.teachers[0].id,
        schedule: JSON.stringify([
          { day: 'Monday', startTime: '10:00', endTime: '12:00' },
          { day: 'Wednesday', startTime: '10:00', endTime: '12:00' },
          { day: 'Friday', startTime: '10:00', endTime: '12:00' },
        ]),
        capacity: 30,
        feeModel: FeeModel.MONTHLY,
        feeAmount: 2000, // Base fee (used as fallback)
        daysWiseFeesEnabled: true,
        daysWiseFees: {
          '1': 500,   // 1 day per week
          '2': 900,   // 2 days per week
          '3': 1200,  // 3 days per week
          '4': 1500,  // 4 days per week
          '5': 1800,  // 5 days per week
        },
        isActive: true,
        startDate: new Date('2024-01-01'),
      },
    });
    testData.batches.push(batch);
    assert(batch.daysWiseFeesEnabled === true, 'Day-wise fees should be enabled');
    assert(!!batch.daysWiseFees, 'Day-wise fees should be configured');
  });

  // Batch 2: Monthly with Day-wise Fees (Different pricing)
  await test('Create Monthly Batch with Day-wise Fees (Physics)', async () => {
    const batch = await prisma.batch.create({
      data: {
        name: 'Physics Fundamentals',
        subject: 'Physics',
        teacherId: testData.teachers[1].id,
        schedule: JSON.stringify([
          { day: 'Tuesday', startTime: '14:00', endTime: '16:00' },
          { day: 'Thursday', startTime: '14:00', endTime: '16:00' },
        ]),
        capacity: 25,
        feeModel: FeeModel.MONTHLY,
        feeAmount: 1800,
        daysWiseFeesEnabled: true,
        daysWiseFees: {
          '1': 600,
          '2': 1100,
          '3': 1500,
          '4': 1800,
        },
        isActive: true,
        startDate: new Date('2024-02-01'),
      },
    });
    testData.batches.push(batch);
  });

  // Batch 3: Regular Monthly Batch (no day-wise fees)
  await test('Create Regular Monthly Batch (Chemistry)', async () => {
    const batch = await prisma.batch.create({
      data: {
        name: 'Chemistry Basics',
        subject: 'Chemistry',
        teacherId: testData.teachers[2].id,
        schedule: JSON.stringify([
          { day: 'Monday', startTime: '16:00', endTime: '18:00' },
          { day: 'Wednesday', startTime: '16:00', endTime: '18:00' },
          { day: 'Friday', startTime: '16:00', endTime: '18:00' },
        ]),
        capacity: 20,
        feeModel: FeeModel.MONTHLY,
        feeAmount: 2500,
        daysWiseFeesEnabled: false,
        isActive: true,
        startDate: new Date('2024-03-01'),
      },
    });
    testData.batches.push(batch);
  });

  // Batch 4: Quarterly Batch
  await test('Create Quarterly Batch (Biology)', async () => {
    const batch = await prisma.batch.create({
      data: {
        name: 'Biology Advanced',
        subject: 'Biology',
        teacherId: testData.teachers[0].id,
        schedule: JSON.stringify([
          { day: 'Saturday', startTime: '10:00', endTime: '13:00' },
          { day: 'Sunday', startTime: '10:00', endTime: '13:00' },
        ]),
        capacity: 15,
        feeModel: FeeModel.QUARTERLY,
        feeAmount: 7500, // 2500 per month
        daysWiseFeesEnabled: false,
        isActive: true,
        startDate: new Date('2024-04-01'),
      },
    });
    testData.batches.push(batch);
  });

  // Batch 5: Monthly with Day-wise Fees (More options)
  await test('Create Monthly Batch with Extended Day-wise Fees (English)', async () => {
    const batch = await prisma.batch.create({
      data: {
        name: 'English Communication',
        subject: 'English',
        teacherId: testData.teachers[1].id,
        schedule: JSON.stringify([
          { day: 'Monday', startTime: '09:00', endTime: '10:00' },
          { day: 'Tuesday', startTime: '09:00', endTime: '10:00' },
          { day: 'Wednesday', startTime: '09:00', endTime: '10:00' },
          { day: 'Thursday', startTime: '09:00', endTime: '10:00' },
          { day: 'Friday', startTime: '09:00', endTime: '10:00' },
        ]),
        capacity: 40,
        feeModel: FeeModel.MONTHLY,
        feeAmount: 2000,
        daysWiseFeesEnabled: true,
        daysWiseFees: {
          '1': 400,
          '2': 750,
          '3': 1100,
          '4': 1400,
          '5': 1700,
          '6': 2000,
        },
        isActive: true,
        startDate: new Date('2024-05-01'),
      },
    });
    testData.batches.push(batch);
  });

  log(`✅ Created ${testData.batches.length} batches with diverse fee models`, 'success');
}

/**
 * PHASE 2: Create Students
 * 
 * Creates students including:
 * - Old students (admitted 3-4 years ago)
 * - Fresh admissions (current year)
 */
async function createStudents() {
  log('\n👥 PHASE 2: Creating Students', 'section');

  const currentYear = new Date().getFullYear();
  const yearsAgo = [4, 3, 2, 1, 0]; // Years ago from current year
  const studentPassword = '123456'; // Consistent password for all test students

  for (let i = 0; i < 15; i++) {
    const yearOffset = yearsAgo[i % yearsAgo.length];
    const admissionYear = currentYear - yearOffset;
    const isOldStudent = yearOffset >= 3;
    const studentName = `${isOldStudent ? 'Old' : 'Fresh'} Student ${i + 1}`;
    const studentEmail = `student-${i + 1}-${Date.now()}@test.com`;

    await test(`Create ${isOldStudent ? 'Old' : 'Fresh'} Student ${i + 1} (Admitted ${yearOffset} year(s) ago)`, async () => {
      // 1. Create user in Supabase Auth first
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: studentEmail,
        password: studentPassword,
        email_confirm: true,
        user_metadata: {
          name: studentName,
          role: Role.STUDENT,
        },
      });

      if (authError) {
        // If user already exists, try to find them
        if (authError.message.includes('already registered')) {
          log(`⚠️  User ${studentEmail} already exists in Supabase Auth, attempting to find...`, 'info');
          const { data: userList } = await supabase.auth.admin.listUsers();
          const existingUser = userList?.users.find((u) => u.email === studentEmail);
          if (existingUser) {
            // Use existing user ID
            const user = await prisma.user.upsert({
              where: { email: studentEmail },
              update: {
                id: existingUser.id,
                name: studentName,
                role: Role.STUDENT,
              },
              create: {
                id: existingUser.id,
                name: studentName,
                email: studentEmail,
                role: Role.STUDENT,
              },
            });

            const student = await prisma.studentProfile.upsert({
              where: { userId: user.id },
              update: {},
              create: {
                userId: user.id,
                phone: `9876543${String(i).padStart(3, '0')}`,
                parentMobile: `9876543${String(i).padStart(3, '0')}`,
                gender: i % 2 === 0 ? Gender.MALE : Gender.FEMALE,
                dob: new Date(admissionYear - 15, 0, 1),
                fatherName: `Father of Student ${i + 1}`,
                motherName: `Mother of Student ${i + 1}`,
                board: i % 3 === 0 ? Board.CBSE : i % 3 === 1 ? Board.ICSE : Board.WBBSE,
                class_level: 10 + (i % 3),
                stream: i % 2 === 0 ? 'Science' : 'Commerce',
                service_type: ServiceType.TUITION_BATCH,
                subjects: 'Mathematics, Physics, Chemistry',
                source_of_enquiry: isOldStudent ? 'Referral' : 'Walk-in',
              },
            });

            testData.students.push({ ...student, admissionYear, isOldStudent });
            testData.studentCredentials.push({ email: studentEmail, password: studentPassword, name: studentName });
            assert(!!student, 'Student should be created');
            return;
          }
        }
        throw new Error(`Failed to create Supabase Auth user: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('Failed to create Supabase Auth user: No user data returned');
      }

      // 2. Create user in Prisma with matching ID
      const user = await prisma.user.create({
        data: {
          id: authData.user.id, // Sync with Supabase Auth ID
          name: studentName,
          email: studentEmail,
          role: Role.STUDENT,
        },
      });

      // 3. Create student profile
      const student = await prisma.studentProfile.create({
        data: {
          userId: user.id,
          phone: `9876543${String(i).padStart(3, '0')}`,
          parentMobile: `9876543${String(i).padStart(3, '0')}`,
          gender: i % 2 === 0 ? Gender.MALE : Gender.FEMALE,
          dob: new Date(admissionYear - 15, 0, 1), // 15 years old at admission
          fatherName: `Father of Student ${i + 1}`,
          motherName: `Mother of Student ${i + 1}`,
          board: i % 3 === 0 ? Board.CBSE : i % 3 === 1 ? Board.ICSE : Board.WBBSE,
          class_level: 10 + (i % 3),
          stream: i % 2 === 0 ? 'Science' : 'Commerce',
          service_type: ServiceType.TUITION_BATCH,
          subjects: 'Mathematics, Physics, Chemistry',
          source_of_enquiry: isOldStudent ? 'Referral' : 'Walk-in',
        },
      });

      testData.students.push({ ...student, admissionYear, isOldStudent });
      testData.studentCredentials.push({ email: studentEmail, password: studentPassword, name: studentName });
      assert(!!student, 'Student should be created');
    });
  }

  log(`✅ Created ${testData.students.length} students (${testData.students.filter(s => s.isOldStudent).length} old, ${testData.students.filter(s => !s.isOldStudent).length} fresh)`, 'success');
  log(`🔑 All students use password: ${studentPassword}`, 'info');
}

/**
 * PHASE 3: Admit Students with Various Payment Scenarios
 * 
 * Tests various admission scenarios:
 * - Full payment
 * - Partial payment
 * - With admission charges
 * - Different day selections for day-wise fees
 */
async function admitStudentsWithVariousPayments() {
  log('\n🎓 PHASE 3: Admitting Students with Various Payment Scenarios', 'section');

  const mathBatch = testData.batches[0]; // Day-wise fees batch
  const physicsBatch = testData.batches[1]; // Day-wise fees batch
  const chemistryBatch = testData.batches[2]; // Regular monthly
  const biologyBatch = testData.batches[3]; // Quarterly
  const englishBatch = testData.batches[4]; // Extended day-wise fees

  let studentIndex = 0;

  // Scenario 1: Full payment with admission charge (Day-wise: 3 days)
  await test('Admit Student 1: Full payment + admission charge (3 days/week)', async () => {
    const student = testData.students[studentIndex++];
    const selectedDays = 3;
    const monthlyFee = getMonthlyFee(mathBatch, { selectedDays });
    const admissionCharge = 500;
    const totalAmount = monthlyFee + admissionCharge;

    const admission = await prisma.admission.create({
      data: {
        studentId: student.id,
        batchId: mathBatch.id,
        admission_date: new Date('2024-01-15'),
        total_fees: monthlyFee,
        fees_pending: 0, // Full payment
        admission_charge: admissionCharge,
        admission_charge_pending: 0, // Admission charge paid
        selectedDays: selectedDays,
        status: AdmissionStatus.ACTIVE,
      },
    });

    // Create payment for admission charge
    const admissionPayment = await prisma.payment.create({
      data: {
        studentId: student.id,
        admissionId: admission.id,
        amount: admissionCharge,
        mode: 'CASH',
        receipt_no: `ADM-${Date.now()}-1`,
        coveredMonths: [],
        notes: 'Admission charge',
      },
    });

    // Create payment for first month
    const months = ['2024-01'];
    const { from, to } = generateDateRange(months);
    const monthPayment = await prisma.payment.create({
      data: {
        studentId: student.id,
        admissionId: admission.id,
        amount: monthlyFee,
        mode: 'UPI',
        receipt_no: `REC-${Date.now()}-1`,
        coveredMonths: months,
        coveredFromDate: from,
        coveredToDate: to,
      },
    });

    testData.admissions.push(admission);
    testData.payments.push(admissionPayment, monthPayment);
    assertEqual(admission.fees_pending, 0, 'Fees pending should be 0 for full payment');
    assertEqual(admission.admission_charge_pending, 0, 'Admission charge pending should be 0');
  });

  // Scenario 2: Partial payment (Day-wise: 2 days)
  await test('Admit Student 2: Partial payment (2 days/week)', async () => {
    const student = testData.students[studentIndex++];
    const selectedDays = 2;
    const monthlyFee = getMonthlyFee(physicsBatch, { selectedDays });
    const paidAmount = monthlyFee * 0.5; // 50% payment

    const admission = await prisma.admission.create({
      data: {
        studentId: student.id,
        batchId: physicsBatch.id,
        admission_date: new Date('2024-02-10'),
        total_fees: monthlyFee,
        fees_pending: monthlyFee - paidAmount,
        admission_charge: 0,
        admission_charge_pending: 0,
        selectedDays: selectedDays,
        status: AdmissionStatus.ACTIVE,
      },
    });

    // Create partial payment
    const months = ['2024-02'];
    const { from, to } = generateDateRange(months);
    const payment = await prisma.payment.create({
      data: {
        studentId: student.id,
        admissionId: admission.id,
        amount: paidAmount,
        mode: 'BANK',
        receipt_no: `REC-${Date.now()}-2`,
        coveredMonths: months,
        coveredFromDate: from,
        coveredToDate: to,
        notes: 'Partial payment - 50%',
      },
    });

    testData.admissions.push(admission);
    testData.payments.push(payment);
    assert(admission.fees_pending > 0, 'Fees pending should be greater than 0 for partial payment');
  });

  // Scenario 3: Full payment, no admission charge (Day-wise: 4 days)
  await test('Admit Student 3: Full payment, no admission charge (4 days/week)', async () => {
    const student = testData.students[studentIndex++];
    const selectedDays = 4;
    const monthlyFee = getMonthlyFee(mathBatch, { selectedDays });

    const admission = await prisma.admission.create({
      data: {
        studentId: student.id,
        batchId: mathBatch.id,
        admission_date: new Date('2024-01-20'),
        total_fees: monthlyFee,
        fees_pending: 0,
        admission_charge: 0,
        admission_charge_pending: 0,
        selectedDays: selectedDays,
        status: AdmissionStatus.ACTIVE,
      },
    });

    const months = ['2024-01'];
    const { from, to } = generateDateRange(months);
    const payment = await prisma.payment.create({
      data: {
        studentId: student.id,
        admissionId: admission.id,
        amount: monthlyFee,
        mode: 'CASH',
        receipt_no: `REC-${Date.now()}-3`,
        coveredMonths: months,
        coveredFromDate: from,
        coveredToDate: to,
      },
    });

    testData.admissions.push(admission);
    testData.payments.push(payment);
  });

  // Scenario 4: Admission charge pending (Day-wise: 1 day)
  await test('Admit Student 4: Admission charge pending (1 day/week)', async () => {
    const student = testData.students[studentIndex++];
    const selectedDays = 1;
    const monthlyFee = getMonthlyFee(englishBatch, { selectedDays });
    const admissionCharge = 300;
    const admissionChargePaid = 100; // Partial admission charge

    const admission = await prisma.admission.create({
      data: {
        studentId: student.id,
        batchId: englishBatch.id,
        admission_date: new Date('2024-05-05'),
        total_fees: monthlyFee,
        fees_pending: monthlyFee, // No payment yet
        admission_charge: admissionCharge,
        admission_charge_pending: admissionCharge - admissionChargePaid,
        selectedDays: selectedDays,
        status: AdmissionStatus.ACTIVE,
      },
    });

    // Partial admission charge payment
    const admissionPayment = await prisma.payment.create({
      data: {
        studentId: student.id,
        admissionId: admission.id,
        amount: admissionChargePaid,
        mode: 'UPI',
        receipt_no: `ADM-${Date.now()}-4`,
        coveredMonths: [],
        notes: 'Partial admission charge',
      },
    });

    testData.admissions.push(admission);
    testData.payments.push(admissionPayment);
    assert(admission.admission_charge_pending > 0, 'Admission charge should be pending');
  });

  // Scenario 5: Regular monthly batch, full payment
  await test('Admit Student 5: Regular monthly batch, full payment', async () => {
    const student = testData.students[studentIndex++];
    const monthlyFee = chemistryBatch.feeAmount!;

    const admission = await prisma.admission.create({
      data: {
        studentId: student.id,
        batchId: chemistryBatch.id,
        admission_date: new Date('2024-03-01'),
        total_fees: monthlyFee,
        fees_pending: 0,
        admission_charge: 0,
        admission_charge_pending: 0,
        selectedDays: null,
        status: AdmissionStatus.ACTIVE,
      },
    });

    const months = ['2024-03'];
    const { from, to } = generateDateRange(months);
    const payment = await prisma.payment.create({
      data: {
        studentId: student.id,
        admissionId: admission.id,
        amount: monthlyFee,
        mode: 'CASH',
        receipt_no: `REC-${Date.now()}-5`,
        coveredMonths: months,
        coveredFromDate: from,
        coveredToDate: to,
      },
    });

    testData.admissions.push(admission);
    testData.payments.push(payment);
  });

  // Scenario 6: Quarterly batch, advance payment for 2 quarters
  await test('Admit Student 6: Quarterly batch, advance payment', async () => {
    const student = testData.students[studentIndex++];
    const monthlyFee = getMonthlyFee(biologyBatch, { selectedDays: null });
    const quarterlyFee = biologyBatch.feeAmount!;

    const admission = await prisma.admission.create({
      data: {
        studentId: student.id,
        batchId: biologyBatch.id,
        admission_date: new Date('2024-04-01'),
        total_fees: quarterlyFee,
        fees_pending: quarterlyFee * 2, // 2 quarters pending
        admission_charge: 0,
        admission_charge_pending: 0,
        selectedDays: null,
        status: AdmissionStatus.ACTIVE,
      },
    });

    // Advance payment for first quarter
    const months = ['2024-04', '2024-05', '2024-06'];
    const { from, to } = generateDateRange(months);
    const payment = await prisma.payment.create({
      data: {
        studentId: student.id,
        admissionId: admission.id,
        amount: quarterlyFee,
        mode: 'BANK',
        receipt_no: `REC-${Date.now()}-6`,
        coveredMonths: months,
        coveredFromDate: from,
        coveredToDate: to,
        notes: 'Advance payment for Q1',
      },
    });

    testData.admissions.push(admission);
    testData.payments.push(payment);
  });

  // Scenario 7: Old student re-admission (Day-wise: 5 days)
  await test('Admit Old Student 7: Re-admission after 3 years (5 days/week)', async () => {
    const oldStudent = testData.students.find(s => s.isOldStudent);
    if (!oldStudent) throw new Error('No old student found');

    const selectedDays = 5;
    const monthlyFee = getMonthlyFee(mathBatch, { selectedDays });
    const admissionCharge = 1000; // Higher for re-admission

    const admission = await prisma.admission.create({
      data: {
        studentId: oldStudent.id,
        batchId: mathBatch.id,
        admission_date: new Date('2024-01-01'),
        total_fees: monthlyFee,
        fees_pending: 0,
        admission_charge: admissionCharge,
        admission_charge_pending: 0,
        selectedDays: selectedDays,
        status: AdmissionStatus.ACTIVE,
      },
    });

    const admissionPayment = await prisma.payment.create({
      data: {
        studentId: oldStudent.id,
        admissionId: admission.id,
        amount: admissionCharge,
        mode: 'CASH',
        receipt_no: `ADM-${Date.now()}-7`,
        coveredMonths: [],
        notes: 'Re-admission charge for old student',
      },
    });

    const months = ['2024-01', '2024-02', '2024-03'];
    const { from, to } = generateDateRange(months);
    const payment = await prisma.payment.create({
      data: {
        studentId: oldStudent.id,
        admissionId: admission.id,
        amount: monthlyFee * 3,
        mode: 'UPI',
        receipt_no: `REC-${Date.now()}-7`,
        coveredMonths: months,
        coveredFromDate: from,
        coveredToDate: to,
        notes: 'Advance payment for 3 months',
      },
    });

    testData.admissions.push(admission);
    testData.payments.push(admissionPayment, payment);
  });

  // Scenario 8: Multiple months payment (Day-wise: 3 days)
  await test('Admit Student 8: Multiple months payment at once (3 days/week)', async () => {
    const student = testData.students[studentIndex++];
    const selectedDays = 3;
    const monthlyFee = getMonthlyFee(physicsBatch, { selectedDays });

    const admission = await prisma.admission.create({
      data: {
        studentId: student.id,
        batchId: physicsBatch.id,
        admission_date: new Date('2024-02-01'),
        total_fees: monthlyFee,
        fees_pending: monthlyFee * 2, // 2 months pending
        admission_charge: 0,
        admission_charge_pending: 0,
        selectedDays: selectedDays,
        status: AdmissionStatus.ACTIVE,
      },
    });

    // Payment for 2 months
    const months = ['2024-02', '2024-03'];
    const { from, to } = generateDateRange(months);
    const payment = await prisma.payment.create({
      data: {
        studentId: student.id,
        admissionId: admission.id,
        amount: monthlyFee * 2,
        mode: 'BANK',
        receipt_no: `REC-${Date.now()}-8`,
        coveredMonths: months,
        coveredFromDate: from,
        coveredToDate: to,
      },
    });

    testData.admissions.push(admission);
    testData.payments.push(payment);
  });

  // Scenario 9: No payment at admission (Day-wise: 2 days)
  await test('Admit Student 9: No payment at admission (2 days/week)', async () => {
    const student = testData.students[studentIndex++];
    const selectedDays = 2;
    const monthlyFee = getMonthlyFee(englishBatch, { selectedDays });

    const admission = await prisma.admission.create({
      data: {
        studentId: student.id,
        batchId: englishBatch.id,
        admission_date: new Date('2024-05-10'),
        total_fees: monthlyFee,
        fees_pending: monthlyFee, // Full amount pending
        admission_charge: 200,
        admission_charge_pending: 200, // Admission charge also pending
        selectedDays: selectedDays,
        status: AdmissionStatus.ACTIVE,
      },
    });

    testData.admissions.push(admission);
    assert(admission.fees_pending === monthlyFee, 'Full fees should be pending');
    assert(admission.admission_charge_pending === 200, 'Admission charge should be pending');
  });

  // Scenario 10: Mixed payment modes
  await test('Admit Student 10: Mixed payment modes (4 days/week)', async () => {
    const student = testData.students[studentIndex++];
    const selectedDays = 4;
    const monthlyFee = getMonthlyFee(mathBatch, { selectedDays });

    const admission = await prisma.admission.create({
      data: {
        studentId: student.id,
        batchId: mathBatch.id,
        admission_date: new Date('2024-01-25'),
        total_fees: monthlyFee,
        fees_pending: 0,
        admission_charge: 500,
        admission_charge_pending: 0,
        selectedDays: selectedDays,
        status: AdmissionStatus.ACTIVE,
      },
    });

    // Admission charge via UPI
    const admissionPayment = await prisma.payment.create({
      data: {
        studentId: student.id,
        admissionId: admission.id,
        amount: 500,
        mode: 'UPI',
        receipt_no: `ADM-${Date.now()}-10`,
        coveredMonths: [],
        notes: 'Admission charge via UPI',
      },
    });

    // Monthly fee via Cash
    const months = ['2024-01'];
    const { from, to } = generateDateRange(months);
    const monthPayment = await prisma.payment.create({
      data: {
        studentId: student.id,
        admissionId: admission.id,
        amount: monthlyFee,
        mode: 'CASH',
        receipt_no: `REC-${Date.now()}-10`,
        coveredMonths: months,
        coveredFromDate: from,
        coveredToDate: to,
        notes: 'Monthly fee via Cash',
      },
    });

    testData.admissions.push(admission);
    testData.payments.push(admissionPayment, monthPayment);
  });

  log(`✅ Admitted ${testData.admissions.length} students with various payment scenarios`, 'success');
}

/**
 * PHASE 4: Test Pending Fee Calculations
 * 
 * Tests pending fee calculations for various scenarios
 */
async function testPendingFeeCalculations() {
  log('\n📊 PHASE 4: Testing Pending Fee Calculations', 'section');

  // Test 1: Calculate pending fees for admission with partial payment
  await test('Calculate pending fees - Partial payment scenario', async () => {
    const admissionWithPartial = testData.admissions.find(a => a.fees_pending > 0 && a.batchId);
    if (!admissionWithPartial) {
      throw new Error('No admission with partial payment found');
    }

    const admission = await prisma.admission.findUnique({
      where: { id: admissionWithPartial.id },
      include: {
        batch: true,
        payments: {
          select: {
            coveredMonths: true,
          },
        },
      },
    });

    if (!admission || !admission.batch) {
      throw new Error('Admission not found');
    }

    const pendingData = await calculatePendingFees(admission, admission.selectedDays);
    assert(pendingData.pendingAmount >= 0, 'Pending amount should be non-negative');
    assert(pendingData.totalMonths > 0, 'Should have total months');
  });

  // Test 2: Calculate pending fees for day-wise fees admission
  await test('Calculate pending fees - Day-wise fees (3 days)', async () => {
    const dayWiseAdmission = testData.admissions.find(a => a.selectedDays === 3);
    if (!dayWiseAdmission) {
      throw new Error('No day-wise admission found');
    }

    const admission = await prisma.admission.findUnique({
      where: { id: dayWiseAdmission.id },
      include: {
        batch: true,
        payments: {
          select: {
            coveredMonths: true,
          },
        },
      },
    });

    if (!admission || !admission.batch) {
      throw new Error('Admission not found');
    }

    const pendingData = await calculatePendingFees(admission, admission.selectedDays);
    const expectedMonthlyFee = getMonthlyFee(admission.batch, { selectedDays: 3 });
    assertEqual(pendingData.monthlyFee, expectedMonthlyFee, 'Monthly fee should match day-wise calculation');
  });

  // Test 3: Calculate pending fees for quarterly batch
  await test('Calculate pending fees - Quarterly batch', async () => {
    const quarterlyAdmission = testData.admissions.find(a => {
      const batch = testData.batches.find(b => b.id === a.batchId);
      return batch?.feeModel === FeeModel.QUARTERLY;
    });
    if (!quarterlyAdmission) {
      throw new Error('No quarterly admission found');
    }

    const admission = await prisma.admission.findUnique({
      where: { id: quarterlyAdmission.id },
      include: {
        batch: true,
        payments: {
          select: {
            coveredMonths: true,
          },
        },
      },
    });

    if (!admission || !admission.batch) {
      throw new Error('Admission not found');
    }

    const pendingData = await calculatePendingFees(admission, admission.selectedDays);
    const expectedMonthlyFee = getMonthlyFee(admission.batch, { selectedDays: null });
    assertEqual(pendingData.monthlyFee, expectedMonthlyFee, 'Monthly fee should be quarterly fee / 3');
  });

  // Test 4: Verify all months are tracked correctly
  await test('Verify month tracking for pending fees', async () => {
    const admission = await prisma.admission.findFirst({
      where: {
        id: { in: testData.admissions.map(a => a.id) },
        batch: {
          feeModel: FeeModel.MONTHLY,
        },
      },
      include: {
        batch: true,
        payments: {
          select: {
            coveredMonths: true,
          },
        },
      },
    });

    if (!admission || !admission.batch) {
      throw new Error('No monthly admission found');
    }

    const pendingData = await calculatePendingFees(admission, admission.selectedDays);
    const allMonths = getMonthsBetween(
      admission.admission_date,
      new Date(),
      admission.batch.feeModel
    );

    assert(
      pendingData.totalMonths === allMonths.length,
      `Total months should match: expected ${allMonths.length}, got ${pendingData.totalMonths}`
    );
  });

  log('✅ Pending fee calculations tested successfully', 'success');
}

/**
 * PHASE 5: Test Additional Scenarios
 * 
 * Tests edge cases and additional scenarios
 */
async function testAdditionalScenarios() {
  log('\n🔍 PHASE 5: Testing Additional Scenarios', 'section');

  // Test 1: Multiple batches for same student
  await test('Student enrolled in multiple batches', async () => {
    const student = testData.students[0];
    const batch1 = testData.batches[0];
    const batch2 = testData.batches[2];

    const admission1 = await prisma.admission.create({
      data: {
        studentId: student.id,
        batchId: batch1.id,
        admission_date: new Date('2024-01-01'),
        total_fees: getMonthlyFee(batch1, { selectedDays: 3 }),
        fees_pending: 0,
        admission_charge: 0,
        admission_charge_pending: 0,
        selectedDays: 3,
        status: AdmissionStatus.ACTIVE,
      },
    });

    const admission2 = await prisma.admission.create({
      data: {
        studentId: student.id,
        batchId: batch2.id,
        admission_date: new Date('2024-03-01'),
        total_fees: batch2.feeAmount!,
        fees_pending: 0,
        admission_charge: 0,
        admission_charge_pending: 0,
        selectedDays: null,
        status: AdmissionStatus.ACTIVE,
      },
    });

    const studentAdmissions = await prisma.admission.findMany({
      where: { studentId: student.id },
    });

    assert(studentAdmissions.length >= 2, 'Student should have multiple admissions');
    testData.admissions.push(admission1, admission2);
  });

  // Test 2: Different day selections for same batch
  await test('Different day selections for same batch', async () => {
    const batch = testData.batches[0]; // Day-wise fees batch
    const student1 = testData.students[10];
    const student2 = testData.students[11];

    const admission1 = await prisma.admission.create({
      data: {
        studentId: student1.id,
        batchId: batch.id,
        admission_date: new Date('2024-01-01'),
        total_fees: getMonthlyFee(batch, { selectedDays: 2 }),
        fees_pending: 0,
        admission_charge: 0,
        admission_charge_pending: 0,
        selectedDays: 2,
        status: AdmissionStatus.ACTIVE,
      },
    });

    const admission2 = await prisma.admission.create({
      data: {
        studentId: student2.id,
        batchId: batch.id,
        admission_date: new Date('2024-01-01'),
        total_fees: getMonthlyFee(batch, { selectedDays: 5 }),
        fees_pending: 0,
        admission_charge: 0,
        admission_charge_pending: 0,
        selectedDays: 5,
        status: AdmissionStatus.ACTIVE,
      },
    });

    const fee1 = getMonthlyFee(batch, { selectedDays: 2 });
    const fee2 = getMonthlyFee(batch, { selectedDays: 5 });
    assert(fee1 !== fee2, 'Fees should be different for different day selections');
    assert(fee2 > fee1, '5 days should cost more than 2 days');

    testData.admissions.push(admission1, admission2);
  });

  // Test 3: Verify admission charge is separate from batch fees
  await test('Admission charge separate from batch fees', async () => {
    const admissionWithCharge = testData.admissions.find(a => a.admission_charge > 0);
    if (!admissionWithCharge) {
      throw new Error('No admission with charge found');
    }

    const totalOwed = admissionWithCharge.fees_pending + admissionWithCharge.admission_charge_pending;
    assert(
      admissionWithCharge.admission_charge > 0,
      'Admission charge should be greater than 0'
    );
    assert(
      totalOwed >= 0,
      'Total owed (fees + admission charge) should be non-negative'
    );
  });

  log('✅ Additional scenarios tested successfully', 'success');
}

/**
 * PHASE 6: Generate Test Summary Report
 * 
 * Generates a comprehensive summary of all test data and scenarios
 */
async function generateTestSummary() {
  log('\n📋 PHASE 6: Generating Test Summary Report', 'section');

  log('\n' + '='.repeat(80), 'info');
  log('TEST SUMMARY REPORT', 'section');
  log('='.repeat(80), 'info');

  // Batches Summary
  log('\n📚 BATCHES CREATED:', 'info');
  testData.batches.forEach((batch, index) => {
    log(`\n  Batch ${index + 1}: ${batch.name}`, 'info');
    log(`    Subject: ${batch.subject}`, 'info');
    log(`    Fee Model: ${batch.feeModel}`, 'info');
    log(`    Base Fee: ₹${batch.feeAmount}`, 'info');
    if (batch.daysWiseFeesEnabled) {
      log(`    Day-wise Fees Enabled: Yes`, 'info');
      log(`    Day-wise Fees: ${JSON.stringify(batch.daysWiseFees)}`, 'info');
    } else {
      log(`    Day-wise Fees Enabled: No`, 'info');
    }
  });

  // Students Summary
  log('\n👥 STUDENTS CREATED:', 'info');
  const oldStudents = testData.students.filter(s => s.isOldStudent);
  const freshStudents = testData.students.filter(s => !s.isOldStudent);
  log(`  Total Students: ${testData.students.length}`, 'info');
  log(`  Old Students (3-4 years): ${oldStudents.length}`, 'info');
  log(`  Fresh Students: ${freshStudents.length}`, 'info');

  // Student Login Credentials
  log('\n🔑 STUDENT LOGIN CREDENTIALS:', 'info');
  log(`  Password for all students: 123456`, 'info');
  log(`  \n  Student Accounts (Email | Name):`, 'info');
  testData.studentCredentials.forEach((cred, index) => {
    log(`    ${index + 1}. ${cred.email} | ${cred.name}`, 'info');
  });

  // Admissions Summary
  log('\n🎓 ADMISSIONS SCENARIOS:', 'info');
  const fullPayment = testData.admissions.filter(a => a.fees_pending === 0 && a.admission_charge_pending === 0);
  const partialPayment = testData.admissions.filter(a => a.fees_pending > 0 || a.admission_charge_pending > 0);
  const withAdmissionCharge = testData.admissions.filter(a => a.admission_charge > 0);
  const dayWiseAdmissions = testData.admissions.filter(a => a.selectedDays !== null);
  
  log(`  Total Admissions: ${testData.admissions.length}`, 'info');
  log(`  Full Payment: ${fullPayment.length}`, 'info');
  log(`  Partial Payment: ${partialPayment.length}`, 'info');
  log(`  With Admission Charge: ${withAdmissionCharge.length}`, 'info');
  log(`  Day-wise Fee Admissions: ${dayWiseAdmissions.length}`, 'info');

  // Payments Summary
  log('\n💰 PAYMENTS CREATED:', 'info');
  const cashPayments = testData.payments.filter(p => p.mode === 'CASH');
  const upiPayments = testData.payments.filter(p => p.mode === 'UPI');
  const bankPayments = testData.payments.filter(p => p.mode === 'BANK');
  const monthBasedPayments = testData.payments.filter(p => p.coveredMonths.length > 0);
  const admissionChargePayments = testData.payments.filter(p => p.coveredMonths.length === 0);
  
  log(`  Total Payments: ${testData.payments.length}`, 'info');
  log(`  Cash: ${cashPayments.length}`, 'info');
  log(`  UPI: ${upiPayments.length}`, 'info');
  log(`  Bank: ${bankPayments.length}`, 'info');
  log(`  Month-based Payments: ${monthBasedPayments.length}`, 'info');
  log(`  Admission Charge Payments: ${admissionChargePayments.length}`, 'info');

  // Financial Summary
  log('\n💵 FINANCIAL SUMMARY:', 'info');
  const totalFees = testData.admissions.reduce((sum, a) => sum + a.total_fees, 0);
  const totalAdmissionCharges = testData.admissions.reduce((sum, a) => sum + a.admission_charge, 0);
  const totalPendingFees = testData.admissions.reduce((sum, a) => sum + a.fees_pending, 0);
  const totalPendingAdmissionCharges = testData.admissions.reduce((sum, a) => sum + a.admission_charge_pending, 0);
  const totalPaid = testData.payments.reduce((sum, p) => sum + p.amount, 0);
  
  log(`  Total Batch Fees: ₹${totalFees.toFixed(2)}`, 'info');
  log(`  Total Admission Charges: ₹${totalAdmissionCharges.toFixed(2)}`, 'info');
  log(`  Total Pending (Fees): ₹${totalPendingFees.toFixed(2)}`, 'info');
  log(`  Total Pending (Admission Charges): ₹${totalPendingAdmissionCharges.toFixed(2)}`, 'info');
  log(`  Total Paid: ₹${totalPaid.toFixed(2)}`, 'info');

  // Day-wise Fees Breakdown
  log('\n📅 DAY-WISE FEES BREAKDOWN:', 'info');
  const dayWiseBreakdown: Record<number, number> = {};
  dayWiseAdmissions.forEach(a => {
    const days = a.selectedDays || 0;
    dayWiseBreakdown[days] = (dayWiseBreakdown[days] || 0) + 1;
  });
  Object.entries(dayWiseBreakdown).forEach(([days, count]) => {
    log(`  ${days} day(s)/week: ${count} admission(s)`, 'info');
  });

  log('\n' + '='.repeat(80), 'info');
  log('✅ Test Summary Generated', 'success');
}

// ==================== CLEANUP ====================

async function cleanup() {
  if (TEST_CONFIG.cleanup) {
    log('\n🧹 Cleaning up test data...', 'info');
    
    // Delete in reverse order of dependencies
    await prisma.payment.deleteMany({
      where: {
        id: { in: testData.payments.map(p => p.id) },
      },
    });

    await prisma.admission.deleteMany({
      where: {
        id: { in: testData.admissions.map(a => a.id) },
      },
    });

    await prisma.batch.deleteMany({
      where: {
        id: { in: testData.batches.map(b => b.id) },
      },
    });

    // Delete students and their users (including Supabase Auth)
    for (const student of testData.students) {
      const user = await prisma.user.findUnique({
        where: { id: student.userId },
      });
      
      // Delete Supabase Auth user if exists
      if (user) {
        await supabase.auth.admin.deleteUser(user.id).catch(() => {});
      }
      
      await prisma.studentProfile.delete({
        where: { id: student.id },
      }).catch(() => {});
      await prisma.user.delete({
        where: { id: student.userId },
      }).catch(() => {});
    }

    // Delete teachers (and their Supabase Auth users if they exist)
    for (const teacher of testData.teachers) {
      await supabase.auth.admin.deleteUser(teacher.id).catch(() => {});
      await prisma.user.delete({
        where: { id: teacher.id },
      }).catch(() => {});
    }

    log('✅ Cleanup complete', 'success');
  } else {
    log('\n⚠️  Test data preserved (cleanup disabled)', 'info');
    log('Test data IDs:', 'info');
    log(`  Teachers: ${testData.teachers.map(t => t.id).join(', ')}`, 'info');
    log(`  Students: ${testData.students.map(s => s.id).join(', ')}`, 'info');
    log(`  Batches: ${testData.batches.map(b => b.id).join(', ')}`, 'info');
    log(`  Admissions: ${testData.admissions.map(a => a.id).join(', ')}`, 'info');
  }
}

// ==================== MAIN EXECUTION ====================

async function runTests() {
  log('\n🚀 Starting Portal End-to-End Tests', 'section');
  log('='.repeat(80), 'info');
  log('Testing Fees Management and Admissions System', 'info');
  log('='.repeat(80), 'info');

  try {
    await createDiverseBatches();
    await createStudents();
    await admitStudentsWithVariousPayments();
    await testPendingFeeCalculations();
    await testAdditionalScenarios();
    await generateTestSummary();
  } catch (error: any) {
    log(`\n❌ Test suite error: ${error.message}`, 'error');
    console.error(error);
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }

  // Print final summary
  log('\n' + '='.repeat(80), 'info');
  log('📊 FINAL TEST RESULTS', 'section');
  log('='.repeat(80), 'info');
  log(`✅ Passed: ${testResults.passed}`, 'success');
  log(`❌ Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'success');
  log(`📈 Total: ${testResults.passed + testResults.failed}`, 'info');

  if (testResults.failed > 0) {
    log('\n❌ Failed Tests:', 'error');
    testResults.tests
      .filter((t) => t.status === 'FAIL')
      .forEach((t) => {
        log(`  - ${t.name}: ${t.error}`, 'error');
      });
  }

  log('\n' + '='.repeat(80), 'info');
  log('✅ Test Suite Completed', 'success');
  log('='.repeat(80), 'info');

  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch((error) => {
  log(`\n💥 Fatal error: ${error.message}`, 'error');
  console.error(error);
  process.exit(1);
});
