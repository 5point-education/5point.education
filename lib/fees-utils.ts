import { FeeModel } from "@prisma/client";

/**
 * Generate date range from an array of month strings
 * @param months Array of month strings in format "YYYY-MM"
 * @returns Object with from and to dates
 */
export function generateDateRange(months: string[]): { from: Date; to: Date } {
  if (months.length === 0) {
    throw new Error("Months array cannot be empty");
  }

  // Sort months
  const sorted = [...months].sort();

  // First month: Start from 1st
  const firstMonth = sorted[0]; // "2025-01"
  const fromDate = new Date(`${firstMonth}-01`);
  fromDate.setHours(0, 0, 0, 0);

  // Last month: End on last day
  const lastMonth = sorted[sorted.length - 1]; // "2025-03"
  const lastDate = new Date(`${lastMonth}-01`);
  lastDate.setMonth(lastDate.getMonth() + 1);
  lastDate.setDate(0); // Last day of month
  lastDate.setHours(23, 59, 59, 999);

  return {
    from: fromDate,
    to: lastDate,
  };
}

/**
 * Get all months between two dates based on fee model
 * @param startDate Start date
 * @param endDate End date
 * @param feeModel Fee model (MONTHLY, QUARTERLY, etc.)
 * @returns Array of month strings in format "YYYY-MM"
 */
export function getMonthsBetween(
  startDate: Date,
  endDate: Date,
  feeModel: FeeModel | null
): string[] {
  if (feeModel === "ONE_TIME" || feeModel === "CUSTOM") {
    // For one-time or custom, return empty array or handle differently
    return [];
  }

  const months: string[] = [];
  const current = new Date(startDate);
  current.setDate(1); // Start from first day of month
  current.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  if (feeModel === "MONTHLY") {
    while (current <= end) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, "0");
      months.push(`${year}-${month}`);
      current.setMonth(current.getMonth() + 1);
    }
  } else if (feeModel === "QUARTERLY") {
    // For quarterly, we still track all months (not just quarter starts)
    // This allows flexibility in payment selection
    while (current <= end) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, "0");
      months.push(`${year}-${month}`);
      current.setMonth(current.getMonth() + 1);
    }
  }

  return months;
}

/**
 * Convert quarter string to months
 * @param quarter Quarter string in format "YYYY-Q1", "YYYY-Q2", etc.
 * @returns Array of month strings for that quarter
 */
export function quarterToMonths(quarter: string): string[] {
  const [year, q] = quarter.split("-Q");
  const quarterNum = parseInt(q);

  if (quarterNum < 1 || quarterNum > 4) {
    throw new Error(`Invalid quarter: ${quarter}`);
  }

  const startMonth = (quarterNum - 1) * 3 + 1;
  return [
    `${year}-${String(startMonth).padStart(2, "0")}`, // Jan, Apr, Jul, Oct
    `${year}-${String(startMonth + 1).padStart(2, "0")}`, // Feb, May, Aug, Nov
    `${year}-${String(startMonth + 2).padStart(2, "0")}`, // Mar, Jun, Sep, Dec
  ];
}

/**
 * Get monthly fee for a batch and admission
 * @param batch Batch object with fee configuration
 * @param admission Admission object with selectedDays and discount_value
 * @returns Monthly fee amount (after discount)
 */
