import prisma from '../prismaClient';
import { Prisma } from '@prisma/client';

/**
 * Service for handling collection reports
 */
class ReportService {
  /**
   * Generate daily collection report
   */
  async getDailyReport(date: Date, branchId?: number) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const where: Prisma.PaymentWhereInput = {
        paymentDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        isReversal: false,
      };

      if (branchId) {
        where.order = {
          branchId,
        };
      }

      // Get all payments for the day
      const payments = await prisma.payment.findMany({
        where,
        include: {
          customer: true,
          collectedByUser: true,
          order: {
            include: {
              branch: true,
            },
          },
        },
      });

      // Calculate totals
      const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const paymentCount = payments.length;

      // Payment method breakdown
      const paymentMethodBreakdown = {
        cash: 0,
        bankTransfer: 0,
        card: 0,
        check: 0,
      };

      payments.forEach((payment) => {
        const amount = Number(payment.amount);
        switch (payment.paymentMethod) {
          case 'CASH':
            paymentMethodBreakdown.cash += amount;
            break;
          case 'BANK_TRANSFER':
            paymentMethodBreakdown.bankTransfer += amount;
            break;
          case 'CARD':
            paymentMethodBreakdown.card += amount;
            break;
          case 'CHECK':
            paymentMethodBreakdown.check += amount;
            break;
        }
      });

      // Collector performance
      const collectorMap = new Map<number, { name: string; count: number; total: number }>();
      payments.forEach((payment) => {
        const collectorId = payment.collectedBy;
        if (!collectorMap.has(collectorId)) {
          collectorMap.set(collectorId, {
            name: payment.collectedByUser.fullName,
            count: 0,
            total: 0,
          });
        }
        const collector = collectorMap.get(collectorId)!;
        collector.count += 1;
        collector.total += Number(payment.amount);
      });

      const collectorPerformance = Array.from(collectorMap.entries()).map(([id, data]) => ({
        collectorId: id,
        collectorName: data.name,
        paymentCount: data.count,
        totalCollected: data.total,
      }));

      // Detailed payments list
      const detailedPayments = payments.map((payment) => ({
        paymentNumber: payment.paymentNumber,
        customerName: payment.customer.fullName,
        amount: Number(payment.amount),
        paymentMethod: payment.paymentMethod,
        collectorName: payment.collectedByUser.fullName,
        time: payment.createdAt,
      }));

