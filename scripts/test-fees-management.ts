/**
 * Fees Management System - Comprehensive Test Script
 * 
 * This script tests the month-based fees management system with various scenarios.
 * Run with: tsx scripts/test-fees-management.ts
 * 
 * Prerequisites:
 * - Database should be set up with schema
 * - At least one admin/receptionist user exists
 * - At least one teacher exists
 */

import { PrismaClient, FeeModel, AdmissionStatus } from '@prisma/client';
import {
  generateDateRange,
  getMonthsBetween,
  getMonthlyFee,
  validateMonthSelection,
  calculatePendingFees,
  formatMonth,
  quarterToMonths,
} from '../lib/fees-utils';

const prisma = new PrismaClient();

// Test configuration
const TEST_CONFIG = {
  cleanup: true, // Set to false to keep test data
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
function log(message: string, type: 'info' | 'success' | 'error' | 'test' = 'info') {
  const colors = {
    info: '\x1b[36m', // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m', // Red
    test: '\x1b[33m', // Yellow
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
      testResults.passed++;
      testResults.tests.push({ name, status: 'PASS' });
      if (TEST_CONFIG.verbose) {
        log(`✅ PASS: ${name}`, 'success');
      }
    } else {
      testResults.passed++;
      testResults.tests.push({ name, status: 'PASS' });
      if (TEST_CONFIG.verbose) {
        log(`✅ PASS: ${name}`, 'success');
      }
    }
  } catch (error: any) {
    testResults.failed++;
    testResults.tests.push({ name, status: 'FAIL', error: error.message });
    log(`❌ FAIL: ${name} - ${error.message}`, 'error');
    throw error; // Re-throw to stop dependent tests
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

// Test data
let testTeacher: any;
let testStudent: any;
let monthlyBatch: any;
let quarterlyBatch: any;
let daysWiseBatch: any;
let monthlyAdmission: any;
let quarterlyAdmission: any;

// ==================== TEST CASES ====================

async function testUtilityFunctions() {
  log('\n📦 Testing Utility Functions', 'info');

  await test('generateDateRange - single month', () => {
    const { from, to } = generateDateRange(['2025-01']);
    assert(from.getFullYear() === 2025 && from.getMonth() === 0, 'From date should be January 2025');
    assert(to.getFullYear() === 2025 && to.getMonth() === 0, 'To date should be January 2025');
    assert(to.getDate() === 31, 'To date should be last day of January');
  });

  await test('generateDateRange - multiple months', () => {
    const { from, to } = generateDateRange(['2025-01', '2025-02', '2025-03']);
    assert(from.getMonth() === 0, 'From should be January');
    assert(to.getMonth() === 2, 'To should be March');
    assert(to.getDate() === 31, 'To should be last day of March');
  });

  await test('getMonthsBetween - monthly', () => {
    const start = new Date('2025-01-15');
    const end = new Date('2025-03-20');
    const months = getMonthsBetween(start, end, FeeModel.MONTHLY);
    assertEqual(months.length, 3, 'Should have 3 months');
    assert(months.includes('2025-01'), 'Should include January');
    assert(months.includes('2025-02'), 'Should include February');
    assert(months.includes('2025-03'), 'Should include March');
  });

  await test('getMonthsBetween - quarterly', () => {
    const start = new Date('2025-01-15');
    const end = new Date('2025-03-20');
    const months = getMonthsBetween(start, end, FeeModel.QUARTERLY);
    assert(months.length >= 3, 'Should include all months in quarter');
  });

  await test('quarterToMonths', () => {
    const months = quarterToMonths('2025-Q1');
    assertEqual(months.length, 3, 'Quarter should have 3 months');
    assert(months.includes('2025-01'), 'Should include January');
    assert(months.includes('2025-02'), 'Should include February');
    assert(months.includes('2025-03'), 'Should include March');
  });

  await test('formatMonth', () => {
    const formatted = formatMonth('2025-01');
    assert(formatted.includes('January'), 'Should format to readable month');
    assert(formatted.includes('2025'), 'Should include year');
  });

  await test('getMonthlyFee - monthly batch', () => {
    const fee = getMonthlyFee(
      { feeModel: FeeModel.MONTHLY, feeAmount: 2000, daysWiseFeesEnabled: false, daysWiseFees: null },
      { selectedDays: null }
    );
    assertEqual(fee, 2000, 'Monthly fee should be 2000');
  });

  await test('getMonthlyFee - quarterly batch', () => {
    const fee = getMonthlyFee(
      { feeModel: FeeModel.QUARTERLY, feeAmount: 6000, daysWiseFeesEnabled: false, daysWiseFees: null },
      { selectedDays: null }
    );
    assertEqual(fee, 2000, 'Quarterly fee divided by 3 should be 2000');
  });

  await test('getMonthlyFee - days-wise fees', () => {
    const fee = getMonthlyFee(
      {
        feeModel: FeeModel.MONTHLY,
        feeAmount: 2000,
        daysWiseFeesEnabled: true,
        daysWiseFees: { '3': 1500 },
      },
      { selectedDays: 3 }
    );
    assertEqual(fee, 1500, 'Days-wise fee for 3 days should be 1500');
  });

  await test('validateMonthSelection - no duplicates', () => {
    const result = validateMonthSelection(['2025-01', '2025-02'], []);
    assert(result.isValid, 'Should be valid when no existing payments');
  });

  await test('validateMonthSelection - with duplicates', () => {
    const result = validateMonthSelection(
      ['2025-01', '2025-02'],
      [{ coveredMonths: ['2025-01'] }]
    );
    assert(!result.isValid, 'Should be invalid when duplicate months');
    assert(result.duplicates?.includes('2025-01'), 'Should identify duplicate month');
  });
}

async function testDatabaseOperations() {
  log('\n💾 Testing Database Operations', 'info');

  // Setup test data - these must run sequentially
  await test('Create test teacher', async () => {
    testTeacher = await prisma.user.create({
      data: {
        name: 'Test Teacher',
        email: `test-teacher-${Date.now()}@test.com`,
        role: 'TEACHER',
      },
    });
    assert(!!testTeacher, 'Teacher should be created');
  });

  await test('Create test student', async () => {
    const user = await prisma.user.create({
      data: {
        name: 'Test Student',
        email: `test-student-${Date.now()}@test.com`,
        role: 'STUDENT',
      },
    });

    testStudent = await prisma.studentProfile.create({
      data: {
        userId: user.id,
        phone: '1234567890',
        service_type: 'TUITION_BATCH',
      },
    });
    assert(!!testStudent, 'Student should be created');
  });

  await test('Create monthly batch', async () => {
    monthlyBatch = await prisma.batch.create({
      data: {
        name: 'Test Monthly Batch',
        subject: 'Mathematics',
        teacherId: testTeacher.id,
        schedule: 'Mon, Wed, Fri',
        capacity: 30,
        feeModel: FeeModel.MONTHLY,
        feeAmount: 2000,
        isActive: true,
      },
    });
    assert(!!monthlyBatch, 'Monthly batch should be created');
  });

  await test('Create quarterly batch', async () => {
    quarterlyBatch = await prisma.batch.create({
      data: {
        name: 'Test Quarterly Batch',
        subject: 'Physics',
        teacherId: testTeacher.id,
        schedule: 'Tue, Thu',
        capacity: 25,
        feeModel: FeeModel.QUARTERLY,
        feeAmount: 6000,
        isActive: true,
      },
    });
    assert(!!quarterlyBatch, 'Quarterly batch should be created');
  });

  await test('Create days-wise batch', async () => {
    daysWiseBatch = await prisma.batch.create({
      data: {
        name: 'Test Days-Wise Batch',
        subject: 'Chemistry',
        teacherId: testTeacher.id,
        schedule: 'Mon-Fri',
        capacity: 20,
        feeModel: FeeModel.MONTHLY,
        feeAmount: 2000,
        daysWiseFeesEnabled: true,
        daysWiseFees: { '1': 500, '2': 900, '3': 1200, '4': 1500 },
        isActive: true,
      },
    });
    assert(!!daysWiseBatch, 'Days-wise batch should be created');
  });

  await test('Create monthly admission', async () => {
    monthlyAdmission = await prisma.admission.create({
      data: {
        studentId: testStudent.id,
        batchId: monthlyBatch.id,
        admission_date: new Date('2025-01-15'),
        total_fees: 2000,
        fees_pending: 2000,
        status: AdmissionStatus.ACTIVE,
      },
    });
    assert(!!monthlyAdmission, 'Monthly admission should be created');
    assertEqual(monthlyAdmission.status, AdmissionStatus.ACTIVE, 'Status should be ACTIVE');
  });

  await test('Create quarterly admission', async () => {
    quarterlyAdmission = await prisma.admission.create({
      data: {
        studentId: testStudent.id,
        batchId: quarterlyBatch.id,
        admission_date: new Date('2025-01-15'),
        total_fees: 6000,
        fees_pending: 6000,
        status: AdmissionStatus.ACTIVE,
      },
    });
    assert(!!quarterlyAdmission, 'Quarterly admission should be created');
  });
}

async function testPaymentOperations() {
  log('\n💰 Testing Payment Operations', 'info');

  await test('Create month-based payment - single month', async () => {
    const months = ['2025-01'];
    const { from, to } = generateDateRange(months);
    const monthlyFee = getMonthlyFee(monthlyBatch, { selectedDays: null });

    const payment = await prisma.payment.create({
      data: {
        studentId: testStudent.id,
        admissionId: monthlyAdmission.id,
        amount: monthlyFee,
        mode: 'CASH',
        receipt_no: `REC-${Date.now()}-1`,
        coveredMonths: months,
        coveredFromDate: from,
        coveredToDate: to,
      },
    });

    assert(!!payment, 'Payment should be created');
    assertEqual(payment.coveredMonths.length, 1, 'Should have 1 covered month');
    assertEqual(payment.amount, 2000, 'Amount should match monthly fee');
  });

  await test('Create month-based payment - multiple months', async () => {
    const months = ['2025-02', '2025-03'];
    const { from, to } = generateDateRange(months);
    const monthlyFee = getMonthlyFee(monthlyBatch, { selectedDays: null });

    const payment = await prisma.payment.create({
      data: {
        studentId: testStudent.id,
        admissionId: monthlyAdmission.id,
        amount: monthlyFee * 2,
        mode: 'UPI',
        receipt_no: `REC-${Date.now()}-2`,
        coveredMonths: months,
        coveredFromDate: from,
        coveredToDate: to,
      },
    });

    assert(!!payment, 'Payment should be created');
    assertEqual(payment.coveredMonths.length, 2, 'Should have 2 covered months');
    assertEqual(payment.amount, 4000, 'Amount should be 2x monthly fee');
  });

  await test('Prevent duplicate month payment', async () => {
    const existingPayments = await prisma.payment.findMany({
      where: { admissionId: monthlyAdmission.id },
      select: { coveredMonths: true },
    });

    const validation = validateMonthSelection(['2025-01'], existingPayments);
    assert(!validation.isValid, 'Should reject duplicate month');
  });

  await test('Create days-wise payment', async () => {
    const daysWiseAdmission = await prisma.admission.create({
      data: {
        studentId: testStudent.id,
        batchId: daysWiseBatch.id,
        admission_date: new Date('2025-01-15'),
        total_fees: 1200,
        fees_pending: 1200,
        selectedDays: 3,
        status: AdmissionStatus.ACTIVE,
      },
    });

    const months = ['2025-01'];
    const { from, to } = generateDateRange(months);
    const monthlyFee = getMonthlyFee(daysWiseBatch, { selectedDays: 3 });

    const payment = await prisma.payment.create({
      data: {
        studentId: testStudent.id,
        admissionId: daysWiseAdmission.id,
        amount: monthlyFee,
        mode: 'BANK',
        receipt_no: `REC-${Date.now()}-3`,
        coveredMonths: months,
        coveredFromDate: from,
        coveredToDate: to,
      },
    });

    assertEqual(payment.amount, 1200, 'Days-wise fee for 3 days should be 1200');
  });
}

async function testPendingFeeCalculation() {
  log('\n📊 Testing Pending Fee Calculation', 'info');

  await test('Calculate pending fees - monthly', async () => {
    const admission = await prisma.admission.findUnique({
      where: { id: monthlyAdmission.id },
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

    assert(pendingData.totalMonths > 0, 'Should have total months');
    assert(pendingData.coveredMonths >= 1, 'Should have at least 1 covered month');
    assert(pendingData.pendingAmount >= 0, 'Pending amount should be non-negative');
  });

  await test('Calculate pending fees - quarterly', async () => {
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

    assert(pendingData.monthlyFee === 2000, 'Quarterly monthly fee should be 2000 (6000/3)');
  });
}

async function testBatchArchiving() {
  log('\n📦 Testing Batch Archiving', 'info');

  await test('Archive batch - should set endDate and update admissions', async () => {
    const batchToArchive = await prisma.batch.create({
      data: {
        name: 'Batch to Archive',
        subject: 'Test',
        teacherId: testTeacher.id,
        schedule: 'Mon-Fri',
        capacity: 10,
        feeModel: FeeModel.MONTHLY,
        feeAmount: 1000,
        isActive: true,
      },
    });

    const admission = await prisma.admission.create({
      data: {
        studentId: testStudent.id,
        batchId: batchToArchive.id,
        admission_date: new Date('2025-01-01'),
        total_fees: 1000,
        fees_pending: 1000,
        status: AdmissionStatus.ACTIVE,
      },
    });

    // Archive the batch
    const archivedBatch = await prisma.batch.update({
      where: { id: batchToArchive.id },
      data: {
        isActive: false,
        endDate: new Date(),
      },
    });

    // Update admissions to COMPLETED
    await prisma.admission.updateMany({
      where: {
        batchId: batchToArchive.id,
        status: AdmissionStatus.ACTIVE,
      },
      data: {
        status: AdmissionStatus.COMPLETED,
        endDate: archivedBatch.endDate,
      },
    });

    const updatedAdmission = await prisma.admission.findUnique({
      where: { id: admission.id },
    });

    assert(!archivedBatch.isActive, 'Batch should be inactive');
    assert(!!archivedBatch.endDate, 'Batch should have endDate');
    assertEqual(updatedAdmission?.status, AdmissionStatus.COMPLETED, 'Admission should be COMPLETED');
  });
}

async function testEdgeCases() {
  log('\n🔍 Testing Edge Cases', 'info');

  await test('Mid-month admission handling', async () => {
    const admission = await prisma.admission.create({
      data: {
        studentId: testStudent.id,
        batchId: monthlyBatch.id,
        admission_date: new Date('2025-01-15'), // Mid-month
        total_fees: 2000,
        fees_pending: 2000,
        status: AdmissionStatus.ACTIVE,
      },
    });

    const months = getMonthsBetween(
      admission.admission_date,
      new Date('2025-03-31'),
      FeeModel.MONTHLY
    );

    // Should include January even though admission was mid-month
    assert(months.includes('2025-01'), 'Should include admission month');
  });

  await test('Future payment (advance payment)', async () => {
    const months = ['2025-06', '2025-07']; // Future months
    const { from, to } = generateDateRange(months);

    const payment = await prisma.payment.create({
      data: {
        studentId: testStudent.id,
        admissionId: monthlyAdmission.id,
        amount: 4000,
        mode: 'CASH',
        receipt_no: `REC-${Date.now()}-future`,
        coveredMonths: months,
        coveredFromDate: from,
        coveredToDate: to,
        notes: 'Advance payment',
      },
    });

    assert(!!payment, 'Future payment should be allowed');
    assertEqual(payment.coveredMonths.length, 2, 'Should have 2 future months');
  });

  await test('Withdrawn student - pending calculation stops at withdrawal date', async () => {
    const admission = await prisma.admission.create({
      data: {
        studentId: testStudent.id,
        batchId: monthlyBatch.id,
        admission_date: new Date('2025-01-01'),
        total_fees: 2000,
        fees_pending: 2000,
        status: AdmissionStatus.WITHDRAWN,
        endDate: new Date('2025-02-15'), // Withdrawn mid-February
      },
    });

    const pendingData = await calculatePendingFees(
      {
        ...admission,
        batch: monthlyBatch,
        payments: [],
      },
      null
    );

    // Should only calculate up to withdrawal date
    assert(pendingData.calculationEndDate <= admission.endDate!, 'Calculation should stop at withdrawal');
  });
}

async function cleanup() {
  if (TEST_CONFIG.cleanup) {
    log('\n🧹 Cleaning up test data...', 'info');
    
    // Delete in reverse order of dependencies
    await prisma.payment.deleteMany({
      where: {
        studentId: testStudent?.id,
      },
    });

    await prisma.admission.deleteMany({
      where: {
        studentId: testStudent?.id,
      },
    });

    await prisma.batch.deleteMany({
      where: {
        teacherId: testTeacher?.id,
      },
    });

    if (testStudent) {
      await prisma.studentProfile.delete({
        where: { id: testStudent.id },
      });
      await prisma.user.deleteMany({
        where: {
          id: { in: [testStudent.userId] },
        },
      });
    }

    if (testTeacher) {
      await prisma.user.delete({
        where: { id: testTeacher.id },
      });
    }

    log('✅ Cleanup complete', 'success');
  } else {
    log('\n⚠️  Test data preserved (cleanup disabled)', 'info');
  }
}

// ==================== MAIN EXECUTION ====================

async function runTests() {
  log('🚀 Starting Fees Management System Tests', 'info');
  log('=' .repeat(60), 'info');

  try {
    await testUtilityFunctions();
    await testDatabaseOperations();
    await testPaymentOperations();
    await testPendingFeeCalculation();
    await testBatchArchiving();
    await testEdgeCases();
  } catch (error: any) {
    log(`\n❌ Test suite error: ${error.message}`, 'error');
    console.error(error);
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }

  // Print summary
  log('\n' + '='.repeat(60), 'info');
  log('📊 Test Summary', 'info');
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

  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch((error) => {
  log(`\n💥 Fatal error: ${error.message}`, 'error');
  console.error(error);
  process.exit(1);
});