export function getMonthlyFee(
  batch: {
    feeModel: FeeModel | null;
    feeAmount: number | null;
    daysWiseFeesEnabled: boolean;
    daysWiseFees: any;
  },
  admission: {
    selectedDays: number | null;
    discount_value?: number | null;
  }
): number {
  let baseFee = 0;
  const discountValue = admission.discount_value || 0;

  // For days-wise fees
  if (
    batch.daysWiseFeesEnabled &&
    batch.daysWiseFees &&
    admission.selectedDays
  ) {
    const daysWiseFees =
      typeof batch.daysWiseFees === "object"
        ? (batch.daysWiseFees as Record<string, number>)
        : {};
    baseFee = daysWiseFees[admission.selectedDays.toString()] || batch.feeAmount || 0;
    // For days-wise: Apply full discount (it's already a monthly fee)
    const discountedFee = baseFee - discountValue;
    return Math.max(0, Math.round(discountedFee * 100) / 100);
  } else if (batch.feeModel === "MONTHLY") {
    // For regular monthly fee: Apply full discount
    baseFee = batch.feeAmount || 0;
    const discountedFee = baseFee - discountValue;
    return Math.max(0, Math.round(discountedFee * 100) / 100);
  } else if (batch.feeModel === "QUARTERLY") {
    // For quarterly: Apply discount BEFORE dividing by 3
    // discount_value is per quarter, so monthly = (quarterly - discount) / 3
    const quarterlyFee = batch.feeAmount || 0;
    const discountedQuarterly = quarterlyFee - discountValue;
    const monthlyEquivalent = discountedQuarterly / 3;
    return Math.max(0, Math.round(monthlyEquivalent * 100) / 100);
  }

  // Fallback
  return Math.max(0, Math.round((baseFee - discountValue) * 100) / 100);
}

/**
 * Format month string to readable format
 * @param month Month string in format "YYYY-MM"
 * @returns Formatted string like "January 2025"
 */
export function formatMonth(month: string): string {
  const [year, monthNum] = month.split("-");
  const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/**
 * Get all available months for selection (from admission date to end date or today)
 * @param admissionDate Admission date
 * @param endDate Optional end date (batch end, withdrawal, etc.)
 * @param feeModel Fee model
 * @returns Array of month strings
 */
export function getAvailableMonths(
  admissionDate: Date,
  endDate: Date | null,
  feeModel: FeeModel | null
): string[] {
  const end = endDate || new Date();
  return getMonthsBetween(admissionDate, end, feeModel);
}

/**
 * Validate month selection - check for duplicates
 * @param admissionId Admission ID
 * @param months Months to validate
 * @param existingPayments Existing payments for this admission
 * @returns Object with isValid flag and error message
 */
export function validateMonthSelection(
  months: string[],
  existingPayments: { coveredMonths: string[] }[]
): { isValid: boolean; error?: string; duplicates?: string[] } {
  if (months.length === 0) {
    return { isValid: false, error: "At least one month must be selected" };
  }

  // Collect all already paid months
  const alreadyPaid = new Set<string>();
  existingPayments.forEach((payment) => {
    payment.coveredMonths.forEach((month) => {
      alreadyPaid.add(month);
    });
  });

  // Check for duplicates
  const duplicates = months.filter((month) => alreadyPaid.has(month));

  if (duplicates.length > 0) {
    return {
      isValid: false,
      error: `Months already paid: ${duplicates.map(formatMonth).join(", ")}`,
      duplicates,
    };
  }

  return { isValid: true };
}

/**
 * Get future months for advance payment
 * @param startDate Start date (usually today)
 * @param monthsAhead Number of months ahead to generate (default: 12)
 * @param feeModel Fee model
 * @param batchEndDate Optional batch end date to limit future months
 * @returns Array of month strings for future months
 */
export function getFutureMonths(
  startDate: Date,
  monthsAhead: number = 12,
  feeModel: FeeModel | null,
  batchEndDate: Date | null = null
): string[] {
  if (feeModel === "ONE_TIME" || feeModel === "CUSTOM") {
    return [];
  }

  const futureMonths: string[] = [];
  const current = new Date(startDate);
  current.setDate(1); // Start from first day of month
  current.setMonth(current.getMonth() + 1); // Start from next month
  current.setHours(0, 0, 0, 0);

  const endDate = batchEndDate || new Date();
  endDate.setHours(23, 59, 59, 999);

  // Calculate end date for future months (startDate + monthsAhead)
  const futureEndDate = new Date(startDate);
  futureEndDate.setMonth(futureEndDate.getMonth() + monthsAhead);
  futureEndDate.setHours(23, 59, 59, 999);

  // Use the earlier of: batch end date or monthsAhead limit
  const actualEndDate = batchEndDate && batchEndDate < futureEndDate 
    ? batchEndDate 
    : futureEndDate;

  let count = 0;
  while (current <= actualEndDate && count < monthsAhead) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, "0");
    futureMonths.push(`${year}-${month}`);
    current.setMonth(current.getMonth() + 1);
    count++;
  }

  return futureMonths;
}

