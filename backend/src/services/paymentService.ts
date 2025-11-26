import prisma from '../prismaClient';
import { Prisma } from '@prisma/client';
import websocketService from './websocket.service';

/**
 * Custom error class for payment service errors
 */
class PaymentError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

/**
 * Interface for single payment recording
 */
interface RecordPaymentData {
  scheduleId: number;
  amount: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'CHECK';
  referenceNumber?: string;
  checkNumber?: string;
  bankName?: string;
  paymentDate: Date;
  notes?: string;
  collectedBy: number;
}

/**
 * Interface for multiple payment recording
 */
interface RecordMultiplePaymentsData {
  scheduleIds: number[];
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'CHECK';
  referenceNumber?: string;
  checkNumber?: string;
  bankName?: string;
  paymentDate: Date;
  notes?: string;
  collectedBy: number;
}

/**
 * Interface for advance payment recording
 */
interface RecordAdvancePaymentData {
  scheduleId: number;
  amount: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'CHECK';
  referenceNumber?: string;
  checkNumber?: string;
  bankName?: string;
  paymentDate: Date;
  notes?: string;
  collectedBy: number;
}

/**
 * Service for handling payment operations
 */
class PaymentService {
  /**
   * Generate unique payment number
   */
  private async generatePaymentNumber(): Promise<string> {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `PAY-${timestamp}-${random}`;
  }

  /**
   * Record a single payment
   */
  async recordPayment(data: RecordPaymentData) {
    try {
      // Validate schedule exists and get details
      const schedule = await prisma.installment_schedule.findUnique({
        where: { id: data.scheduleId },
        include: {
          installment_plans: {
            include: {
              customers: true,
              orders: true,
            },
          },
        },
      });

      if (!schedule) {
        throw new PaymentError('SCHEDULE_NOT_FOUND', 'القسط غير موجود');
      }

      // Check if already paid
      if (schedule.status === 'PAID') {
        throw new PaymentError('ALREADY_PAID', 'القسط مدفوع بالفعل');
      }

      // Validate payment amount
      const remainingAmount = Number(schedule.totalAmount) - Number(schedule.paidAmount);
      if (data.amount <= 0) {
        throw new PaymentError('INVALID_AMOUNT', 'المبلغ يجب أن يكون أكبر من صفر');
      }
      if (data.amount > remainingAmount) {
        throw new PaymentError('AMOUNT_EXCEEDS_DUE', 'المبلغ يتجاوز المستحق');
      }

      // Generate payment number
      const paymentNumber = await this.generatePaymentNumber();

      // Create payment and update schedule in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create payment record
        const payment = await tx.payments.create({
          data: {
            paymentNumber,
            customerId: schedule.installment_plans.customerId,
            orderId: schedule.installment_plans.orderId,
            amount: data.amount,
            paymentMethod: data.paymentMethod,
            paymentDate: data.paymentDate,
            isReversal: false,
            collectedBy: data.collectedBy,
          },
        });

        // Create payment allocation
        await tx.payment_allocations.create({
          data: {
            paymentId: payment.id,
            scheduleId: data.scheduleId,
            allocationType: 'PRINCIPAL',
            amount: data.amount,
          },
        });

        // Update installment schedule
        const newPaidAmount = Number(schedule.paidAmount) + data.amount;
        const newStatus = newPaidAmount >= Number(schedule.totalAmount) ? 'PAID' : 'PARTIAL';

        await tx.installment_schedule.update({
          where: { id: data.scheduleId },
          data: {
            paidAmount: newPaidAmount,
            status: newStatus,
            paidDate: newStatus === 'PAID' ? data.paymentDate : null,
          },
        });

        // Log event
        await tx.event_log.create({
          data: {
            eventType: 'PAYMENT_RECORDED',
            entityType: 'PAYMENT',
            entityId: payment.id,
            userId: data.collectedBy,
            eventData: {
              paymentNumber,
              amount: data.amount,
              paymentMethod: data.paymentMethod,
              scheduleId: data.scheduleId,
            },
          },
        });

        return payment;
      });

