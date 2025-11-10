import prisma from '../prismaClient';
import { Prisma } from '@prisma/client';

/**
 * Custom error class for customer service errors
 */
class CustomerError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'CustomerError';
  }
}

/**
 * Interface for customer creation data
 */
interface CreateCustomerData {
  fullName: string;
  nationalId: string;
  phone: string;
  phoneSecondary?: string;
  address?: string;
  city?: string;
  createdBy: number;
}

/**
 * Interface for customer update data
 */
interface UpdateCustomerData {
  fullName?: string;
  phone?: string;
  phoneSecondary?: string;
  address?: string;
  city?: string;
}

/**
 * Interface for customer list filters
 */
interface CustomerFilters {
  search?: string;
  branchId?: number;
  status?: string;
  page?: number;
  limit?: number;
}

/**
 * Service for handling customer operations
 */
class CustomerService {
  /**
   * Create a new customer
   * @param data - Customer creation data
   * @returns Promise resolving to created customer
   * @throws CustomerError with code DUPLICATE_NATIONAL_ID
   */
  async createCustomer(data: CreateCustomerData) {
    try {
      // Check if national ID already exists
      const existingCustomer = await prisma.customer.findUnique({
        where: { nationalId: data.nationalId },
      });

      if (existingCustomer) {
        throw new CustomerError('DUPLICATE_NATIONAL_ID', 'الرقم القومي مسجل بالفعل');
      }

      // Create customer
      const customer = await prisma.customer.create({
        data: {
          fullName: data.fullName,
          nationalId: data.nationalId,
          phone: data.phone,
          phoneSecondary: data.phoneSecondary,
          address: data.address,
          city: data.city,
          createdBy: data.createdBy,
        },
        include: {
          createdByUser: {
            include: {
              branch: true,
            },
          },
        },
      });

      return {
        id: customer.id,
        fullName: customer.fullName,
        nationalId: customer.nationalId,
        phone: customer.phone,
        phoneSecondary: customer.phoneSecondary,
        address: customer.address,
        city: customer.city,
        branchName: customer.createdByUser.branch?.name || 'No Branch',
        branchId: customer.createdByUser.branchId,
        createdAt: customer.createdAt,
      };
    } catch (error) {
      if (error instanceof CustomerError) {
        throw error;
      }
      console.error('Create customer error:', error);
      throw new Error('Failed to create customer');
    }
  }

