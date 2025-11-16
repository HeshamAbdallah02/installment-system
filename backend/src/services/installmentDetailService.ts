import prisma from '../prismaClient';

/**
 * Custom error class for installment detail service errors
 */
class InstallmentDetailError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'InstallmentDetailError';
  }
}

/**
 * Interface for installment statistics
 */
interface InstallmentStats {
  onTimePaymentsCount: number;
  latePaymentsCount: number;
  totalPayments: number;
  onTimePercentage: number;
  averageDaysToPay: number;
  paymentConsistency: 'GOOD' | 'FAIR' | 'POOR';
  totalInterestPaid: number;
  remainingInterest: number;
  expectedCompletionDate: Date;
}

/**
 * Interface for schedule item with status
 */
interface ScheduleItemDetail {
  id: number;
  sequenceNumber: number;
  dueDate: Date;
  totalAmount: number;
  principalAmount: number;
  extraAmount: number;
  paidAmount: number;
  status: string;
  paidDate: Date | null;
  daysOverdue?: number;
  isNextDue: boolean;
}

/**
 * Interface for payment record
 */
interface PaymentRecordDetail {
  id: number;
  paymentNumber: string;
  date: Date;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  collectorName: string;
  scheduleId: number;
  installmentNumber: number;
  isPartial: boolean;
  isReversal: boolean;
  reversalReason?: string;
}

/**
 * Interface for activity record
 */
interface ActivityRecord {
  id: number;
  eventType: string;
  entityType: string;
  entityId: number;
  userId: number;
  userName: string;
  eventData: Record<string, any>;
  createdAt: Date;
  relativeTime: string;
}

/**
 * Service for handling installment detail operations
 */
