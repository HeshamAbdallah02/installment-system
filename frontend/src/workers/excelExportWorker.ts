/**
 * Web Worker for Excel export generation
 * Offloads heavy Excel processing to prevent UI blocking
 * Requirements: 13.7
 */

import ExcelJS from 'exceljs';

interface ExportInstallmentData {
  customerName: string;
  nationalId: string;
  product: string;
  totalAmount: number;
  monthlyPayment: number;
  nextDueDate: Date | null;
  status: string;
  progressPercentage: number;
}

interface WorkerMessage {
  type: 'generate';
  data: ExportInstallmentData[];
}

interface WorkerResponse {
  type: 'success' | 'error' | 'progress';
  buffer?: ArrayBuffer;
  error?: string;
  progress?: number;
}

// Listen for messages from main thread
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, data } = event.data;

  if (type === 'generate') {
    try {
      // Send initial progress
      postProgress(0);

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('الأقساط', {
        views: [{ rightToLeft: true }],
      });

      postProgress(10);

      // Define columns with Arabic headers
      worksheet.columns = [
        { header: 'اسم العميل', key: 'customerName', width: 25 },
        { header: 'الرقم القومي', key: 'nationalId', width: 20 },
        { header: 'المنتج', key: 'product', width: 25 },
        { header: 'المبلغ الإجمالي', key: 'totalAmount', width: 18 },
        { header: 'القسط الشهري', key: 'monthlyPayment', width: 18 },
        { header: 'تاريخ الاستحقاق القادم', key: 'nextDueDate', width: 22 },
        { header: 'الحالة', key: 'status', width: 15 },
        { header: 'نسبة التقدم', key: 'progressPercentage', width: 15 },
      ];

      postProgress(20);

      // Style header row
      worksheet.getRow(1).font = { bold: true, size: 12 };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF560001' }, // Brand burgundy
      };
      worksheet.getRow(1).font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };

      postProgress(30);

      // Add data rows in batches to report progress
      const batchSize = 100;
      const totalRows = data.length;

      for (let i = 0; i < totalRows; i += batchSize) {
        const batch = data.slice(i, i + batchSize);

        batch.forEach((installment) => {
          worksheet.addRow({
            customerName: installment.customerName,
            nationalId: installment.nationalId,
            product: installment.product,
            totalAmount: `${installment.totalAmount.toFixed(2)} ج.م`,
            monthlyPayment: `${installment.monthlyPayment.toFixed(2)} ج.م`,
            nextDueDate: installment.nextDueDate
              ? new Date(installment.nextDueDate).toLocaleDateString('ar-EG')
              : '-',
            status: installment.status,
            progressPercentage: `${installment.progressPercentage}%`,
          });
        });

        // Report progress (30% to 70% for data insertion)
        const progress = 30 + Math.floor((i / totalRows) * 40);
        postProgress(progress);
      }

      postProgress(70);

      // Apply borders and alignment to all cells
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
          if (rowNumber > 1) {
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
          }
        });
      });

      postProgress(85);

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();

      postProgress(100);

      // Send success response
      const response: WorkerResponse = {
        type: 'success',
        buffer: buffer as ArrayBuffer,
      };
      self.postMessage(response, { transfer: [buffer as ArrayBuffer] });
    } catch (error) {
      // Send error response
      const response: WorkerResponse = {
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      self.postMessage(response);
    }
  }
};

function postProgress(progress: number) {
  const response: WorkerResponse = {
    type: 'progress',
    progress,
  };
  self.postMessage(response);
}

export {};