  /**
   * Get paginated list of customers with search and filters
   * @param filters - Filter options
   * @returns Promise resolving to paginated customer list
   */
  async getCustomers(filters: CustomerFilters) {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: Prisma.CustomerWhereInput = {};

      // Search by name, national ID, or phone
      if (filters.search) {
        where.OR = [
          { fullName: { contains: filters.search, mode: 'insensitive' } },
          { nationalId: { contains: filters.search } },
          { phone: { contains: filters.search } },
        ];
      }

      // Filter by branch (through createdByUser)
      if (filters.branchId) {
        where.createdByUser = {
          branchId: filters.branchId,
        };
      }

      // Get customers with installment counts
      const [customers, total] = await Promise.all([
        prisma.customer.findMany({
          where,
          skip,
          take: limit,
          include: {
            createdByUser: {
              include: {
                branch: true,
              },
            },
            installmentPlans: {
              where: {
                status: {
                  in: ['ACTIVE', 'PENDING'],
                },
              },
              include: {
                schedule: {
                  where: {
                    status: {
                      in: ['PENDING', 'PARTIAL', 'OVERDUE'],
                    },
                  },
                  orderBy: {
                    dueDate: 'asc',
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.customer.count({ where }),
      ]);

      // Calculate payment status for each customer
      const customersWithStatus = customers.map((customer) => {
        let paymentStatus: 'on-track' | 'overdue' | 'completed' = 'completed';

        if (customer.installmentPlans.length > 0) {
          const hasOverdue = customer.installmentPlans.some((plan) =>
            plan.schedule.some((s) => s.status === 'OVERDUE')
          );

          paymentStatus = hasOverdue ? 'overdue' : 'on-track';
        }

        return {
          id: customer.id,
          fullName: customer.fullName,
          nationalId: customer.nationalId,
          phone: customer.phone,
          branchName: customer.createdByUser.branch?.name || 'No Branch',
          branchId: customer.createdByUser.branchId,
          activeInstallmentsCount: customer.installmentPlans.length,
          paymentStatus,
        };
      });

      return {
        customers: customersWithStatus,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Get customers error:', error);
      throw new Error('Failed to fetch customers');
    }
  }

  /**
   * Get customer by ID with installments and payment history
   * @param customerId - Customer ID
   * @returns Promise resolving to customer detail
   */
  async getCustomerById(customerId: number) {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          createdByUser: {
            include: {
              branch: true,
            },
          },
          installmentPlans: {
            where: {
              status: {
                in: ['ACTIVE', 'PENDING'],
              },
            },
            include: {
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
          },
          payments: {
            include: {
              order: true,
            },
            orderBy: {
              paymentDate: 'desc',
            },
            take: 50,
          },
        },
      });

      if (!customer) {
        throw new CustomerError('CUSTOMER_NOT_FOUND', 'العميل غير موجود');
      }

      // Calculate installment details
      const installments = customer.installmentPlans.map((plan) => {
        const totalPaid = plan.schedule.reduce((sum, s) => sum + Number(s.paidAmount), 0);
        const totalAmount = Number(plan.totalWithRatio);
        const remainingBalance = totalAmount - totalPaid;
        const paidInstallments = plan.schedule.filter((s) => s.status === 'PAID').length;
        const progressPercentage = (paidInstallments / plan.schedule.length) * 100;

        // Determine status
        let status = 'on-track';
        const hasOverdue = plan.schedule.some((s) => s.status === 'OVERDUE');
        const nextDue = plan.schedule.find((s) => s.status === 'PENDING' || s.status === 'PARTIAL');

        if (hasOverdue) {
          status = 'overdue';
        } else if (nextDue) {
          const daysUntilDue = Math.ceil(
            (new Date(nextDue.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysUntilDue <= 7) {
            status = 'due-soon';
          }
        }

        const productName = plan.order.orderItems[0]?.product.name || 'Unknown Product';

        return {
          id: plan.id,
          productName,
          totalAmount,
          monthlyPayment: Number(plan.monthlyAmount),
          remainingBalance,
          status,
          progressPercentage: Math.round(progressPercentage),
          paidInstallments,
          totalInstallments: plan.schedule.length,
        };
      });

      // Format payment history
      const paymentHistory = customer.payments.map((payment) => ({
        id: payment.id,
        date: payment.paymentDate,
        amount: Number(payment.amount),
        orderNumber: payment.order.orderNumber,
        paymentMethod: payment.paymentMethod,
      }));

      // Calculate totals
      const totalActiveInstallments = installments.length;
      const totalRemainingBalance = installments.reduce((sum, i) => sum + i.remainingBalance, 0);

      return {
        id: customer.id,
        fullName: customer.fullName,
        nationalId: customer.nationalId,
        phone: customer.phone,
        phoneSecondary: customer.phoneSecondary,
        address: customer.address,
        city: customer.city,
        branchName: customer.createdByUser.branch?.name || 'No Branch',
        branchId: customer.createdByUser.branchId,
        createdAt: customer.createdAt,
        totalActiveInstallments,
        totalRemainingBalance,
        installments,
        paymentHistory,
      };
    } catch (error) {
      if (error instanceof CustomerError) {
        throw error;
      }
      console.error('Get customer by ID error:', error);
      throw new Error('Failed to fetch customer details');
    }
  }

  /**
   * Update customer information
   * @param customerId - Customer ID
   * @param data - Update data
   * @returns Promise resolving to updated customer
   */
  async updateCustomer(customerId: number, data: UpdateCustomerData) {
    try {
      const customer = await prisma.customer.update({
        where: { id: customerId },
        data: {
          fullName: data.fullName,
          phone: data.phone,
          phoneSecondary: data.phoneSecondary,
          address: data.address,
          city: data.city,
        },
        include: {
          createdByUser: {
            include: {
              branch: true,
            },
          },
        },
      });

      return {
        id: customer.id,
        fullName: customer.fullName,
        nationalId: customer.nationalId,
        phone: customer.phone,
        phoneSecondary: customer.phoneSecondary,
        address: customer.address,
        city: customer.city,
        branchName: customer.createdByUser.branch?.name || 'No Branch',
        branchId: customer.createdByUser.branchId,
      };
    } catch (error) {
      console.error('Update customer error:', error);
      throw new Error('Failed to update customer');
    }
  }
}

export default new CustomerService();
export { CustomerError, CreateCustomerData, UpdateCustomerData, CustomerFilters };