class InstallmentDetailService {
  /**
   * Get comprehensive installment detail with all relations
   * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.8, 1.9
   */
  async getInstallmentDetail(installmentId: number, _userId: number, userBranchId?: number) {
    try {
      // Fetch installment plan with all relations
      const plan = await prisma.installmentPlan.findUnique({
        where: { id: installmentId },
        include: {
          customer: true,
          order: {
            include: {
              orderItems: {
                include: {
                  product: true,
                },
              },
              branch: true,
            },
          },
          schedule: {
            include: {
              allocations: {
                include: {
                  payment: {
                    include: {
                      collectedByUser: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              sequenceNumber: 'asc',
            },
          },
          createdByUser: true,
        },
      });

      if (!plan) {
        throw new InstallmentDetailError('INSTALLMENT_NOT_FOUND', 'القسط غير موجود');
      }

      // Validate user has access to installment (branch-based)
      if (userBranchId && plan.order.branchId !== userBranchId) {
        throw new InstallmentDetailError('UNAUTHORIZED_ACCESS', 'غير مصرح بالوصول لهذا القسط');
      }

      // Get product details
      const product = plan.order.orderItems[0]?.product;
      if (!product) {
        throw new InstallmentDetailError('PRODUCT_NOT_FOUND', 'المنتج غير موجود');
      }

      // Calculate statistics
      const statistics = await this.calculateStatistics(plan.id, plan.schedule);

      // Get next due payment
      const nextDuePayment = this.calculateNextDuePayment(plan.schedule);

      // Format schedule with status
      const formattedSchedule = this.formatSchedule(plan.schedule, nextDuePayment?.id);

      // Get payment history
      const paymentHistory = await this.getPaymentHistory(plan.id);

      // Get activity log
      const activities = await this.getActivityLog(plan.id, plan.customerId);

      // Calculate progress
      const paidInstallments = plan.schedule.filter((s) => s.status === 'PAID').length;
      const progressPercentage = (paidInstallments / plan.schedule.length) * 100;

      // Calculate remaining balance
      const totalPaid = plan.schedule.reduce((sum, s) => sum + Number(s.paidAmount), 0);
      const remainingBalance = Number(plan.totalWithRatio) - totalPaid;

      // Get other active installments for customer
      const otherInstallments = await prisma.installmentPlan.count({
        where: {
          customerId: plan.customerId,
          id: { not: plan.id },
          status: { in: ['ACTIVE', 'PENDING'] },
        },
      });

      // Calculate total debt across all installments
      const allInstallments = await prisma.installmentPlan.findMany({
        where: {
          customerId: plan.customerId,
          status: { in: ['ACTIVE', 'PENDING'] },
        },
        include: {
          schedule: {
            where: {
              status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
            },
          },
        },
      });

      const totalDebtAcrossAll = allInstallments.reduce((sum, inst) => {
        const instDebt = inst.schedule.reduce(
          (scheduleSum, s) => scheduleSum + (Number(s.totalAmount) - Number(s.paidAmount)),
          0
        );
        return sum + instDebt;
      }, 0);

      return {
        id: plan.id,
        planId: `INST-${plan.id}`,
        customerId: plan.customerId,
        customerName: plan.customer.fullName,
        customerPhone: plan.customer.phone,
        customerNationalId: plan.customer.nationalId,
        customerAddress: plan.customer.address || '',
        customerCity: plan.customer.city || '',
        productId: product.id,
        productName: product.name,
        productImage: '', // TODO: Add product image URL
        productCategory: product.category || '',
        cashPrice: Number(product.cashPrice),
        totalAmount: Number(plan.totalAmount),
        depositAmount: Number(plan.depositAmount),
        financedAmount: Number(plan.financedAmount),
        monthlyAmount: Number(plan.monthlyAmount),
        termMonths: plan.periodMonths,
        interestRate: (Number(plan.ratioMultiplier) - 1) * 100, // Convert ratio to percentage
        totalWithInterest: Number(plan.totalWithRatio),
        startDate: plan.startDate,
        endDate: plan.endDate,
        status: plan.status,
        remainingBalance,
        paidInstallments,
        totalInstallments: plan.schedule.length,
        progressPercentage: Math.round(progressPercentage),
        createdAt: plan.createdAt,
        createdBy: plan.createdByUser.fullName,
        branchName: plan.order.branch?.name || 'No Branch',
        customer: {
          id: plan.customer.id,
          fullName: plan.customer.fullName,
          nationalId: plan.customer.nationalId,
          phone: plan.customer.phone,
          phoneSecondary: plan.customer.phoneSecondary,
          address: plan.customer.address,
          city: plan.customer.city,
          otherActiveInstallmentsCount: otherInstallments,
          totalDebtAcrossAll,
        },
        product: {
          id: product.id,
          name: product.name,
          code: product.code,
          description: product.description,
          category: product.category,
          cashPrice: Number(product.cashPrice),
          imageUrl: '', // TODO: Add product image URL
        },
        schedule: formattedSchedule,
        payments: paymentHistory,
        activities,
        statistics,
        nextDuePayment,
      };
    } catch (error) {
      if (error instanceof InstallmentDetailError) {
        throw error;
      }
      console.error('Get installment detail error:', error);
      throw new Error('Failed to fetch installment details');
    }
  }

  /**
   * Calculate installment statistics
   * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6
   */
  private async calculateStatistics(_planId: number, schedule: any[]): Promise<InstallmentStats> {
    try {
      // Get all paid schedule items with payment dates
      const paidSchedules = schedule.filter((s) => s.status === 'PAID' && s.paidDate);

      let onTimePaymentsCount = 0;
      let latePaymentsCount = 0;
      let totalDaysToPay = 0;

      paidSchedules.forEach((s) => {
        const dueDate = new Date(s.dueDate);
        const paidDate = new Date(s.paidDate);
        const daysDiff = Math.ceil(
          (paidDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff <= 0) {
          onTimePaymentsCount++;
        } else {
          latePaymentsCount++;
        }

        totalDaysToPay += Math.abs(daysDiff);
      });

      const totalPayments = paidSchedules.length;
      const onTimePercentage = totalPayments > 0 ? (onTimePaymentsCount / totalPayments) * 100 : 0;
      const averageDaysToPay = totalPayments > 0 ? totalDaysToPay / totalPayments : 0;

      // Determine payment consistency
      let paymentConsistency: 'GOOD' | 'FAIR' | 'POOR';
      if (onTimePercentage >= 80) {
        paymentConsistency = 'GOOD';
      } else if (onTimePercentage >= 50) {
        paymentConsistency = 'FAIR';
      } else {
        paymentConsistency = 'POOR';
      }

      // Calculate total interest paid vs remaining
      const paidInterest = paidSchedules.reduce((sum, s) => sum + Number(s.extraAmount), 0);
      const remainingInterest = schedule
        .filter((s) => s.status !== 'PAID')
        .reduce((sum, s) => sum + Number(s.extraAmount), 0);

      // Estimate expected completion date based on payment pattern
      const pendingSchedules = schedule.filter((s) => s.status !== 'PAID');
      let expectedCompletionDate = new Date();

      if (pendingSchedules.length > 0) {
        // Use the last pending schedule's due date as base
        const lastPendingDue = new Date(pendingSchedules[pendingSchedules.length - 1].dueDate);

        // Adjust based on average delay
        if (averageDaysToPay > 0) {
          lastPendingDue.setDate(lastPendingDue.getDate() + Math.round(averageDaysToPay));
        }

        expectedCompletionDate = lastPendingDue;
      }

      return {
        onTimePaymentsCount,
        latePaymentsCount,
        totalPayments,
        onTimePercentage: Math.round(onTimePercentage),
        averageDaysToPay: Math.round(averageDaysToPay),
        paymentConsistency,
        totalInterestPaid: paidInterest,
        remainingInterest,
        expectedCompletionDate,
      };
    } catch (error) {
      console.error('Calculate statistics error:', error);
      throw new Error('Failed to calculate statistics');
    }
  }

  /**
   * Calculate next due payment
   * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8
   */
  private calculateNextDuePayment(schedule: any[]): ScheduleItemDetail | null {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find first pending or partial payment
    const nextDue = schedule.find((s) => s.status === 'PENDING' || s.status === 'PARTIAL');

    if (!nextDue) {
      return null;
    }

    const dueDate = new Date(nextDue.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return {
      id: nextDue.id,
      sequenceNumber: nextDue.sequenceNumber,
      dueDate: nextDue.dueDate,
      totalAmount: Number(nextDue.totalAmount),
      principalAmount: Number(nextDue.principalAmount),
      extraAmount: Number(nextDue.extraAmount),
      paidAmount: Number(nextDue.paidAmount),
      status: nextDue.status,
      paidDate: nextDue.paidDate,
      daysOverdue: daysDiff < 0 ? Math.abs(daysDiff) : undefined,
      isNextDue: true,
    };
  }

  /**
   * Format schedule with status and overdue information
   * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9
   */
  private formatSchedule(schedule: any[], nextDueId?: number): ScheduleItemDetail[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return schedule.map((item) => {
      const dueDate = new Date(item.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      let status = item.status;
      let daysOverdue: number | undefined;

      // Calculate overdue days for pending/partial payments
      if ((status === 'PENDING' || status === 'PARTIAL') && dueDate < today) {
        status = 'OVERDUE';
        daysOverdue = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      }

      return {
        id: item.id,
        sequenceNumber: item.sequenceNumber,
        dueDate: item.dueDate,
        totalAmount: Number(item.totalAmount),
        principalAmount: Number(item.principalAmount),
        extraAmount: Number(item.extraAmount),
        paidAmount: Number(item.paidAmount),
        status,
        paidDate: item.paidDate,
        daysOverdue,
        isNextDue: item.id === nextDueId,
      };
    });
  }

  /**
   * Get payment history for installment
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9
   */
  private async getPaymentHistory(planId: number): Promise<PaymentRecordDetail[]> {
    try {
      // Get all payment allocations for this plan
      const allocations = await prisma.paymentAllocation.findMany({
        where: {
          schedule: {
            planId,
          },
        },
        include: {
          payment: {
            include: {
              collectedByUser: true,
            },
          },
          schedule: true,
        },
        orderBy: {
          payment: {
            paymentDate: 'desc',
          },
        },
      });

      // Group by payment and format
      const paymentMap = new Map<number, PaymentRecordDetail>();

      allocations.forEach((alloc) => {
        const payment = alloc.payment;

        if (!paymentMap.has(payment.id)) {
          const isPartial = Number(alloc.amount) < Number(alloc.schedule.totalAmount);

          paymentMap.set(payment.id, {
            id: payment.id,
            paymentNumber: payment.paymentNumber,
            date: payment.paymentDate,
            amount: Number(payment.amount),
            paymentMethod: payment.paymentMethod,
            referenceNumber: undefined, // TODO: Add reference number field
            collectorName: payment.collectedByUser.fullName,
            scheduleId: alloc.scheduleId,
            installmentNumber: alloc.schedule.sequenceNumber,
            isPartial,
            isReversal: payment.isReversal,
            reversalReason: payment.reversalReason || undefined,
          });
        }
      });

      return Array.from(paymentMap.values());
    } catch (error) {
      console.error('Get payment history error:', error);
      throw new Error('Failed to fetch payment history');
    }
  }

  /**
   * Get activity log for installment
   * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7
   */
  private async getActivityLog(planId: number, _customerId: number): Promise<ActivityRecord[]> {
    try {
      // Get relevant events for this installment
      const events = await prisma.eventLog.findMany({
        where: {
          OR: [
            {
              entityType: 'INSTALLMENT_PLAN',
              entityId: planId,
            },
            {
              entityType: 'PAYMENT',
              eventData: {
                path: ['installmentPlanId'],
                equals: planId,
              },
            },
          ],
        },
        include: {
          user: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      });

      return events.map((event) => ({
        id: Number(event.id),
        eventType: event.eventType,
        entityType: event.entityType,
        entityId: event.entityId,
        userId: event.userId,
        userName: event.user.fullName,
        eventData: (event.eventData as Record<string, any>) || {},
        createdAt: event.createdAt,
        relativeTime: this.formatRelativeTime(event.createdAt),
      }));
    } catch (error) {
      console.error('Get activity log error:', error);
      throw new Error('Failed to fetch activity log');
    }
  }

  /**
   * Format date as relative time in Arabic
   */
  private formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) {
      return 'الآن';
    } else if (diffMins < 60) {
      return `منذ ${diffMins} دقيقة`;
    } else if (diffHours < 24) {
      return `منذ ${diffHours} ساعة`;
    } else if (diffDays < 30) {
      return `منذ ${diffDays} يوم`;
    } else {
      const diffMonths = Math.floor(diffDays / 30);
      return `منذ ${diffMonths} شهر`;
    }
  }

  /**
   * Export installment details
   * Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7
   */
  async exportInstallmentDetail(
    installmentId: number,
    format: 'pdf' | 'excel',
    options: {
      includeSchedule?: boolean;
      includePayments?: boolean;
      includeCustomer?: boolean;
      includeActivities?: boolean;
    }
  ) {
    try {
      // Get comprehensive installment detail
      const plan = await prisma.installmentPlan.findUnique({
        where: { id: installmentId },
        include: {
          customer: true,
          order: {
            include: {
              orderItems: {
                include: {
                  product: true,
                },
              },
              branch: true,
            },
          },
          schedule: {
            orderBy: {
              sequenceNumber: 'asc',
            },
          },
        },
      });

      if (!plan) {
        throw new InstallmentDetailError('INSTALLMENT_NOT_FOUND', 'القسط غير موجود');
      }

      const product = plan.order.orderItems[0]?.product;

      // Get payment history if requested
      let payments: any[] = [];
      if (options.includePayments) {
        const allocations = await prisma.paymentAllocation.findMany({
          where: {
            schedule: {
              planId: installmentId,
            },
          },
          include: {
            payment: {
              include: {
                collectedByUser: true,
              },
            },
            schedule: true,
          },
          orderBy: {
            payment: {
              paymentDate: 'desc',
            },
          },
        });

        const paymentMap = new Map();
        allocations.forEach((alloc) => {
          if (!paymentMap.has(alloc.payment.id)) {
            paymentMap.set(alloc.payment.id, {
              paymentNumber: alloc.payment.paymentNumber,
              date: alloc.payment.paymentDate,
              amount: Number(alloc.payment.amount),
              paymentMethod: alloc.payment.paymentMethod,
              collectorName: alloc.payment.collectedByUser.fullName,
            });
          }
        });
        payments = Array.from(paymentMap.values());
      }

      // Get activities if requested
      let activities: any[] = [];
      if (options.includeActivities) {
        const events = await prisma.eventLog.findMany({
          where: {
            OR: [
              {
                entityType: 'INSTALLMENT_PLAN',
                entityId: installmentId,
              },
            ],
          },
          include: {
            user: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 20,
        });

        activities = events.map((event) => ({
          eventType: event.eventType,
          userName: event.user.fullName,
          createdAt: event.createdAt,
        }));
      }

      // Format export data
      const exportData = {
        installmentId: plan.id,
        planId: `INST-${plan.id}`,
        customer: options.includeCustomer
          ? {
              fullName: plan.customer.fullName,
              nationalId: plan.customer.nationalId,
              phone: plan.customer.phone,
              address: plan.customer.address,
              city: plan.customer.city,
            }
          : undefined,
        product: {
          name: product?.name || 'Unknown',
          cashPrice: Number(product?.cashPrice || 0),
        },
        terms: {
          totalAmount: Number(plan.totalAmount),
          depositAmount: Number(plan.depositAmount),
          financedAmount: Number(plan.financedAmount),
          monthlyAmount: Number(plan.monthlyAmount),
          termMonths: plan.periodMonths,
          interestRate: (Number(plan.ratioMultiplier) - 1) * 100,
          totalWithInterest: Number(plan.totalWithRatio),
          startDate: plan.startDate,
          endDate: plan.endDate,
        },
        status: plan.status,
        schedule: options.includeSchedule
          ? plan.schedule.map((s) => ({
              sequenceNumber: s.sequenceNumber,
              dueDate: s.dueDate,
              totalAmount: Number(s.totalAmount),
              paidAmount: Number(s.paidAmount),
              status: s.status,
              paidDate: s.paidDate,
            }))
          : undefined,
        payments: options.includePayments ? payments : undefined,
        activities: options.includeActivities ? activities : undefined,
        exportDate: new Date(),
        format,
      };

      return exportData;
    } catch (error) {
      if (error instanceof InstallmentDetailError) {
        throw error;
      }
      console.error('Export installment detail error:', error);
      throw new Error('Failed to export installment details');
    }
  }

  /**
   * Cancel installment plan
   * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9
   */
  async cancelInstallment(installmentId: number, reason: string, userId: number) {
    try {
      // Get installment with schedule
      const plan = await prisma.installmentPlan.findUnique({
        where: { id: installmentId },
        include: {
          customer: true,
          schedule: {
            where: {
              status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
            },
          },
        },
      });

      if (!plan) {
        throw new InstallmentDetailError('INSTALLMENT_NOT_FOUND', 'القسط غير موجود');
      }

      if (plan.status === 'COMPLETED') {
        throw new InstallmentDetailError('CANNOT_CANCEL_COMPLETED', 'لا يمكن إلغاء قسط مكتمل');
      }

      if (plan.status === 'CANCELLED') {
        throw new InstallmentDetailError('ALREADY_CANCELLED', 'القسط ملغي بالفعل');
      }

      // Calculate remaining balance
      const remainingBalance = plan.schedule.reduce(
        (sum, s) => sum + (Number(s.totalAmount) - Number(s.paidAmount)),
        0
      );

      // Cancel installment in transaction
      await prisma.$transaction(async (tx) => {
        // Update installment status to CANCELLED
        await tx.installmentPlan.update({
          where: { id: installmentId },
          data: { status: 'CANCELLED' },
        });

        // Mark all pending payments as cancelled (using OVERDUE as proxy since no CANCELLED status)
        await tx.installmentSchedule.updateMany({
          where: {
            planId: installmentId,
            status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
          },
          data: {
            status: 'OVERDUE', // Using OVERDUE as cancelled indicator
          },
        });

        // Log event
        await tx.eventLog.create({
          data: {
            eventType: 'INSTALLMENT_CANCELLED',
            entityType: 'INSTALLMENT_PLAN',
            entityId: installmentId,
            userId,
            eventData: {
              reason,
              remainingBalance,
              customerName: plan.customer.fullName,
            },
          },
        });
      });

      return {
        installmentId,
        status: 'CANCELLED',
        remainingBalance,
        reason,
      };
    } catch (error) {
      if (error instanceof InstallmentDetailError) {
        throw error;
      }
      console.error('Cancel installment error:', error);
      throw new Error('Failed to cancel installment');
    }
  }

  /**
   * Modify installment terms
   * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8, 14.9
   */
  async modifyTerms(
    installmentId: number,
    newMonthlyAmount: number | undefined,
    newTermMonths: number | undefined,
    newInterestRate: number | undefined,
    reason: string,
    approvedBy: number,
    userId: number
  ) {
    try {
      // Get installment with schedule
      const plan = await prisma.installmentPlan.findUnique({
        where: { id: installmentId },
        include: {
          customer: true,
          order: {
            include: {
              orderItems: {
                include: {
                  product: true,
                },
              },
            },
          },
          schedule: {
            orderBy: {
              sequenceNumber: 'asc',
            },
          },
        },
      });

      if (!plan) {
        throw new InstallmentDetailError('INSTALLMENT_NOT_FOUND', 'القسط غير موجود');
      }

      if (plan.status === 'COMPLETED' || plan.status === 'CANCELLED') {
        throw new InstallmentDetailError('CANNOT_MODIFY', 'لا يمكن تعديل قسط مكتمل أو ملغي');
      }

      // Check if more than 50% complete
      const paidCount = plan.schedule.filter((s) => s.status === 'PAID').length;
      const completionPercentage = (paidCount / plan.schedule.length) * 100;

      if (completionPercentage > 50) {
        throw new InstallmentDetailError(
          'MODIFICATION_LIMIT_EXCEEDED',
          'لا يمكن التعديل بعد إكمال أكثر من 50% من الدفعات'
        );
      }

      // Require manager approval
      if (!approvedBy) {
        throw new InstallmentDetailError('MANAGER_APPROVAL_REQUIRED', 'يتطلب موافقة المدير');
      }

      // Calculate remaining balance
      const remainingSchedules = plan.schedule.filter((s) => s.status !== 'PAID');
      const remainingBalance = remainingSchedules.reduce(
        (sum, s) => sum + (Number(s.totalAmount) - Number(s.paidAmount)),
        0
      );

      // Use new values or keep existing
      const termMonths = newTermMonths || remainingSchedules.length;
      const interestRate =
        newInterestRate !== undefined ? newInterestRate : (Number(plan.ratioMultiplier) - 1) * 100;
      const ratioMultiplier = 1 + interestRate / 100;

      // Calculate new monthly amount
      let monthlyAmount: number;
      if (newMonthlyAmount) {
        monthlyAmount = newMonthlyAmount;
      } else {
        // Recalculate based on remaining balance and new terms
        monthlyAmount = (remainingBalance * ratioMultiplier) / termMonths;
      }

      const totalWithRatio = monthlyAmount * termMonths;

      // Generate new payment schedule for remaining installments
      const startDate = remainingSchedules[0]?.dueDate || new Date();
      const newSchedule: any[] = [];

      for (let i = 0; i < termMonths; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i);

        const principalAmount = remainingBalance / termMonths;
        const extraAmount = monthlyAmount - principalAmount;

        newSchedule.push({
          sequenceNumber: paidCount + i + 1,
          dueDate,
          totalAmount: monthlyAmount,
          principalAmount,
          extraAmount,
        });
      }

      // Update plan and schedule in transaction
      await prisma.$transaction(async (tx) => {
        // Delete remaining unpaid schedules
        await tx.installmentSchedule.deleteMany({
          where: {
            planId: installmentId,
            status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
          },
        });

        // Create new schedule
        await tx.installmentSchedule.createMany({
          data: newSchedule.map((item) => ({
            planId: installmentId,
            sequenceNumber: item.sequenceNumber,
            dueDate: item.dueDate,
            totalAmount: item.totalAmount,
            principalAmount: item.principalAmount,
            extraAmount: item.extraAmount,
            status: 'PENDING',
          })),
        });

        // Update plan
        const updatedPlan = await tx.installmentPlan.update({
          where: { id: installmentId },
          data: {
            monthlyAmount,
            periodMonths: paidCount + termMonths,
            ratioMultiplier,
            totalWithRatio: Number(plan.totalAmount) + totalWithRatio - remainingBalance,
            endDate: newSchedule[newSchedule.length - 1].dueDate,
          },
        });

        // Log event
        await tx.eventLog.create({
          data: {
            eventType: 'TERMS_MODIFIED',
            entityType: 'INSTALLMENT_PLAN',
            entityId: installmentId,
            userId,
            eventData: {
              reason,
              approvedBy,
              oldMonthlyAmount: Number(plan.monthlyAmount),
              newMonthlyAmount: monthlyAmount,
              oldTermMonths: plan.periodMonths,
              newTermMonths: paidCount + termMonths,
              oldInterestRate: (Number(plan.ratioMultiplier) - 1) * 100,
              newInterestRate: interestRate,
              customerName: plan.customer.fullName,
            },
          },
        });

        return updatedPlan;
      });

      return {
        oldTerms: {
          monthlyAmount: Number(plan.monthlyAmount),
          termMonths: plan.periodMonths,
          interestRate: (Number(plan.ratioMultiplier) - 1) * 100,
        },
        newTerms: {
          monthlyAmount,
          termMonths: paidCount + termMonths,
          interestRate,
        },
        newSchedule,
      };
    } catch (error) {
      if (error instanceof InstallmentDetailError) {
        throw error;
      }
      console.error('Modify terms error:', error);
      throw new Error('Failed to modify terms');
    }
  }

  /**
   * Process early settlement
   * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9
   */
  async processEarlySettlement(
    installmentId: number,
    discountPercentage: number,
    paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'CHECK',
    paymentDate: Date,
    approvedBy: number | undefined,
    collectedBy: number
  ) {
    try {
      // Get installment with schedule
      const plan = await prisma.installmentPlan.findUnique({
        where: { id: installmentId },
        include: {
          customer: true,
          order: true,
          schedule: {
            where: {
              status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
            },
          },
        },
      });

      if (!plan) {
        throw new InstallmentDetailError('INSTALLMENT_NOT_FOUND', 'القسط غير موجود');
      }

      if (plan.status === 'COMPLETED') {
        throw new InstallmentDetailError('ALREADY_COMPLETED', 'القسط مكتمل بالفعل');
      }

      if (plan.schedule.length === 0) {
        throw new InstallmentDetailError('NO_PENDING_PAYMENTS', 'لا توجد دفعات معلقة');
      }

      // Calculate remaining amounts
      const remainingPrincipal = plan.schedule.reduce(
        (sum, s) => sum + (Number(s.principalAmount) - Number(s.paidAmount)),
        0
      );
      const remainingInterest = plan.schedule.reduce((sum, s) => sum + Number(s.extraAmount), 0);
      const totalRemaining = remainingPrincipal + remainingInterest;

      // Validate discount
      if (discountPercentage < 0 || discountPercentage > 100) {
        throw new InstallmentDetailError('INVALID_DISCOUNT', 'نسبة الخصم غير صالحة');
      }

      // Require manager approval for discounts
      if (discountPercentage > 0 && !approvedBy) {
        throw new InstallmentDetailError('MANAGER_APPROVAL_REQUIRED', 'يتطلب موافقة المدير');
      }

      // Calculate settlement amount
      const discountAmount = (totalRemaining * discountPercentage) / 100;
      const finalSettlementAmount = totalRemaining - discountAmount;

      // Generate payment number
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0');
      const paymentNumber = `PAY-SETTLE-${timestamp}-${random}`;

      // Process settlement in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create settlement payment
        const payment = await tx.payment.create({
          data: {
            paymentNumber,
            customerId: plan.customerId,
            orderId: plan.orderId,
            amount: finalSettlementAmount,
            paymentMethod,
            paymentDate,
            isReversal: false,
            collectedBy,
          },
        });

        // Update all remaining schedule items to PAID
        // Update each schedule item individually to set paidAmount = totalAmount
        for (const schedule of plan.schedule) {
          await tx.installmentSchedule.update({
            where: { id: schedule.id },
            data: {
              status: 'PAID',
              paidAmount: schedule.totalAmount,
              paidDate: paymentDate,
            },
          });
        }

        // Create payment allocations for each schedule item
        for (const schedule of plan.schedule) {
          const remainingForSchedule = Number(schedule.totalAmount) - Number(schedule.paidAmount);
          await tx.paymentAllocation.create({
            data: {
              paymentId: payment.id,
              scheduleId: schedule.id,
              allocationType: 'PRINCIPAL',
              amount: remainingForSchedule,
            },
          });
        }

        // Update installment status to COMPLETED
        await tx.installmentPlan.update({
          where: { id: installmentId },
          data: { status: 'COMPLETED' },
        });

        // Log event
        await tx.eventLog.create({
          data: {
            eventType: 'EARLY_SETTLEMENT',
            entityType: 'INSTALLMENT_PLAN',
            entityId: installmentId,
            userId: collectedBy,
            eventData: {
              paymentNumber,
              totalRemaining,
              discountPercentage,
              discountAmount,
              finalSettlementAmount,
              approvedBy,
              customerName: plan.customer.fullName,
            },
          },
        });

        return payment;
      });

      return {
        paymentNumber: result.paymentNumber,
        remainingPrincipal,
        remainingInterest,
        totalRemaining,
        discountPercentage,
        discountAmount,
        finalSettlementAmount,
        paymentDate: result.paymentDate,
      };
    } catch (error) {
      if (error instanceof InstallmentDetailError) {
        throw error;
      }
      console.error('Process early settlement error:', error);
      throw new Error('Failed to process early settlement');
    }
  }

  /**
   * Send payment reminder
   * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8
   */
  async sendReminder(
    installmentId: number,
    method: 'whatsapp' | 'sms' | 'both',
    scheduleId: number | undefined,
    userId: number
  ) {
    try {
      // Get installment with customer and schedule
      const plan = await prisma.installmentPlan.findUnique({
        where: { id: installmentId },
        include: {
          customer: true,
          schedule: {
            where: scheduleId
              ? { id: scheduleId }
              : {
                  status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
                },
            orderBy: {
              dueDate: 'asc',
            },
            take: 1,
          },
        },
      });

      if (!plan) {
        throw new InstallmentDetailError('INSTALLMENT_NOT_FOUND', 'القسط غير موجود');
      }

      // Validate customer has valid phone number
      const phone = plan.customer.phone;
      if (!phone || !/^01\d{9}$/.test(phone)) {
        throw new InstallmentDetailError('INVALID_PHONE', 'رقم الهاتف غير صالح');
      }

      // Get next due payment
      const nextDue = plan.schedule[0];
      if (!nextDue) {
        throw new InstallmentDetailError('NO_PENDING_PAYMENTS', 'لا توجد دفعات معلقة');
      }

      // Prepare reminder message
      const dueDate = new Date(nextDue.dueDate).toLocaleDateString('ar-EG');
      const message = `عزيزي ${plan.customer.fullName}، نذكرك بموعد دفعة القسط المستحقة\nالمبلغ: ${Number(nextDue.totalAmount).toFixed(2)} ج.م\nتاريخ الاستحقاق: ${dueDate}`;

      // In a real implementation, integrate with WhatsApp/SMS API here
      console.log(`Reminder sent to ${plan.customer.fullName} via ${method}:`, message);

      // Log reminder activity
      await prisma.eventLog.create({
        data: {
          eventType: 'REMINDER_SENT',
          entityType: 'INSTALLMENT_PLAN',
          entityId: installmentId,
          userId,
          eventData: {
            method,
            customerName: plan.customer.fullName,
            phone,
            amount: Number(nextDue.totalAmount),
            dueDate: nextDue.dueDate,
            scheduleId: nextDue.id,
          },
        },
      });

      return {
        success: true,
        customerName: plan.customer.fullName,
        phone,
        method,
        message,
      };
    } catch (error) {
      if (error instanceof InstallmentDetailError) {
        throw error;
      }
      console.error('Send reminder error:', error);
      throw new Error('Failed to send reminder');
    }
  }

  /**
   * Record payment from detail page
   * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9
   */
  async recordPaymentFromDetail(
    installmentId: number,
    scheduleId: number,
    amount: number,
    paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'CHECK',
    paymentDate: Date,
    _notes: string | undefined,
    collectedBy: number
  ) {
    try {
      // Validate schedule exists and belongs to installment
      const schedule = await prisma.installmentSchedule.findUnique({
        where: { id: scheduleId },
        include: {
          plan: {
            include: {
              customer: true,
              order: true,
            },
          },
        },
      });

      if (!schedule) {
        throw new InstallmentDetailError('SCHEDULE_NOT_FOUND', 'القسط غير موجود');
      }

      if (schedule.planId !== installmentId) {
        throw new InstallmentDetailError('SCHEDULE_MISMATCH', 'القسط لا ينتمي لهذه الخطة');
      }

      // Check if already paid
      if (schedule.status === 'PAID') {
        throw new InstallmentDetailError('ALREADY_PAID', 'القسط مدفوع بالفعل');
      }

      // Validate payment amount
      const remainingAmount = Number(schedule.totalAmount) - Number(schedule.paidAmount);
      if (amount <= 0) {
        throw new InstallmentDetailError('INVALID_AMOUNT', 'المبلغ يجب أن يكون أكبر من صفر');
      }
      if (amount > remainingAmount) {
        throw new InstallmentDetailError('AMOUNT_EXCEEDS_DUE', 'المبلغ يتجاوز المستحق');
      }

      // Generate payment number
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0');
      const paymentNumber = `PAY-${timestamp}-${random}`;

      // Create payment and update schedule in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create payment record
        const payment = await tx.payment.create({
          data: {
            paymentNumber,
            customerId: schedule.plan.customerId,
            orderId: schedule.plan.orderId,
            amount,
            paymentMethod,
            paymentDate,
            isReversal: false,
            collectedBy,
          },
        });

        // Create payment allocation
        await tx.paymentAllocation.create({
          data: {
            paymentId: payment.id,
            scheduleId,
            allocationType: 'PRINCIPAL',
            amount,
          },
        });

        // Update installment schedule
        const newPaidAmount = Number(schedule.paidAmount) + amount;
        const newStatus = newPaidAmount >= Number(schedule.totalAmount) ? 'PAID' : 'PARTIAL';

        const updatedSchedule = await tx.installmentSchedule.update({
          where: { id: scheduleId },
          data: {
            paidAmount: newPaidAmount,
            status: newStatus,
            paidDate: newStatus === 'PAID' ? paymentDate : null,
          },
        });

        // Check if all installments are paid and update plan status
        const allSchedules = await tx.installmentSchedule.findMany({
          where: { planId: installmentId },
        });

        const allPaid = allSchedules.every((s) =>
          s.id === scheduleId ? newStatus === 'PAID' : s.status === 'PAID'
        );

        if (allPaid) {
          await tx.installmentPlan.update({
            where: { id: installmentId },
            data: { status: 'COMPLETED' },
          });
        }

        // Log event
        await tx.eventLog.create({
          data: {
            eventType: 'PAYMENT_RECORDED',
            entityType: 'PAYMENT',
            entityId: payment.id,
            userId: collectedBy,
            eventData: {
              paymentNumber,
              amount,
              paymentMethod,
              scheduleId,
              installmentPlanId: installmentId,
              customerName: schedule.plan.customer.fullName,
            },
          },
        });

        return { payment, updatedSchedule };
      });

      return {
        payment: {
          id: result.payment.id,
          paymentNumber: result.payment.paymentNumber,
          amount: Number(result.payment.amount),
          paymentMethod: result.payment.paymentMethod,
          paymentDate: result.payment.paymentDate,
        },
        updatedSchedule: {
          id: result.updatedSchedule.id,
          sequenceNumber: result.updatedSchedule.sequenceNumber,
          totalAmount: Number(result.updatedSchedule.totalAmount),
          paidAmount: Number(result.updatedSchedule.paidAmount),
          status: result.updatedSchedule.status,
          paidDate: result.updatedSchedule.paidDate,
        },
      };
    } catch (error) {
      if (error instanceof InstallmentDetailError) {
        throw error;
      }
      console.error('Record payment from detail error:', error);
      throw new Error('Failed to record payment');
    }
  }
}

export default new InstallmentDetailService();
export {
  InstallmentDetailError,
  InstallmentStats,
  ScheduleItemDetail,
  PaymentRecordDetail,
  ActivityRecord,
};
