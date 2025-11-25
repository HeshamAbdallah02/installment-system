import prisma from '../prismaClient';
import { Prisma } from '@prisma/client';
import installmentCalculationService from './installmentCalculationService';
import { MAX_CREDIT_LIMIT } from '../constants/businessRules';

/**
 * Custom error class for installment service errors
 */
class InstallmentError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'InstallmentError';
  }
}

/**
 * Interface for installment creation data from wizard
 */
interface CreateInstallmentData {
  customerId: number;
  items: Array<{
    productId: number;
    quantity: number;
    unitPrice: number;
  }>;
  termMonths: number;
  startDate: Date;
  branchId: number;
  createdBy: number;
}

/**
 * Interface for installment filters
 */
interface InstallmentFilters {
  status?: string;
  branchId?: number;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Service for handling installment operations
 */
class InstallmentService {
  /**
   * Create installment plan from wizard submission
   * @param data - Installment creation data
   * @returns Promise resolving to created installment plan
   */
  async createInstallment(data: CreateInstallmentData) {
    try {
      // Validate customer exists
      const customer = await prisma.customers.findUnique({
        where: { id: data.customerId },
      });

      if (!customer) {
        throw new InstallmentError('CUSTOMER_NOT_FOUND', 'العميل غير موجود');
      }

      // Check customer's current outstanding balance against credit limit

      const activeInstallments = await prisma.installment_plans.findMany({
        where: {
          customerId: data.customerId,
          status: {
            in: ['ACTIVE', 'OVERDUE'],
          },
        },
        include: {
          schedule: {
            where: {
              status: {
                in: ['PENDING', 'OVERDUE'],
              },
            },
          },
        },
      });

      // Calculate total outstanding balance
      const totalOutstanding = activeInstallments.reduce((sum, plan) => {
        const planOutstanding = plan.schedule.reduce(
          (planSum, schedule) =>
            planSum + (Number(schedule.totalAmount) - Number(schedule.paidAmount)),
          0
        );
        return sum + planOutstanding;
      }, 0);

      // Validate all products exist and have sufficient stock
      const products = await prisma.products.findMany({
        where: {
          id: { in: data.items.map((item) => item.productId) },
        },
      });

      if (products.length !== data.items.length) {
        throw new InstallmentError('PRODUCT_NOT_FOUND', 'أحد المنتجات غير موجود');
      }

      // Check stock availability
      for (const item of data.items) {
        const product = products.find((p) => p.id === item.productId);
        if (product && product.stockQuantity < item.quantity) {
          throw new InstallmentError(
            'INSUFFICIENT_STOCK',
            `المخزون غير كافٍ للمنتج: ${product.name}`
          );
        }
      }

      // Calculate total amount
      const totalAmount = data.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

      // Check if adding this installment would exceed the credit limit
      if (totalOutstanding + totalAmount > MAX_CREDIT_LIMIT) {
        const availableCredit = MAX_CREDIT_LIMIT - totalOutstanding;
        throw new InstallmentError(
          'CREDIT_LIMIT_EXCEEDED',
          `تجاوز الحد الائتماني. الرصيد المتاح: ${availableCredit.toFixed(2)} ج.م من أصل ${MAX_CREDIT_LIMIT} ج.م`
        );
      }

      // Calculate installment details (no deposit)
      const calculation = await installmentCalculationService.calculateMonthlyPayment(
        totalAmount,
        data.termMonths
      );

      // Generate payment schedule
      const schedule = installmentCalculationService.generatePaymentSchedule(
        data.startDate,
        data.termMonths,
        calculation.monthlyAmount,
        calculation.financedAmount
      );

      // Calculate end date
      const endDate = new Date(data.startDate);
      endDate.setMonth(endDate.getMonth() + data.termMonths - 1);

      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${data.customerId}`;

      // Create order, installment plan, schedule, and update inventory in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create order with multiple items
        const order = await tx.order.create({
          data: {
            orderNumber,
            customerId: data.customerId,
            branchId: data.branchId,
            orderDate: new Date(),
            totalAmount: calculation.totalToPay,
            paymentType: 'INSTALLMENT',
            status: 'CONFIRMED',
            createdBy: data.createdBy,
            orderItems: {
              create: data.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                lineTotal: item.unitPrice * item.quantity,
              })),
            },
          },
        });

        // Decrease product quantities
        for (const item of data.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: {
                decrement: item.quantity,
              },
            },
          });
        }

        // Create installment plan (no deposit)
        const plan = await tx.installmentPlan.create({
          data: {
            orderId: order.id,
            customerId: data.customerId,
            totalAmount,
            depositAmount: 0, // No deposit
            financedAmount: calculation.financedAmount,
            periodMonths: data.termMonths,
            ratioMultiplier: calculation.ratioMultiplier,
            totalWithRatio: calculation.totalWithRatio,
            monthlyAmount: calculation.monthlyAmount,
            startDate: data.startDate,
            endDate,
            status: 'ACTIVE',
            createdBy: data.createdBy,
          },
        });

        // Create installment schedule
        await tx.installmentSchedule.createMany({
          data: schedule.map((item) => ({
            planId: plan.id,
            sequenceNumber: item.sequenceNumber,
            dueDate: item.dueDate,
            totalAmount: item.totalAmount,
            principalAmount: item.principalAmount,
            extraAmount: item.extraAmount,
            status: 'PENDING',
          })),
        });

        return { order, plan };
      });

      // Get product names for response
      const productNames = data.items
        .map((item) => {
          const product = products.find((p) => p.id === item.productId);
          return product ? `${product.name} (${item.quantity})` : '';
        })
        .filter(Boolean)
        .join(', ');

      return {
        id: result.plan.id,
        orderId: result.order.id,
        orderNumber: result.order.orderNumber,
        customerId: data.customerId,
        customerName: customer.fullName,
        productName: productNames,
        totalAmount: calculation.totalToPay,
        depositAmount: 0, // No deposit
        monthlyAmount: calculation.monthlyAmount,
        termMonths: data.termMonths,
        startDate: data.startDate,
        schedule,
      };
    } catch (error) {
      if (error instanceof InstallmentError) {
        throw error;
      }
      console.error('Create installment error:', error);
      throw new Error('Failed to create installment plan');
    }
  }

  /**
   * Get installments with filtering
   * @param filters - Filter options
   * @returns Promise resolving to paginated installment list
   */
  async getInstallments(filters: InstallmentFilters) {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: Prisma.installment_plansWhereInput = {};

      // Filter by status
      if (filters.status) {
        where.status = filters.status;
      } else {
        // Default to active installments
        where.status = {
          in: ['ACTIVE', 'PENDING'],
        };
      }

      // Filter by branch
      if (filters.branchId) {
        where.order = {
          branchId: filters.branchId,
        };
      }

      // Search by customer name or product name
      if (filters.search) {
        where.OR = [
          {
            customer: {
              fullName: { contains: filters.search, mode: 'insensitive' },
            },
          },
          {
            order: {
              orderItems: {
                some: {
                  product: {
                    name: { contains: filters.search, mode: 'insensitive' },
                  },
                },
              },
            },
          },
        ];
      }

      // Get installments
      const [installments, total] = await Promise.all([
        prisma.installment_plans.findMany({
          where,
          skip,
          take: limit,
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
              where: {
                status: {
                  in: ['PENDING', 'PARTIAL', 'OVERDUE'],
                },
              },
              orderBy: {
                dueDate: 'asc',
              },
              take: 1,
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.installment_plans.count({ where }),
      ]);

      // Format installments with status and progress
      const formattedInstallments = installments.map((plan) => {
        const productName = plan.order.orderItems[0]?.product.name || 'Unknown Product';
        const nextDue = plan.schedule[0];

        // Determine status
        let status = 'on-track';
        if (nextDue) {
          if (nextDue.status === 'OVERDUE') {
            status = 'overdue';
          } else {
            const daysUntilDue = Math.ceil(
              (new Date(nextDue.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );
            if (daysUntilDue <= 7) {
              status = 'due-soon';
            }
          }
        }

        return {
          id: plan.id,
          customerName: plan.customer.fullName,
          customerId: plan.customerId,
          productName,
          monthlyPayment: Number(plan.monthlyAmount),
          nextDueDate: nextDue?.dueDate || null,
          status,
          branchName: plan.order.branch?.name || 'No Branch',
        };
      });

      return {
        installments: formattedInstallments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Get installments error:', error);
      throw new Error('Failed to fetch installments');
    }
  }

  /**
   * Get installment by ID for detail view
   * @param installmentId - Installment plan ID
   * @returns Promise resolving to installment detail
   */
  async getInstallmentById(installmentId: number) {
    try {
      const plan = await prisma.installment_plans.findUnique({
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
        throw new InstallmentError('INSTALLMENT_NOT_FOUND', 'خطة التقسيط غير موجودة');
      }

      const productName = plan.order.orderItems[0]?.product.name || 'Unknown Product';
      const productPrice = Number(plan.order.orderItems[0]?.unitPrice || 0);

      // Calculate progress
      const paidInstallments = plan.schedule.filter((s) => s.status === 'PAID').length;
      const progressPercentage = (paidInstallments / plan.schedule.length) * 100;

      return {
        id: plan.id,
        orderNumber: plan.order.orderNumber,
        customer: {
          id: plan.customer.id,
          fullName: plan.customer.fullName,
          nationalId: plan.customer.nationalId,
          phone: plan.customer.phone,
        },
        product: {
          name: productName,
          price: productPrice,
        },
        terms: {
          totalAmount: Number(plan.totalAmount),
          depositAmount: Number(plan.depositAmount),
          financedAmount: Number(plan.financedAmount),
          monthlyAmount: Number(plan.monthlyAmount),
          termMonths: plan.periodMonths,
          startDate: plan.startDate,
          endDate: plan.endDate,
        },
        schedule: plan.schedule.map((item) => ({
          sequenceNumber: item.sequenceNumber,
          dueDate: item.dueDate,
          totalAmount: Number(item.totalAmount),
          paidAmount: Number(item.paidAmount),
          status: item.status,
        })),
        status: plan.status,
        progressPercentage: Math.round(progressPercentage),
        branchName: plan.order.branch?.name || 'No Branch',
        createdAt: plan.createdAt,
      };
    } catch (error) {
      if (error instanceof InstallmentError) {
        throw error;
      }
      console.error('Get installment by ID error:', error);
      throw new Error('Failed to fetch installment details');
    }
  }

  /**
   * Get printable installment agreement
   * @param installmentId - Installment plan ID
   * @returns Promise resolving to agreement data
   */
  async getInstallmentAgreement(installmentId: number) {
    try {
      const plan = await prisma.installment_plans.findUnique({
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
          createdByUser: true,
        },
      });

      if (!plan) {
        throw new InstallmentError('INSTALLMENT_NOT_FOUND', 'خطة التقسيط غير موجودة');
      }

      const productName = plan.order.orderItems[0]?.product.name || 'Unknown Product';
      const productPrice = Number(plan.order.orderItems[0]?.unitPrice || 0);

      return {
        agreementNumber: `AGR-${plan.id}-${plan.order.orderNumber}`,
        agreementDate: plan.createdAt,
        customer: {
          fullName: plan.customer.fullName,
          nationalId: plan.customer.nationalId,
          phone: plan.customer.phone,
          address: plan.customer.address,
          city: plan.customer.city,
        },
        product: {
          name: productName,
          price: productPrice,
        },
        terms: {
          totalAmount: Number(plan.totalAmount),
          depositAmount: Number(plan.depositAmount),
          financedAmount: Number(plan.financedAmount),
          monthlyAmount: Number(plan.monthlyAmount),
          termMonths: plan.periodMonths,
          totalWithRatio: Number(plan.totalWithRatio),
          startDate: plan.startDate,
          endDate: plan.endDate,
        },
        schedule: plan.schedule.map((item) => ({
          sequenceNumber: item.sequenceNumber,
          dueDate: item.dueDate,
          amount: Number(item.totalAmount),
        })),
        branch: {
          name: plan.order.branch?.name || 'No Branch',
          address: plan.order.branch?.address,
          phone: plan.order.branch?.phone,
        },
        seller: {
          fullName: plan.createdByUser.fullName,
        },
      };
    } catch (error) {
      if (error instanceof InstallmentError) {
        throw error;
      }
      console.error('Get installment agreement error:', error);
      throw new Error('Failed to fetch installment agreement');
    }
  }

  /**
   * Calculate installment details (no deposit)
   * @param productPrice - Product cash price
   * @param termMonths - Term length in months
   * @returns Promise resolving to calculation details
   */
  async calculateInstallment(productPrice: number, termMonths: number) {
    try {
      const calculation = await installmentCalculationService.calculateMonthlyPayment(
        productPrice,
        termMonths
      );

      return calculation;
    } catch (error) {
      console.error('Calculate installment error:', error);
      throw new Error('Failed to calculate installment');
    }
  }

  /**
   * Send bulk reminders for selected installments with optimized batch processing
   * @param installmentIds - Array of installment plan IDs
   * @param method - Reminder method (whatsapp, sms, or both)
   * @param onProgress - Optional callback for progress updates
   * @returns Promise resolving to reminder results
   */
  async sendBulkReminders(
    installmentIds: number[],
    method: 'whatsapp' | 'sms' | 'both',
    onProgress?: (progress: number, total: number) => void
  ) {
    try {
      // Validate installment IDs
      if (!installmentIds || installmentIds.length === 0) {
        throw new InstallmentError('NO_SELECTION', 'يرجى تحديد قسط واحد على الأقل');
      }

      // Fetch installments with customer and schedule data
      const installments = await prisma.installment_plans.findMany({
        where: {
          id: { in: installmentIds },
          status: { in: ['ACTIVE', 'PENDING'] },
        },
        include: {
          customer: true,
          schedule: {
            where: {
              status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
            },
            orderBy: {
              dueDate: 'asc',
            },
            take: 1,
          },
        },
      });

      if (installments.length === 0) {
        throw new InstallmentError('NO_INSTALLMENTS_FOUND', 'لم يتم العثور على أقساط نشطة');
      }

      // Validate phone numbers
      const invalidPhoneCustomers: string[] = [];
      const validInstallments = installments.filter((plan) => {
        const phone = plan.customer.phone;
        // Egyptian phone validation: 11 digits starting with 01
        const isValid = phone && /^01\d{9}$/.test(phone);
        if (!isValid) {
          invalidPhoneCustomers.push(plan.customer.fullName);
        }
        return isValid;
      });

      // Process reminders in optimized batches (max 50 per batch)
      const BATCH_SIZE = 50;
      let successCount = 0;
      let failedCount = 0;
      const failedCustomers: string[] = [];
      const totalToProcess = validInstallments.length;

      for (let i = 0; i < validInstallments.length; i += BATCH_SIZE) {
        const batch = validInstallments.slice(i, i + BATCH_SIZE);

        // Process batch in parallel for better performance
        const batchPromises = batch.map(async (plan) => {
          try {
            const nextDue = plan.schedule[0];
            if (!nextDue) {
              return { success: false, reason: 'no_pending' };
            }

            // Prepare reminder message
            const message = `عزيزي ${plan.customer.fullName}، نذكرك بموعد دفعة القسط المستحقة\nالمبلغ: ${Number(nextDue.totalAmount).toFixed(2)} ج.م\nتاريخ الاستحقاق: ${new Date(nextDue.dueDate).toLocaleDateString('ar-EG')}`;

            // In a real implementation, you would integrate with WhatsApp/SMS API here
            // For now, we just log the activity
            console.log(`Reminder sent to ${plan.customer.fullName} via ${method}:`, message);

            // Simulate API delay (remove in production)
            await new Promise((resolve) => setTimeout(resolve, 10));

            return { success: true, customerName: plan.customer.fullName };
          } catch (error) {
            console.error(`Failed to send reminder to ${plan.customer.fullName}:`, error);
            return { success: false, customerName: plan.customer.fullName };
          }
        });

        // Wait for batch to complete
        const batchResults = await Promise.all(batchPromises);

        // Count results
        batchResults.forEach((result) => {
          if (result.success) {
            successCount++;
          } else if (result.customerName) {
            failedCount++;
            failedCustomers.push(result.customerName);
          }
        });

        // Report progress
        if (onProgress) {
          onProgress(i + batch.length, totalToProcess);
        }
      }

      return {
        successCount,
        failedCount: failedCount + invalidPhoneCustomers.length,
        failedCustomers: [...failedCustomers, ...invalidPhoneCustomers],
        invalidPhoneCustomers,
      };
    } catch (error) {
      if (error instanceof InstallmentError) {
        throw error;
      }
      console.error('Send bulk reminders error:', error);
      throw new Error('Failed to send reminders');
    }
  }

  /**
   * Export installments to Excel or PDF format
   * @param installmentIds - Array of installment plan IDs
   * @param format - Export format (excel or pdf)
   * @returns Promise resolving to export data with installments
   */
  async exportInstallments(installmentIds: number[], format: 'excel' | 'pdf') {
    try {
      // Validate installment IDs
      if (!installmentIds || installmentIds.length === 0) {
        throw new InstallmentError('NO_SELECTION', 'يرجى تحديد قسط واحد على الأقل');
      }

      // Fetch installments with all required data
      const installments = await prisma.installment_plans.findMany({
        where: {
          id: { in: installmentIds },
        },
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
            where: {
              status: {
                in: ['PENDING', 'PARTIAL', 'OVERDUE'],
              },
            },
            orderBy: {
              dueDate: 'asc',
            },
            take: 1,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (installments.length === 0) {
        throw new InstallmentError('NO_INSTALLMENTS_FOUND', 'لم يتم العثور على أقساط');
      }

      // Format data for export
      const exportData = installments.map((plan) => {
        const productName = plan.order.orderItems[0]?.product.name || 'Unknown Product';
        const nextDue = plan.schedule[0];

        // Calculate progress
        const totalSchedule = plan.periodMonths;
        const paidSchedule = totalSchedule - plan.schedule.length;
        const progressPercentage = Math.round((paidSchedule / totalSchedule) * 100);

        // Determine status
        let status = 'في الموعد';
        if (nextDue) {
          if (nextDue.status === 'OVERDUE') {
            status = 'متأخر';
          } else {
            const daysUntilDue = Math.ceil(
              (new Date(nextDue.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );
            if (daysUntilDue <= 7) {
              status = 'مستحق قريباً';
            }
          }
        } else if (plan.status === 'COMPLETED') {
          status = 'مكتمل';
        }

        return {
          customerName: plan.customer.fullName,
          nationalId: plan.customer.nationalId,
          product: productName,
          totalAmount: Number(plan.totalAmount),
          monthlyPayment: Number(plan.monthlyAmount),
          nextDueDate: nextDue?.dueDate || null,
          status,
          progressPercentage,
        };
      });

      return {
        installments: exportData,
        format,
      };
    } catch (error) {
      if (error instanceof InstallmentError) {
        throw error;
      }
      console.error('Export installments error:', error);
      throw new Error('Failed to export installments');
    }
  }
}

export default new InstallmentService();
export { InstallmentError, CreateInstallmentData, InstallmentFilters };