      // Broadcast real-time update
      websocketService.broadcast({
        type: 'PAYMENT_RECORDED',
        channel: 'payments',
        data: {
          payment: result,
          customerId: schedule.installment_plans.customerId,
          customerName: schedule.installment_plans.customers.fullName,
          installmentPlanId: schedule.planId,
        },
      });

      return {
        id: result.id,
        paymentNumber: result.paymentNumber,
        amount: Number(result.amount),
        paymentMethod: result.paymentMethod,
        paymentDate: result.paymentDate,
        customerName: schedule.installment_plans.customers.fullName,
      };
    } catch (error) {
      if (error instanceof PaymentError) {
        throw error;
      }
      console.error('Record payment error:', error);
      throw new Error('Failed to record payment');
    }
  }

  /**
   * Record multiple payments for same customer
   */
  async recordMultiplePayments(data: RecordMultiplePaymentsData) {
    try {
      // Validate schedules exist and belong to same customer
      const schedules = await prisma.installment_schedule.findMany({
        where: { id: { in: data.scheduleIds } },
        include: {
          installment_plans: {
            include: {
              customers: true,
              orders: true,
            },
          },
        },
      });

      if (schedules.length === 0) {
        throw new PaymentError('SCHEDULES_NOT_FOUND', 'الأقساط غير موجودة');
      }

      if (schedules.length !== data.scheduleIds.length) {
        throw new PaymentError('SOME_SCHEDULES_NOT_FOUND', 'بعض الأقساط غير موجودة');
      }

      // Validate all schedules belong to same customer
      const customerIds = new Set(schedules.map((s) => s.installment_plans.customerId));
      if (customerIds.size > 1) {
        throw new PaymentError('DIFFERENT_CUSTOMERS', 'الأقساط المحددة تنتمي لعملاء مختلفين');
      }

      // Check if any already paid
      const alreadyPaid = schedules.filter((s) => s.status === 'PAID');
      if (alreadyPaid.length > 0) {
        throw new PaymentError('SOME_ALREADY_PAID', 'بعض الأقساط مدفوعة بالفعل');
      }

      // Create payments in transaction with batched operations (Performance optimization)
      const payments = await prisma.$transaction(async (tx) => {
        const createdPayments = [];
        const paymentAllocations = [];
        const scheduleUpdates = [];
        const eventLogs = [];

        // Prepare all payment data first
        for (const schedule of schedules) {
          const remainingAmount = Number(schedule.totalAmount) - Number(schedule.paidAmount);
          const paymentNumber = await this.generatePaymentNumber();

          // Create payment record
          const payment = await tx.payments.create({
            data: {
              paymentNumber,
              customerId: schedule.installment_plans.customerId,
              orderId: schedule.installment_plans.orderId,
              amount: remainingAmount,
              paymentMethod: data.paymentMethod,
              paymentDate: data.paymentDate,
              isReversal: false,
              collectedBy: data.collectedBy,
            },
          });

          // Prepare allocation data for batch creation
          paymentAllocations.push({
            paymentId: payment.id,
            scheduleId: schedule.id,
            allocationType: 'PRINCIPAL' as const,
            amount: remainingAmount,
          });

          // Prepare schedule update data
          scheduleUpdates.push({
            id: schedule.id,
            paidAmount: schedule.totalAmount,
            status: 'PAID' as const,
            paidDate: data.paymentDate,
          });

          // Prepare event log data
          eventLogs.push({
            eventType: 'PAYMENT_RECORDED' as const,
            entityType: 'PAYMENT' as const,
            entityId: payment.id,
            userId: data.collectedBy,
            eventData: {
              paymentNumber,
              amount: remainingAmount,
              paymentMethod: data.paymentMethod,
              scheduleId: schedule.id,
              isMultiple: true,
            },
          });

          createdPayments.push({
            id: payment.id,
            paymentNumber: payment.paymentNumber,
            amount: Number(payment.amount),
            scheduleId: schedule.id,
            sequenceNumber: schedule.sequenceNumber,
          });
        }

        // Batch create payment allocations
        if (paymentAllocations.length > 0) {
          await tx.payment_allocations.createMany({
            data: paymentAllocations,
          });
        }

        // Batch update installment schedules
        for (const update of scheduleUpdates) {
          await tx.installment_schedule.update({
            where: { id: update.id },
            data: {
              paidAmount: update.paidAmount,
              status: update.status,
              paidDate: update.paidDate,
            },
          });
        }

        // Batch create event logs
        if (eventLogs.length > 0) {
          await tx.event_log.createMany({
            data: eventLogs,
          });
        }

        return createdPayments;
      });

      // Broadcast real-time update
      const firstSchedule = schedules[0];
      websocketService.broadcast({
        type: 'MULTIPLE_PAYMENTS_RECORDED',
        channel: 'payments',
        data: {
          payments,
          customerId: firstSchedule.installment_plans.customerId,
          customerName: firstSchedule.installment_plans.customers.fullName,
          installmentPlanId: firstSchedule.planId,
          count: payments.length,
        },
      });

      return {
        payments,
        totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
        count: payments.length,
        customerName: firstSchedule.installment_plans.customers.fullName,
      };
    } catch (error) {
      if (error instanceof PaymentError) {
        throw error;
      }
      console.error('Record multiple payments error:', error);
      throw new Error('Failed to record multiple payments');
    }
  }

  /**
   * Get current month's dues
   */
  async getTodaysDues() {
    try {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);

      const where: Prisma.installment_scheduleWhereInput = {
        dueDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        status: {
          in: ['PENDING', 'PARTIAL'],
        },
      };

      const dues = await prisma.installment_schedule.findMany({
        where,
        include: {
          installment_plans: {
            include: {
              customers: true,
              orders: {
                include: {
                  order_items: {
                    include: {
                      products: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          installment_plans: {
            customers: {
              fullName: 'asc',
            },
          },
        },
      });

      const formattedDues = dues
        .filter((schedule) => {
          // Only include schedules with remaining balance
          const remainingAmount = Number(schedule.totalAmount) - Number(schedule.paidAmount);
          return remainingAmount > 0;
        })
        .map((schedule) => {
          const productName =
            schedule.installment_plans.orders.order_items[0]?.products.name || 'Unknown Product';
          const remainingAmount = Number(schedule.totalAmount) - Number(schedule.paidAmount);

          return {
            id: schedule.id,
            customerId: schedule.installment_plans.customerId,
            customerName: schedule.installment_plans.customers.fullName,
            phone: schedule.installment_plans.customers.fullName,
            productName,
            installmentNumber: schedule.sequenceNumber,
            totalInstallments: schedule.installment_plans.periodMonths,
            amountDue: remainingAmount,
            dueDate: schedule.dueDate,
            installmentPlanId: schedule.planId,
            scheduleId: schedule.id,
          };
        });

      const totalAmount = formattedDues.reduce((sum, due) => sum + due.amountDue, 0);

      return {
        dues: formattedDues,
        totalAmount,
        count: formattedDues.length,
      };
    } catch (error) {
      console.error('Get todays dues error:', error);
      throw new Error('Failed to fetch todays dues');
    }
  }

  /**
   * Get upcoming installments for a customer (for advance payments)
   */
  async getUpcomingInstallments(customerId: number) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcomingInstallments = await prisma.installment_schedule.findMany({
        where: {
          installment_plans: { customerId },
          dueDate: {
            gt: today,
          },
          status: {
            in: ['PENDING', 'PARTIAL'],
          },
        },
        include: {
          installment_plans: {
            include: {
              customers: true,
              orders: {
                include: {
                  order_items: {
                    include: {
                      products: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          dueDate: 'asc',
        },
      });

      const formattedInstallments = upcomingInstallments.map((schedule) => {
        const productName =
          schedule.installment_plans.orders.order_items[0]?.products.name || 'Unknown Product';
        const remainingAmount = Number(schedule.totalAmount) - Number(schedule.paidAmount);

        return {
          id: schedule.id,
          scheduleId: schedule.id,
          installmentNumber: schedule.sequenceNumber,
          totalInstallments: schedule.installment_plans.periodMonths,
          dueDate: schedule.dueDate,
          amountDue: remainingAmount,
          productName,
          installmentPlanId: schedule.planId,
        };
      });

      return {
        installments: formattedInstallments,
        count: formattedInstallments.length,
      };
    } catch (error) {
      console.error('Get upcoming installments error:', error);
      throw new Error('Failed to fetch upcoming installments');
    }
  }

  /**
   * Get overdue payments
   */
  async getOverdueDues() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const where: Prisma.installment_scheduleWhereInput = {
        dueDate: {
          lt: today,
        },
        status: {
          in: ['PENDING', 'PARTIAL'], // Only look for PENDING and PARTIAL - they become overdue when past due date
        },
      };

      const overdues = await prisma.installment_schedule.findMany({
        where,
        include: {
          installment_plans: {
            include: {
              customers: true,
              orders: {
                include: {
                  order_items: {
                    include: {
                      products: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          dueDate: 'asc',
        },
      });

      const formattedOverdues = overdues
        .filter((schedule) => {
          // Only include schedules with remaining balance
          const remainingAmount = Number(schedule.totalAmount) - Number(schedule.paidAmount);
          return remainingAmount > 0;
        })
        .map((schedule) => {
          const productName =
            schedule.installment_plans.orders.order_items[0]?.products.name || 'Unknown Product';
          const remainingAmount = Number(schedule.totalAmount) - Number(schedule.paidAmount);
          const daysOverdue = Math.ceil(
            (today.getTime() - new Date(schedule.dueDate).getTime()) / (1000 * 60 * 60 * 24)
          );

          return {
            id: schedule.id,
            customerId: schedule.installment_plans.customerId,
            customerName: schedule.installment_plans.customers.fullName,
            phone: schedule.installment_plans.customers.fullName,
            productName,
            installmentNumber: schedule.sequenceNumber,
            totalInstallments: schedule.installment_plans.periodMonths,
            amountDue: remainingAmount,
            dueDate: schedule.dueDate,
            installmentPlanId: schedule.planId,
            scheduleId: schedule.id,
            daysOverdue,
          };
        });

      const totalAmount = formattedOverdues.reduce((sum, due) => sum + due.amountDue, 0);

      return {
        overdues: formattedOverdues,
        totalAmount,
        count: formattedOverdues.length,
      };
    } catch (error) {
      console.error('Get overdue dues error:', error);
      throw new Error('Failed to fetch overdue dues');
    }
  }

  /**
   * Get payment history with filtering and pagination
   */
  async getPaymentHistory(filters: {
    page?: number;
    limit?: number;
    search?: string;
    startDate?: Date;
    endDate?: Date;
    paymentMethod?: string;
    collectorId?: number;
  }) {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      const where: Prisma.paymentsWhereInput = {};

      // Search by customer name or receipt number
      if (filters.search) {
        where.OR = [
          {
            customers: {
              fullName: { contains: filters.search, mode: 'insensitive' },
            },
          },
          {
            paymentNumber: { contains: filters.search, mode: 'insensitive' },
          },
        ];
      }

      // Filter by date range
      if (filters.startDate || filters.endDate) {
        where.paymentDate = {};
        if (filters.startDate) {
          where.paymentDate.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.paymentDate.lte = filters.endDate;
        }
      }

      // Filter by payment method
      if (filters.paymentMethod) {
        where.paymentMethod = filters.paymentMethod;
      }

      // Filter by collector
      if (filters.collectorId) {
        where.collectedBy = filters.collectorId;
      }

      const [payments, total] = await Promise.all([
        prisma.payments.findMany({
          where,
          skip,
          take: limit,
          include: {
            customers: true,
            users: true,
            payment_allocations: {
              include: {
                installment_schedule: true,
              },
            },
          },
          orderBy: {
            paymentDate: 'desc',
          },
        }),
        prisma.payments.count({ where }),
      ]);

      const formattedPayments = payments.map((payment) => {
        let status: 'COMPLETED' | 'PARTIAL' | 'REVERSED' = 'COMPLETED';
        if (payment.isReversal || payment.reversedPaymentId) {
          status = 'REVERSED';
        } else if (payment.payment_allocations.length > 0) {
          const schedule = payment.payment_allocations[0].installment_schedule;
          if (schedule.status === 'PARTIAL') {
            status = 'PARTIAL';
          }
        }

        return {
          id: payment.id,
          paymentNumber: payment.paymentNumber,
          date: payment.paymentDate,
          customerName: payment.customers.fullName,
          amount: Number(payment.amount),
          paymentMethod: payment.paymentMethod,
          collectorName: payment.users.fullName,
          status,
          isReversal: payment.isReversal,
          reversalReason: payment.reversalReason,
        };
      });

      const totalAmount = formattedPayments
        .filter((p) => p.status !== 'REVERSED')
        .reduce((sum, p) => sum + p.amount, 0);

      return {
        payments: formattedPayments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        totalAmount,
      };
    } catch (error) {
      console.error('Get payment history error:', error);
      throw new Error('Failed to fetch payment history');
    }
  }

  /**
   * Get payment details by ID
   */
  async getPaymentById(paymentId: number) {
    try {
      const payment = await prisma.payments.findUnique({
        where: { id: paymentId },
        include: {
          customers: true,
          orders: {
            include: {
              order_items: {
                include: {
                  products: true,
                },
              },
            },
          },
          users: true,
          payment_allocations: {
            include: {
              installment_schedule: {
                include: { installment_plans: true },
              },
            },
          },
          payments: true,
          other_payments: true,
        },
      });

      if (!payment) {
        throw new PaymentError('PAYMENT_NOT_FOUND', 'الدفع غير موجود');
      }

      const allocation = payment.payment_allocations[0];
      const productName = payment.orders.order_items[0]?.products.name || 'Unknown Product';

      return {
        id: payment.id,
        paymentNumber: payment.paymentNumber,
        amount: Number(payment.amount),
        paymentMethod: payment.paymentMethod,
        paymentDate: payment.paymentDate,
        customer: {
          id: payment.customers.id,
          fullName: payment.customers.fullName,
          nationalId: payment.customers.nationalId,
          phone: payment.customers.phone,
        },
        product: {
          name: productName,
        },
        installment: allocation
          ? {
              sequenceNumber: allocation.installment_schedule.sequenceNumber,
              totalInstallments: allocation.installment_schedule.installment_plans.periodMonths,
            }
          : null,
        collector: {
          id: payment.users.id,
          fullName: payment.users.fullName,
        },
        isReversal: payment.isReversal,
        reversalReason: payment.reversalReason,
        payments: payment.payments
          ? {
              id: payment.payments.id,
              paymentNumber: payment.payments.paymentNumber,
            }
          : null,
        other_payments: payment.other_payments.map((r) => ({
          id: r.id,
          paymentNumber: r.paymentNumber,
          reason: r.reversalReason,
          date: r.paymentDate,
        })),
        createdAt: payment.createdAt,
      };
    } catch (error) {
      if (error instanceof PaymentError) {
        throw error;
      }
      console.error('Get payment by ID error:', error);
      throw new Error('Failed to fetch payment details');
    }
  }

  /**
   * Record advance payment
   */
  async recordAdvancePayment(data: RecordAdvancePaymentData) {
    try {
      // Validate schedule exists and is in the future
      const schedule = await prisma.installment_schedule.findUnique({
        where: { id: data.scheduleId },
        include: {
          installment_plans: {
            include: {
              customers: true,
              orders: true,
            },
          },
        },
      });

      if (!schedule) {
        throw new PaymentError('SCHEDULE_NOT_FOUND', 'القسط غير موجود');
      }

      // Check if already paid
      if (schedule.status === 'PAID') {
        throw new PaymentError('ALREADY_PAID', 'القسط مدفوع بالفعل');
      }

      // Validate it's a future installment
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(schedule.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      if (dueDate <= today) {
        throw new PaymentError('NOT_ADVANCE', 'القسط ليس مستقبلياً');
      }

      // Validate payment amount
      const remainingAmount = Number(schedule.totalAmount) - Number(schedule.paidAmount);
      if (data.amount <= 0) {
        throw new PaymentError('INVALID_AMOUNT', 'المبلغ يجب أن يكون أكبر من صفر');
      }
      if (data.amount > remainingAmount) {
        throw new PaymentError('AMOUNT_EXCEEDS_DUE', 'المبلغ يتجاوز المستحق');
      }

      // Generate payment number
      const paymentNumber = await this.generatePaymentNumber();

      // Create payment and update schedule in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create payment record
        const payment = await tx.payments.create({
          data: {
            paymentNumber,
            customerId: schedule.installment_plans.customerId,
            orderId: schedule.installment_plans.orderId,
            amount: data.amount,
            paymentMethod: data.paymentMethod,
            paymentDate: data.paymentDate,
            isReversal: false,
            collectedBy: data.collectedBy,
          },
        });

        // Create payment allocation with PREPAYMENT type
        await tx.payment_allocations.create({
          data: {
            paymentId: payment.id,
            scheduleId: data.scheduleId,
            allocationType: 'PREPAYMENT',
            amount: data.amount,
          },
        });

        // Update installment schedule
        const newPaidAmount = Number(schedule.paidAmount) + data.amount;
        const newStatus = newPaidAmount >= Number(schedule.totalAmount) ? 'PAID' : 'PARTIAL';

        await tx.installment_schedule.update({
          where: { id: data.scheduleId },
          data: {
            paidAmount: newPaidAmount,
            status: newStatus,
            paidDate: newStatus === 'PAID' ? data.paymentDate : null,
          },
        });

        // Log event
        await tx.event_log.create({
          data: {
            eventType: 'ADVANCE_PAYMENT_RECORDED',
            entityType: 'PAYMENT',
            entityId: payment.id,
            userId: data.collectedBy,
            eventData: {
              paymentNumber,
              amount: data.amount,
              paymentMethod: data.paymentMethod,
              scheduleId: data.scheduleId,
              isAdvance: true,
            },
          },
        });

        return payment;
      });

      // Broadcast real-time update
      websocketService.broadcast({
        type: 'ADVANCE_PAYMENT_RECORDED',
        channel: 'payments',
        data: {
          payment: result,
          customerId: schedule.installment_plans.customerId,
          customerName: schedule.installment_plans.customers.fullName,
          installmentPlanId: schedule.planId,
        },
      });

      return {
        id: result.id,
        paymentNumber: result.paymentNumber,
        amount: Number(result.amount),
        paymentMethod: result.paymentMethod,
        paymentDate: result.paymentDate,
        customerName: schedule.installment_plans.customers.fullName,
        isAdvance: true,
      };
    } catch (error) {
      if (error instanceof PaymentError) {
        throw error;
      }
      console.error('Record advance payment error:', error);
      throw new Error('Failed to record advance payment');
    }
  }

  /**
   * Generate receipt HTML for a payment
   * Performance: Receipts are generated asynchronously and cached on frontend
   */
  async generateReceipt(paymentId: number) {
    try {
      const payment = await prisma.payments.findUnique({
        where: { id: paymentId },
        include: {
          customers: true,
          orders: {
            include: {
              order_items: {
                include: {
                  products: true,
                },
              },
            },
          },
          users: true,
          payment_allocations: {
            include: {
              installment_schedule: {
                include: { installment_plans: true },
              },
            },
          },
        },
      });

      if (!payment) {
        throw new PaymentError('PAYMENT_NOT_FOUND', 'الدفع غير موجود');
      }

      const allocation = payment.payment_allocations[0];
      const productName = payment.orders.order_items[0]?.products.name || 'Unknown Product';

      // Generate QR code data (payment reference)
      const qrData = `PAY:${payment.paymentNumber}:${payment.amount}:${payment.paymentDate.toISOString()}`;

      // Format payment method in Arabic
      const paymentMethodArabic: Record<string, string> = {
        CASH: 'نقدي',
        BANK_TRANSFER: 'تحويل بنكي',
        CARD: 'بطاقة',
        CHECK: 'شيك',
      };

      const receiptHtml = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>إيصال دفع - ${payment.paymentNumber}</title>
  <style>
    @media print {
      body { margin: 0; padding: 20px; }
      .no-print { display: none !important; }
    }
    body {
      font-family: 'Arial', sans-serif;
      direction: rtl;
      text-align: right;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: white;
    }
    .receipt-container {
      border: 2px solid #560001;
      padding: 30px;
      background: white;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #eacb95;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .company-name {
      font-size: 28px;
      font-weight: bold;
      color: #560001;
      margin: 10px 0;
    }
    .receipt-title {
      font-size: 24px;
      color: #560001;
      margin: 20px 0;
    }
    .receipt-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      padding: 15px;
      background: #fafaf9;
      border-radius: 5px;
    }
    .info-item {
      font-size: 14px;
      color: #333;
    }
    .info-label {
      font-weight: bold;
      color: #560001;
    }
    .section {
      margin: 20px 0;
      padding: 15px;
      border: 1px solid #eacb95;
      border-radius: 5px;
    }
    .section-title {
      font-size: 18px;
      font-weight: bold;
      color: #560001;
      margin-bottom: 10px;
      border-bottom: 2px solid #eacb95;
      padding-bottom: 5px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    .detail-label {
      font-weight: bold;
      color: #666;
    }
    .detail-value {
      color: #333;
    }
    .amount-section {
      background: #560001;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 5px;
      margin: 30px 0;
    }
    .amount-label {
      font-size: 16px;
      margin-bottom: 10px;
    }
    .amount-value {
      font-size: 32px;
      font-weight: bold;
    }
    .signatures {
      display: flex;
      justify-content: space-around;
      margin-top: 50px;
      padding-top: 30px;
      border-top: 2px solid #eacb95;
    }
    .signature-box {
      text-align: center;
      width: 200px;
    }
    .signature-line {
      border-top: 2px solid #333;
      margin-top: 60px;
      padding-top: 10px;
    }
    .qr-section {
      text-align: center;
      margin: 30px 0;
      padding: 20px;
      background: #fafaf9;
      border-radius: 5px;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #eacb95;
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="header">
      <div class="company-name">محلات صبايا للأجهزة المنزلية</div>
      <div class="receipt-title">إيصال دفع</div>
    </div>

    <div class="receipt-info">
      <div class="info-item">
        <span class="info-label">رقم الإيصال:</span> ${payment.paymentNumber}
      </div>
      <div class="info-item">
        <span class="info-label">التاريخ:</span> ${new Date(payment.paymentDate).toLocaleDateString('ar-EG')}
      </div>
    </div>

    <div class="section">
      <div class="section-title">بيانات العميل</div>
      <div class="detail-row">
        <span class="detail-label">الاسم:</span>
        <span class="detail-value">${payment.customers.fullName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">الرقم القومي:</span>
        <span class="detail-value">${payment.customers.nationalId}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">الهاتف:</span>
        <span class="detail-value">${payment.customers.phone}</span>
      </div>
    </div>

    <div class="section">
      <div class="section-title">تفاصيل الدفع</div>
      <div class="detail-row">
        <span class="detail-label">المنتج:</span>
        <span class="detail-value">${productName}</span>
      </div>
      ${
        allocation
          ? `
      <div class="detail-row">
        <span class="detail-label">القسط:</span>
        <span class="detail-value">${allocation.installment_schedule.sequenceNumber} من ${allocation.installment_schedule.installment_plans.periodMonths}</span>
      </div>
      `
          : ''
      }
      <div class="detail-row">
        <span class="detail-label">طريقة الدفع:</span>
        <span class="detail-value">${paymentMethodArabic[payment.paymentMethod] || payment.paymentMethod}</span>
      </div>
    </div>

    <div class="amount-section">
      <div class="amount-label">المبلغ المدفوع</div>
      <div class="amount-value">${Number(payment.amount).toFixed(2)} ج.م</div>
    </div>

    <div class="section">
      <div class="section-title">معلومات إضافية</div>
      <div class="detail-row">
        <span class="detail-label">المحصل:</span>
        <span class="detail-value">${payment.users.fullName}</span>
      </div>
    </div>

    <div class="qr-section">
      <div style="font-size: 12px; color: #666; margin-bottom: 10px;">رمز التحقق</div>
      <div style="font-family: monospace; font-size: 10px; color: #999;">${qrData}</div>
    </div>

    <div class="signatures">
      <div class="signature-box">
        <div>توقيع المحصل</div>
        <div class="signature-line">${payment.users.fullName}</div>
      </div>
      <div class="signature-box">
        <div>توقيع العميل</div>
        <div class="signature-line">${payment.customers.fullName}</div>
      </div>
    </div>

    <div class="footer">
      شكراً لتعاملكم معنا
    </div>
  </div>
</body>
</html>
      `;

      return {
        html: receiptHtml,
        paymentNumber: payment.paymentNumber,
        customerName: payment.customers.fullName,
      };
    } catch (error) {
      if (error instanceof PaymentError) {
        throw error;
      }
      console.error('Generate receipt error:', error);
      throw new Error('Failed to generate receipt');
    }
  }

  /**
   * Reverse a payment
   */
  async reversePayment(paymentId: number, reason: string, userId: number) {
    try {
      // Get original payment
      const originalPayment = await prisma.payments.findUnique({
        where: { id: paymentId },
        include: {
          payment_allocations: {
            include: {
              installment_schedule: true,
            },
          },
          other_payments: true,
        },
      });

      if (!originalPayment) {
        throw new PaymentError('PAYMENT_NOT_FOUND', 'الدفع غير موجود');
      }

      // Check if already reversed
      if (originalPayment.other_payments.length > 0) {
        throw new PaymentError('ALREADY_REVERSED', 'الدفع معكوس بالفعل');
      }

      // Check if it's a reversal payment itself
      if (originalPayment.isReversal) {
        throw new PaymentError('CANNOT_REVERSE_REVERSAL', 'لا يمكن عكس دفع معكوس');
      }

      // Generate reversal payment number
      const reversalPaymentNumber = await this.generatePaymentNumber();

      // Create reversal in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create reversal payment record
        const reversalPayment = await tx.payments.create({
          data: {
            paymentNumber: reversalPaymentNumber,
            customerId: originalPayment.customerId,
            orderId: originalPayment.orderId,
            amount: -Number(originalPayment.amount), // Negative amount for reversal
            paymentMethod: originalPayment.paymentMethod,
            paymentDate: new Date(),
            isReversal: true,
            reversedPaymentId: originalPayment.id,
            reversalReason: reason,
            collectedBy: userId,
          },
        });

        // Update installment schedules
        for (const allocation of originalPayment.payment_allocations) {
          const schedule = allocation.installment_schedule;
          const newPaidAmount = Number(schedule.paidAmount) - Number(allocation.amount);

          // Determine new status
          let newStatus: string;
          if (newPaidAmount <= 0) {
            newStatus = 'PENDING';
          } else if (newPaidAmount < Number(schedule.totalAmount)) {
            newStatus = 'PARTIAL';
          } else {
            newStatus = 'PAID';
          }

          await tx.installment_schedule.update({
            where: { id: schedule.id },
            data: {
              paidAmount: Math.max(0, newPaidAmount),
              status: newStatus,
              paidDate: newStatus === 'PAID' ? schedule.paidDate : null,
            },
          });
        }

        // Log event
        await tx.event_log.create({
          data: {
            eventType: 'PAYMENT_REVERSED',
            entityType: 'PAYMENT',
            entityId: reversalPayment.id,
            userId,
            eventData: {
              originalPaymentId: originalPayment.id,
              originalPaymentNumber: originalPayment.paymentNumber,
              reversalPaymentNumber,
              amount: Number(originalPayment.amount),
              reason,
            },
          },
        });

        return reversalPayment;
      });

      // Broadcast real-time update
      websocketService.broadcast({
        type: 'PAYMENT_REVERSED',
        channel: 'payments',
        data: {
          originalPaymentId: originalPayment.id,
          reversalPayment: result,
          customerId: originalPayment.customerId,
        },
      });

      return {
        id: result.id,
        reversalPaymentNumber: result.paymentNumber,
        originalPaymentNumber: originalPayment.paymentNumber,
        amount: Number(originalPayment.amount),
        reason: result.reversalReason,
      };
    } catch (error) {
      if (error instanceof PaymentError) {
        throw error;
      }
      console.error('Reverse payment error:', error);
      throw new Error('Failed to reverse payment');
    }
  }
}

export default new PaymentService();
export { PaymentError, RecordPaymentData, RecordMultiplePaymentsData, RecordAdvancePaymentData };