      return {
        date,
        totalCollected,
        paymentCount,
        paymentMethodBreakdown,
        collectorPerformance,
        payments: detailedPayments,
      };
    } catch (error) {
      console.error('Get daily report error:', error);
      throw new Error('Failed to generate daily report');
    }
  }

  /**
   * Generate weekly collection report
   */
  async getWeeklyReport(startDate: Date, endDate: Date, branchId?: number) {
    try {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const where: Prisma.PaymentWhereInput = {
        paymentDate: {
          gte: start,
          lte: end,
        },
        isReversal: false,
      };

      if (branchId) {
        where.order = {
          branchId,
        };
      }

      // Get all payments for the week
      const payments = await prisma.payment.findMany({
        where,
        include: {
          customer: true,
          collectedByUser: true,
        },
      });

      // Calculate totals
      const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const paymentCount = payments.length;

      // Payment method breakdown
      const paymentMethodBreakdown = {
        cash: 0,
        bankTransfer: 0,
        card: 0,
        check: 0,
      };

      payments.forEach((payment) => {
        const amount = Number(payment.amount);
        switch (payment.paymentMethod) {
          case 'CASH':
            paymentMethodBreakdown.cash += amount;
            break;
          case 'BANK_TRANSFER':
            paymentMethodBreakdown.bankTransfer += amount;
            break;
          case 'CARD':
            paymentMethodBreakdown.card += amount;
            break;
          case 'CHECK':
            paymentMethodBreakdown.check += amount;
            break;
        }
      });

      // Daily breakdown
      const dailyMap = new Map<string, { date: Date; amount: number; count: number }>();
      payments.forEach((payment) => {
        const dateKey = payment.paymentDate.toISOString().split('T')[0];
        if (!dailyMap.has(dateKey)) {
          dailyMap.set(dateKey, {
            date: payment.paymentDate,
            amount: 0,
            count: 0,
          });
        }
        const daily = dailyMap.get(dateKey)!;
        daily.amount += Number(payment.amount);
        daily.count += 1;
      });

      const dailyTotals = Array.from(dailyMap.values()).sort(
        (a, b) => a.date.getTime() - b.date.getTime()
      );

      // Calculate average daily collection
      const daysInPeriod = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const averageDaily = totalCollected / daysInPeriod;

      // Collector performance
      const collectorMap = new Map<number, { name: string; count: number; total: number }>();
      payments.forEach((payment) => {
        const collectorId = payment.collectedBy;
        if (!collectorMap.has(collectorId)) {
          collectorMap.set(collectorId, {
            name: payment.collectedByUser.fullName,
            count: 0,
            total: 0,
          });
        }
        const collector = collectorMap.get(collectorId)!;
        collector.count += 1;
        collector.total += Number(payment.amount);
      });

      const collectorPerformance = Array.from(collectorMap.entries()).map(([id, data]) => ({
        collectorId: id,
        collectorName: data.name,
        paymentCount: data.count,
        totalCollected: data.total,
      }));

      // Get previous week for comparison
      const prevStart = new Date(start);
      prevStart.setDate(prevStart.getDate() - 7);
      const prevEnd = new Date(end);
      prevEnd.setDate(prevEnd.getDate() - 7);

      const prevWhere: Prisma.PaymentWhereInput = {
        paymentDate: {
          gte: prevStart,
          lte: prevEnd,
        },
        isReversal: false,
      };

      if (branchId) {
        prevWhere.order = {
          branchId,
        };
      }

      const prevPayments = await prisma.payment.findMany({
        where: prevWhere,
      });

      const prevTotal = prevPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const comparisonToPrevious =
        prevTotal > 0 ? ((totalCollected - prevTotal) / prevTotal) * 100 : 0;

      return {
        startDate: start,
        endDate: end,
        totalCollected,
        paymentCount,
        paymentMethodBreakdown,
        dailyTotals,
        averageDaily,
        collectorPerformance,
        comparisonToPrevious,
      };
    } catch (error) {
      console.error('Get weekly report error:', error);
      throw new Error('Failed to generate weekly report');
    }
  }

  /**
   * Generate monthly collection report
   */
  async getMonthlyReport(month: number, year: number, branchId?: number) {
    try {
      const startDate = new Date(year, month - 1, 1);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(year, month, 0);
      endDate.setHours(23, 59, 59, 999);

      const where: Prisma.PaymentWhereInput = {
        paymentDate: {
          gte: startDate,
          lte: endDate,
        },
        isReversal: false,
      };

      if (branchId) {
        where.order = {
          branchId,
        };
      }

      // Get all payments for the month
      const payments = await prisma.payment.findMany({
        where,
        include: {
          customer: true,
          collectedByUser: true,
        },
      });

      // Calculate totals
      const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const paymentCount = payments.length;

      // Payment method breakdown
      const paymentMethodBreakdown = {
        cash: 0,
        bankTransfer: 0,
        card: 0,
        check: 0,
      };

      payments.forEach((payment) => {
        const amount = Number(payment.amount);
        switch (payment.paymentMethod) {
          case 'CASH':
            paymentMethodBreakdown.cash += amount;
            break;
          case 'BANK_TRANSFER':
            paymentMethodBreakdown.bankTransfer += amount;
            break;
          case 'CARD':
            paymentMethodBreakdown.card += amount;
            break;
          case 'CHECK':
            paymentMethodBreakdown.check += amount;
            break;
        }
      });

      // Daily breakdown
      const dailyMap = new Map<string, { date: Date; amount: number; count: number }>();
      payments.forEach((payment) => {
        const dateKey = payment.paymentDate.toISOString().split('T')[0];
        if (!dailyMap.has(dateKey)) {
          dailyMap.set(dateKey, {
            date: payment.paymentDate,
            amount: 0,
            count: 0,
          });
        }
        const daily = dailyMap.get(dateKey)!;
        daily.amount += Number(payment.amount);
        daily.count += 1;
      });

      const dailyTotals = Array.from(dailyMap.values()).sort(
        (a, b) => a.date.getTime() - b.date.getTime()
      );

      // Calculate average daily collection
      const daysInMonth = endDate.getDate();
      const averageDaily = totalCollected / daysInMonth;

      // Top 5 customers by payment amount
      const customerMap = new Map<number, { name: string; total: number; count: number }>();
      payments.forEach((payment) => {
        const customerId = payment.customerId;
        if (!customerMap.has(customerId)) {
          customerMap.set(customerId, {
            name: payment.customer.fullName,
            total: 0,
            count: 0,
          });
        }
        const customer = customerMap.get(customerId)!;
        customer.total += Number(payment.amount);
        customer.count += 1;
      });

      const topCustomers = Array.from(customerMap.entries())
        .map(([id, data]) => ({
          customerId: id,
          customerName: data.name,
          totalPaid: data.total,
          paymentCount: data.count,
        }))
        .sort((a, b) => b.totalPaid - a.totalPaid)
        .slice(0, 5);

      // Collector performance
      const collectorMap = new Map<number, { name: string; count: number; total: number }>();
      payments.forEach((payment) => {
        const collectorId = payment.collectedBy;
        if (!collectorMap.has(collectorId)) {
          collectorMap.set(collectorId, {
            name: payment.collectedByUser.fullName,
            count: 0,
            total: 0,
          });
        }
        const collector = collectorMap.get(collectorId)!;
        collector.count += 1;
        collector.total += Number(payment.amount);
      });

      const collectorPerformance = Array.from(collectorMap.entries()).map(([id, data]) => ({
        collectorId: id,
        collectorName: data.name,
        paymentCount: data.count,
        totalCollected: data.total,
      }));

      // Calculate collection rate (collected / due)
      const scheduleWhere: Prisma.InstallmentScheduleWhereInput = {
        dueDate: {
          gte: startDate,
          lte: endDate,
        },
      };

      if (branchId) {
        scheduleWhere.plan = {
          order: {
            branchId,
          },
        };
      }

      const schedules = await prisma.installmentSchedule.findMany({
        where: scheduleWhere,
      });

      const totalDue = schedules.reduce((sum, s) => sum + Number(s.totalAmount), 0);
      const collectionRate = totalDue > 0 ? (totalCollected / totalDue) * 100 : 0;

      // Calculate overdue amounts at end of period
      const overdueWhere: Prisma.InstallmentScheduleWhereInput = {
        dueDate: {
          lt: endDate,
        },
        status: {
          in: ['PENDING', 'PARTIAL', 'OVERDUE'],
        },
      };

      if (branchId) {
        overdueWhere.plan = {
          order: {
            branchId,
          },
        };
      }

      const overdueSchedules = await prisma.installmentSchedule.findMany({
        where: overdueWhere,
      });

      const overdueAmount = overdueSchedules.reduce(
        (sum, s) => sum + (Number(s.totalAmount) - Number(s.paidAmount)),
        0
      );

      // Get previous month for comparison
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      const prevStartDate = new Date(prevYear, prevMonth - 1, 1);
      prevStartDate.setHours(0, 0, 0, 0);
      const prevEndDate = new Date(prevYear, prevMonth, 0);
      prevEndDate.setHours(23, 59, 59, 999);

      const prevWhere: Prisma.PaymentWhereInput = {
        paymentDate: {
          gte: prevStartDate,
          lte: prevEndDate,
        },
        isReversal: false,
      };

      if (branchId) {
        prevWhere.order = {
          branchId,
        };
      }

      const prevPayments = await prisma.payment.findMany({
        where: prevWhere,
      });

      const prevTotal = prevPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const comparisonToPrevious =
        prevTotal > 0 ? ((totalCollected - prevTotal) / prevTotal) * 100 : 0;

      return {
        month,
        year,
        startDate,
        endDate,
        totalCollected,
        paymentCount,
        paymentMethodBreakdown,
        dailyTotals,
        averageDaily,
        topCustomers,
        collectorPerformance,
        collectionRate,
        overdueAmount,
        comparisonToPrevious,
      };
    } catch (error) {
      console.error('Get monthly report error:', error);
      throw new Error('Failed to generate monthly report');
    }
  }

  /**
   * Export report data to Excel or PDF
   */
  async exportReport(
    reportType: 'daily' | 'weekly' | 'monthly',
    format: 'excel' | 'pdf',
    params: {
      date?: Date;
      startDate?: Date;
      endDate?: Date;
      month?: number;
      year?: number;
      branchId?: number;
    }
  ) {
    try {
      let reportData: any;

      // Get report data based on type
      switch (reportType) {
        case 'daily':
          if (!params.date) {
            throw new Error('Date is required for daily report');
          }
          reportData = await this.getDailyReport(params.date, params.branchId);
          break;
        case 'weekly':
          if (!params.startDate || !params.endDate) {
            throw new Error('Start and end dates are required for weekly report');
          }
          reportData = await this.getWeeklyReport(
            params.startDate,
            params.endDate,
            params.branchId
          );
          break;
        case 'monthly':
          if (!params.month || !params.year) {
            throw new Error('Month and year are required for monthly report');
          }
          reportData = await this.getMonthlyReport(params.month, params.year, params.branchId);
          break;
        default:
          throw new Error('Invalid report type');
      }

      return {
        reportType,
        format,
        data: reportData,
      };
    } catch (error) {
      console.error('Export report error:', error);
      throw new Error('Failed to export report');
    }
  }
}

export default new ReportService();
