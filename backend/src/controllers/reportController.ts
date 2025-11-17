import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth.types';
import reportService from '../services/reportService';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

/**
 * Controller for handling report-related requests
 */
class ReportController {
  /**
   * Get daily collection report
   * GET /api/reports/daily
   */
  async getDailyReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'غير مصرح',
          },
        });
        return;
      }

      const { date, branch } = req.query;

      const reportDate = date ? new Date(date as string) : new Date();
      const branchId = branch ? parseInt(branch as string) : req.user.branchId || undefined;

      const report = await reportService.getDailyReport(reportDate, branchId);

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      console.error('Get daily report error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'خطأ في الخادم. يرجى المحاولة مرة أخرى',
        },
      });
    }
  }

  /**
   * Get weekly collection report
   * GET /api/reports/weekly
   */
  async getWeeklyReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'غير مصرح',
          },
        });
        return;
      }

      const { startDate, endDate, branch } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_DATES',
            message: 'تاريخ البداية والنهاية مطلوبان',
          },
        });
        return;
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      const branchId = branch ? parseInt(branch as string) : req.user.branchId || undefined;

      const report = await reportService.getWeeklyReport(start, end, branchId);

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      console.error('Get weekly report error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'خطأ في الخادم. يرجى المحاولة مرة أخرى',
        },
      });
    }
  }

  /**
   * Get monthly collection report
   * GET /api/reports/monthly
   */
  async getMonthlyReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'غير مصرح',
          },
        });
        return;
      }

      const { month, year, branch } = req.query;

      if (!month || !year) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PARAMS',
            message: 'الشهر والسنة مطلوبان',
          },
        });
        return;
      }

      const monthNum = parseInt(month as string);
      const yearNum = parseInt(year as string);
      const branchId = branch ? parseInt(branch as string) : req.user.branchId || undefined;

      if (monthNum < 1 || monthNum > 12) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_MONTH',
            message: 'الشهر غير صالح',
          },
        });
        return;
      }

      const report = await reportService.getMonthlyReport(monthNum, yearNum, branchId);

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      console.error('Get monthly report error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'خطأ في الخادم. يرجى المحاولة مرة أخرى',
        },
      });
    }
  }

  /**
   * Export report to Excel or PDF
   * POST /api/reports/export
   * Performance: Large exports are streamed directly to response using pipe()
   * This prevents memory issues with large datasets
   */
  async exportReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'غير مصرح',
          },
        });
        return;
      }

      const { reportType, format, date, startDate, endDate, month, year, branch } = req.body;

      if (!reportType || !format) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PARAMS',
            message: 'نوع التقرير والصيغة مطلوبان',
          },
        });
        return;
      }

      if (!['daily', 'weekly', 'monthly'].includes(reportType)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REPORT_TYPE',
            message: 'نوع التقرير غير صالح',
          },
        });
        return;
      }

      if (!['excel', 'pdf'].includes(format)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_FORMAT',
            message: 'صيغة التصدير غير صالحة',
          },
        });
        return;
      }

      const params = {
        date: date ? new Date(date) : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        month: month ? parseInt(month) : undefined,
        year: year ? parseInt(year) : undefined,
        branchId: branch ? parseInt(branch) : req.user.branchId || undefined,
      };

      const exportData = await reportService.exportReport(reportType, format, params);

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `report_${reportType}_${timestamp}.${format === 'excel' ? 'xlsx' : 'pdf'}`;

      if (format === 'excel') {
        // Use ExcelJS to generate Excel file
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('تقرير التحصيل');

        // Set RTL
        worksheet.views = [{ rightToLeft: true }];

        // Add title
        const titleRow = worksheet.addRow([
          `تقرير التحصيل - ${reportType === 'daily' ? 'يومي' : reportType === 'weekly' ? 'أسبوعي' : 'شهري'}`,
        ]);
        titleRow.font = { size: 16, bold: true, color: { argb: 'FF560001' } };
        titleRow.alignment = { horizontal: 'center' };
        worksheet.mergeCells(1, 1, 1, 3);
        worksheet.addRow([]);

        // Add date range
        let dateRangeText = '';
        if (reportType === 'daily' && exportData.data.date) {
          dateRangeText = new Date(exportData.data.date).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
        } else if (
          reportType === 'weekly' &&
          exportData.data.startDate &&
          exportData.data.endDate
        ) {
          const start = new Date(exportData.data.startDate).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
          const end = new Date(exportData.data.endDate).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
          dateRangeText = `${start} - ${end}`;
        } else if (reportType === 'monthly' && exportData.data.month && exportData.data.year) {
          dateRangeText = new Date(
            exportData.data.year,
            exportData.data.month - 1
          ).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
          });
        }
        const dateRow = worksheet.addRow(['التاريخ:', dateRangeText]);
        dateRow.font = { bold: true };
        worksheet.addRow([]);

        // Add summary section
        const summaryHeaderRow = worksheet.addRow(['الملخص']);
        summaryHeaderRow.font = { size: 14, bold: true, color: { argb: 'FF560001' } };
        summaryHeaderRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFEACB95' },
        };
        worksheet.mergeCells(worksheet.lastRow.number, 1, worksheet.lastRow.number, 3);

        worksheet.addRow([
          'الإجمالي المحصل',
          `${exportData.data.totalCollected.toFixed(2)} ج.م`,
          '',
        ]);
        worksheet.addRow(['عدد الدفعات', exportData.data.paymentCount, '']);

        if (exportData.data.averageDaily !== undefined) {
          worksheet.addRow([
            'متوسط التحصيل اليومي',
            `${exportData.data.averageDaily.toFixed(2)} ج.م`,
            '',
          ]);
        }

        if (exportData.data.collectionRate !== undefined) {
          worksheet.addRow(['معدل التحصيل', `${exportData.data.collectionRate.toFixed(2)}%`, '']);
        }

        if (exportData.data.comparisonToPrevious !== undefined) {
          const comparison = exportData.data.comparisonToPrevious;
          const comparisonText =
            comparison >= 0 ? `+${comparison.toFixed(2)}%` : `${comparison.toFixed(2)}%`;
          worksheet.addRow(['المقارنة بالفترة السابقة', comparisonText, '']);
        }

        worksheet.addRow([]);

        // Add payment method breakdown
        const methodHeaderRow = worksheet.addRow(['التوزيع حسب طريقة الدفع']);
        methodHeaderRow.font = { size: 14, bold: true, color: { argb: 'FF560001' } };
        methodHeaderRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFEACB95' },
        };
        worksheet.mergeCells(worksheet.lastRow.number, 1, worksheet.lastRow.number, 3);

        worksheet.addRow([
          'نقدي',
          `${exportData.data.paymentMethodBreakdown.cash.toFixed(2)} ج.م`,
          '',
        ]);
        worksheet.addRow([
          'تحويل بنكي',
          `${exportData.data.paymentMethodBreakdown.bankTransfer.toFixed(2)} ج.م`,
          '',
        ]);
        worksheet.addRow([
          'بطاقة',
          `${exportData.data.paymentMethodBreakdown.card.toFixed(2)} ج.م`,
          '',
        ]);
        worksheet.addRow([
          'شيك',
          `${exportData.data.paymentMethodBreakdown.check.toFixed(2)} ج.م`,
          '',
        ]);
        worksheet.addRow([]);

        // Add collector performance
        if (
          exportData.data.collectorPerformance &&
          exportData.data.collectorPerformance.length > 0
        ) {
          const collectorHeaderRow = worksheet.addRow(['أداء المحصلين']);
          collectorHeaderRow.font = { size: 14, bold: true, color: { argb: 'FF560001' } };
          collectorHeaderRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFEACB95' },
          };
          worksheet.mergeCells(worksheet.lastRow.number, 1, worksheet.lastRow.number, 3);

          const collectorTableHeader = worksheet.addRow(['الاسم', 'عدد الدفعات', 'الإجمالي']);
          collectorTableHeader.font = { bold: true };
          collectorTableHeader.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFAFAF9' },
          };

          exportData.data.collectorPerformance.forEach((collector: { collectorName: string; paymentCount: number; totalCollected: number }) => {
            worksheet.addRow([
              collector.collectorName,
              collector.paymentCount,
              `${collector.totalCollected.toFixed(2)} ج.م`,
            ]);
          });
          worksheet.addRow([]);
        }

        // Add top customers (for monthly reports)
        if (exportData.data.topCustomers && exportData.data.topCustomers.length > 0) {
          const topCustomersHeaderRow = worksheet.addRow(['أفضل 5 عملاء']);
          topCustomersHeaderRow.font = { size: 14, bold: true, color: { argb: 'FF560001' } };
          topCustomersHeaderRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFEACB95' },
          };
          worksheet.mergeCells(worksheet.lastRow.number, 1, worksheet.lastRow.number, 3);

          const customersTableHeader = worksheet.addRow([
            'اسم العميل',
            'عدد الدفعات',
            'الإجمالي المدفوع',
          ]);
          customersTableHeader.font = { bold: true };
          customersTableHeader.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFAFAF9' },
          };

          exportData.data.topCustomers.forEach((customer: { customerName: string; paymentCount: number; totalPaid: number }) => {
            worksheet.addRow([
              customer.customerName,
              customer.paymentCount,
              `${customer.totalPaid.toFixed(2)} ج.م`,
            ]);
          });
          worksheet.addRow([]);
        }

        // Add daily breakdown (for weekly/monthly reports)
        if (exportData.data.dailyTotals && exportData.data.dailyTotals.length > 0) {
          const dailyHeaderRow = worksheet.addRow(['التوزيع اليومي']);
          dailyHeaderRow.font = { size: 14, bold: true, color: { argb: 'FF560001' } };
          dailyHeaderRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFEACB95' },
          };
          worksheet.mergeCells(worksheet.lastRow.number, 1, worksheet.lastRow.number, 3);

          const dailyTableHeader = worksheet.addRow(['التاريخ', 'عدد الدفعات', 'الإجمالي']);
          dailyTableHeader.font = { bold: true };
          dailyTableHeader.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFAFAF9' },
          };

          exportData.data.dailyTotals.forEach((daily: { date: string | Date; count: number; amount: number }) => {
            const dateStr = new Date(daily.date).toLocaleDateString('ar-EG', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });
            worksheet.addRow([dateStr, daily.count, `${daily.amount.toFixed(2)} ج.م`]);
          });
        }

        // Style the worksheet
        worksheet.columns = [
          { width: 30, style: { alignment: { horizontal: 'right' } } },
          { width: 20, style: { alignment: { horizontal: 'right' } } },
          { width: 20, style: { alignment: { horizontal: 'right' } } },
        ];

        // Add borders to all cells
        worksheet.eachRow((row: ExcelJS.Row) => {
          row.eachCell((cell: ExcelJS.Cell) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' },
            };
          });
        });

        const buffer = await workbook.xlsx.writeBuffer();

        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
      } else {
        // Use PDFKit to generate PDF file
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          bufferPages: true,
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        doc.pipe(res);

        // Add title
        doc
          .fontSize(20)
          .fillColor('#560001')
          .text(
            `تقرير التحصيل - ${reportType === 'daily' ? 'يومي' : reportType === 'weekly' ? 'أسبوعي' : 'شهري'}`,
            { align: 'center' }
          );
        doc.moveDown();

        // Add date range
        doc.fontSize(12).fillColor('#000000');
        let dateRangeText = '';
        if (reportType === 'daily' && exportData.data.date) {
          dateRangeText = new Date(exportData.data.date).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
        } else if (
          reportType === 'weekly' &&
          exportData.data.startDate &&
          exportData.data.endDate
        ) {
          const start = new Date(exportData.data.startDate).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
          const end = new Date(exportData.data.endDate).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
          dateRangeText = `${start} - ${end}`;
        } else if (reportType === 'monthly' && exportData.data.month && exportData.data.year) {
          dateRangeText = new Date(
            exportData.data.year,
            exportData.data.month - 1
          ).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
          });
        }
        doc.text(`التاريخ: ${dateRangeText}`, { align: 'center' });
        doc.moveDown(2);

        // Add summary section
        doc.fontSize(14).fillColor('#560001').text('الملخص:', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).fillColor('#000000');
        doc.text(`الإجمالي المحصل: ${exportData.data.totalCollected.toFixed(2)} ج.م`);
        doc.text(`عدد الدفعات: ${exportData.data.paymentCount}`);

        if (exportData.data.averageDaily !== undefined) {
          doc.text(`متوسط التحصيل اليومي: ${exportData.data.averageDaily.toFixed(2)} ج.م`);
        }

        if (exportData.data.collectionRate !== undefined) {
          doc.text(`معدل التحصيل: ${exportData.data.collectionRate.toFixed(2)}%`);
        }

        if (exportData.data.comparisonToPrevious !== undefined) {
          const comparison = exportData.data.comparisonToPrevious;
          const comparisonText =
            comparison >= 0 ? `+${comparison.toFixed(2)}%` : `${comparison.toFixed(2)}%`;
          doc.text(`المقارنة بالفترة السابقة: ${comparisonText}`);
        }

        doc.moveDown(2);

        // Add payment method breakdown
        doc.fontSize(14).fillColor('#560001').text('التوزيع حسب طريقة الدفع:', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11).fillColor('#000000');
        doc.text(`نقدي: ${exportData.data.paymentMethodBreakdown.cash.toFixed(2)} ج.م`);
        doc.text(
          `تحويل بنكي: ${exportData.data.paymentMethodBreakdown.bankTransfer.toFixed(2)} ج.م`
        );
        doc.text(`بطاقة: ${exportData.data.paymentMethodBreakdown.card.toFixed(2)} ج.م`);
        doc.text(`شيك: ${exportData.data.paymentMethodBreakdown.check.toFixed(2)} ج.م`);
        doc.moveDown(2);

        // Add collector performance
        if (
          exportData.data.collectorPerformance &&
          exportData.data.collectorPerformance.length > 0
        ) {
          doc.fontSize(14).fillColor('#560001').text('أداء المحصلين:', { underline: true });
          doc.moveDown(0.5);
          doc.fontSize(11).fillColor('#000000');
          exportData.data.collectorPerformance.forEach((collector: { collectorName: string; paymentCount: number; totalCollected: number }) => {
            doc.text(
              `${collector.collectorName}: ${collector.paymentCount} دفعة - ${collector.totalCollected.toFixed(2)} ج.م`
            );
          });
          doc.moveDown(2);
        }

        // Add top customers (for monthly reports)
        if (exportData.data.topCustomers && exportData.data.topCustomers.length > 0) {
          doc.fontSize(14).fillColor('#560001').text('أفضل 5 عملاء:', { underline: true });
          doc.moveDown(0.5);
          doc.fontSize(11).fillColor('#000000');
          exportData.data.topCustomers.forEach((customer: { customerName: string; paymentCount: number; totalPaid: number }, index: number) => {
            doc.text(
              `${index + 1}. ${customer.customerName}: ${customer.paymentCount} دفعة - ${customer.totalPaid.toFixed(2)} ج.م`
            );
          });
          doc.moveDown(2);
        }

        // Add footer
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);
          doc
            .fontSize(10)
            .fillColor('#666666')
            .text(`صفحة ${i + 1} من ${pages.count}`, 50, doc.page.height - 50, { align: 'center' });
          doc.text(
            `تم الإنشاء في: ${new Date().toLocaleDateString('ar-EG', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}`,
            50,
            doc.page.height - 35,
            { align: 'center' }
          );
        }

        doc.end();
      }
    } catch (error) {
      console.error('Export report error:', error);

      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: {
            code: 'SERVER_ERROR',
            message: 'خطأ في الخادم. يرجى المحاولة مرة أخرى',
          },
        });
      }
    }
  }
}

export default new ReportController();