/**
 * Calculate pending fees for an admission
 * This is a helper function that can be used directly in API routes
 */
export async function calculatePendingFees(
  admission: {
    id: string;
    admission_date: Date;
    status: string;
    endDate: Date | null;
    discount_value?: number | null;
    batch: {
      feeModel: any;
      feeAmount: number | null;
      daysWiseFeesEnabled: boolean;
      daysWiseFees: any;
      endDate: Date | null;
      isActive: boolean;
      updatedAt: Date;
    } | null;
    payments: { coveredMonths: string[] }[];
  },
  selectedDays: number | null
): Promise<{
  totalMonths: number;
  coveredMonths: number;
  pendingMonths: string[];
  pendingAmount: number;
  monthlyFee: number;
  calculationEndDate: Date;
  futureMonths: string[]; // NEW: Months available for advance payment
}> {
  if (!admission.batch) {
    throw new Error("Admission has no batch");
  }

  // Skip calculation for ONE_TIME or CUSTOM fee models
  if (
    admission.batch.feeModel === "ONE_TIME" ||
    admission.batch.feeModel === "CUSTOM"
  ) {
    return {
      totalMonths: 0,
      coveredMonths: 0,
      pendingMonths: [],
      pendingAmount: 0,
      monthlyFee: 0,
      calculationEndDate: new Date(),
      futureMonths: [],
    };
  }

  // 1. Determine calculation end date
  let calculationEndDate: Date;

  if (admission.status === "WITHDRAWN" && admission.endDate) {
    calculationEndDate = admission.endDate;
  } else if (admission.batch.endDate) {
    calculationEndDate = admission.batch.endDate;
  } else if (!admission.batch.isActive) {
    calculationEndDate = admission.batch.updatedAt; // Archive date
  } else {
    calculationEndDate = new Date(); // Today
  }

  // 2. Calculate all months since admission
  const allMonths = getMonthsBetween(
    admission.admission_date,
    calculationEndDate,
    admission.batch.feeModel
  );

  // 3. Get covered months from payments
  const coveredMonthsSet = new Set<string>();
  admission.payments.forEach((payment) => {
    payment.coveredMonths.forEach((month) => {
      coveredMonthsSet.add(month);
    });
  });

  // 4. Calculate pending months (only up to calculation end date)
  const pendingMonths = allMonths.filter(
    (month) => !coveredMonthsSet.has(month)
  );

  // 5. Calculate pending amount (with discount applied)
  const monthlyFee = getMonthlyFee(admission.batch, { 
    selectedDays,
    discount_value: admission.discount_value || 0
  });
  const pendingAmount = pendingMonths.length * monthlyFee;

  // 6. Get future months for advance payment (only if batch is active and not withdrawn)
  let futureMonths: string[] = [];
  if (
    admission.status !== "WITHDRAWN" &&
    admission.batch.isActive &&
    !admission.batch.endDate // Only show future months if batch doesn't have an end date
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    futureMonths = getFutureMonths(
      today,
      12, // Allow up to 12 months ahead
      admission.batch.feeModel,
      admission.batch.endDate
    );
    // Filter out already paid future months
    futureMonths = futureMonths.filter(
      (month) => !coveredMonthsSet.has(month)
    );
  }

  return {
    totalMonths: allMonths.length,
    coveredMonths: coveredMonthsSet.size,
    pendingMonths,
    pendingAmount,
    monthlyFee,
    calculationEndDate,
    futureMonths, // NEW: Available for advance payment
  };
}
