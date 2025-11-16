import prisma from '../prismaClient';

/**
 * Custom error class for installment calculation errors
 */
class CalculationError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'CalculationError';
  }
}

/**
 * Interface for payment schedule item
 */
interface PaymentScheduleItem {
  sequenceNumber: number;
  dueDate: Date;
  totalAmount: number;
  principalAmount: number;
  extraAmount: number;
}

/**
 * Interface for installment calculation result
 */
interface InstallmentCalculation {
  financedAmount: number;
  ratioMultiplier: number;
  totalWithRatio: number;
  monthlyAmount: number;
  totalToPay: number;
}

/**
 * Service for handling installment calculations
 */
class InstallmentCalculationService {
  /**
   * Calculate monthly payment (pay in advance - no deposit, no ratio)
   * @param productPrice - Product cash price (already includes any markup)
   * @param termMonths - Term length in months
   * @returns Promise resolving to calculation details
   */
  async calculateMonthlyPayment(
    productPrice: number,
    termMonths: number
  ): Promise<InstallmentCalculation> {
    try {
      // Validate term months - only 3 or 6 months allowed
      if (termMonths !== 3 && termMonths !== 6) {
        throw new CalculationError('INVALID_TERM', 'فقط خطط 3 أو 6 أشهر مسموح بها');
      }

      // Simple calculation: divide product price by number of months
      const financedAmount = productPrice;
      const monthlyAmount = productPrice / termMonths;
      const totalToPay = productPrice;

      return {
        financedAmount,
        ratioMultiplier: 1.0, // No ratio applied
        totalWithRatio: productPrice,
        monthlyAmount: Math.round(monthlyAmount * 100) / 100, // Round to 2 decimal places
        totalToPay: Math.round(totalToPay * 100) / 100,
      };
    } catch (error) {
      if (error instanceof CalculationError) {
        throw error;
      }
      console.error('Calculate monthly payment error:', error);
      throw new Error('Failed to calculate monthly payment');
    }
  }

  /**
   * Generate payment schedule with due dates
   * @param startDate - Start date for installments
   * @param termMonths - Number of months
   * @param monthlyAmount - Monthly payment amount
   * @param financedAmount - Financed amount (principal)
   * @returns Array of payment schedule items
   */
  generatePaymentSchedule(
    startDate: Date,
    termMonths: number,
    monthlyAmount: number,
    financedAmount: number
  ): PaymentScheduleItem[] {
    const schedule: PaymentScheduleItem[] = [];
    const principalPerMonth = financedAmount / termMonths;
    const extraPerMonth = monthlyAmount - principalPerMonth;

    for (let i = 0; i < termMonths; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      schedule.push({
        sequenceNumber: i + 1,
        dueDate,
        totalAmount: Math.round(monthlyAmount * 100) / 100,
        principalAmount: Math.round(principalPerMonth * 100) / 100,
        extraAmount: Math.round(extraPerMonth * 100) / 100,
      });
    }

    return schedule;
  }

  /**
   * Validate deposit amount against product requirements
   * @param depositAmount - Deposit amount
   * @param productId - Product ID
   * @returns Promise resolving to validation result
   */
  async validateDeposit(depositAmount: number, productId: number): Promise<boolean> {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new CalculationError('PRODUCT_NOT_FOUND', 'المنتج غير موجود');
      }

      // Check if deposit is required
      if (product.requiresDeposit && product.minDepositAmount) {
        const minDeposit = Number(product.minDepositAmount);
        if (depositAmount < minDeposit) {
          throw new CalculationError(
            'INSUFFICIENT_DEPOSIT',
            `المقدم يجب أن يكون على الأقل ${minDeposit} جنيه`
          );
        }
      }

      // Check if deposit exceeds product price
      const productPrice = Number(product.cashPrice);
      if (depositAmount > productPrice) {
        throw new CalculationError('INVALID_DEPOSIT', 'المقدم لا يمكن أن يكون أكبر من سعر المنتج');
      }

      return true;
    } catch (error) {
      if (error instanceof CalculationError) {
        throw error;
      }
      console.error('Validate deposit error:', error);
      throw new Error('Failed to validate deposit');
    }
  }

  /**
   * Get available installment ratios
   * @returns Promise resolving to list of active ratios
   * @deprecated This method uses installmentRatio model which doesn't exist in current schema
   */
  async getAvailableRatios() {
    // TODO: Implement this when installmentRatio model is added to schema
    // or use product customRates instead
    return [];
    
    /* Original implementation - commented out until model exists
    try {
      const ratios = await prisma.installmentRatio.findMany({
        where: { isActive: true },
        orderBy: { periodMonths: 'asc' },
      });

      return ratios.map((ratio: any) => ({
        periodMonths: ratio.periodMonths,
        ratioMultiplier: Number(ratio.ratioMultiplier),
        description: ratio.description,
      }));
    } catch (error) {
      console.error('Get available ratios error:', error);
      throw new Error('Failed to fetch installment ratios');
    }
    */
  }
}

export default new InstallmentCalculationService();
export { CalculationError, PaymentScheduleItem, InstallmentCalculation };
