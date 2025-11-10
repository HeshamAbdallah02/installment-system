import prisma from '../prismaClient';
import { Prisma } from '@prisma/client';
import installmentCalculationService from './installmentCalculationService';

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
  productId: number;
  depositAmount: number;
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
      const customer = await prisma.customer.findUnique({
        where: { id: data.customerId },
      });

      if (!customer) {
        throw new InstallmentError('CUSTOMER_NOT_FOUND', 'العميل غير موجود');
      }

      // Validate product exists
      const product = await prisma.product.findUnique({
        where: { id: data.productId },
      });

      if (!product) {
        throw new InstallmentError('PRODUCT_NOT_FOUND', 'المنتج غير موجود');
      }

      // Validate deposit
      await installmentCalculationService.validateDeposit(data.depositAmount, data.productId);

      // Calculate installment details
      const productPrice = Number(product.cashPrice);
      const calculation = await installmentCalculationService.calculateMonthlyPayment(
        productPrice,
        data.depositAmount,
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

      // Create order, installment plan, and schedule in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create order
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
              create: [
                {
                  productId: data.productId,
                  quantity: 1,
                  unitPrice: productPrice,
                  lineTotal: productPrice,
                },
              ],
            },
          },
        });

        // Create installment plan
        const plan = await tx.installmentPlan.create({
          data: {
            orderId: order.id,
            customerId: data.customerId,
            totalAmount: productPrice,
            depositAmount: data.depositAmount,
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

      return {
        id: result.plan.id,
        orderId: result.order.id,
        orderNumber: result.order.orderNumber,
        customerId: data.customerId,
        customerName: customer.fullName,
        productName: product.name,
        totalAmount: calculation.totalToPay,
        depositAmount: data.depositAmount,
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
      const where: Prisma.InstallmentPlanWhereInput = {};

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
        prisma.installmentPlan.findMany({
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
        prisma.installmentPlan.count({ where }),
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
   * Get available installment ratios
   * @returns Promise resolving to list of active ratios
   */
  async getAvailableRatios() {
    try {
      const ratios = await prisma.installmentRatio.findMany({
        where: { isActive: true },
        orderBy: { periodMonths: 'asc' },
      });

      return ratios.map((ratio) => ({
        periodMonths: ratio.periodMonths,
        ratioMultiplier: Number(ratio.ratioMultiplier),
        description: ratio.description,
      }));
    } catch (error) {
      console.error('Get available ratios error:', error);
      throw new Error('Failed to fetch installment ratios');
    }
  }

  /**
   * Calculate installment details
   * @param productPrice - Product cash price
   * @param depositAmount - Deposit amount
   * @param termMonths - Term length in months
   * @returns Promise resolving to calculation details
   */
  async calculateInstallment(productPrice: number, depositAmount: number, termMonths: number) {
    try {
      const calculation = await installmentCalculationService.calculateMonthlyPayment(
        productPrice,
        depositAmount,
        termMonths
      );

      return calculation;
    } catch (error) {
      console.error('Calculate installment error:', error);
      throw new Error('Failed to calculate installment');
    }
  }
}

export default new InstallmentService();
export { InstallmentError, CreateInstallmentData, InstallmentFilters };
