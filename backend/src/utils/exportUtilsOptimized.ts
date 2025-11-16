import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

/**
 * Optimized export utilities with streaming and batch processing
 * Requirements: 12.8, 13.7
 */

/**
 * Interface for export data
 */
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

/**
 * Generate Excel file from installment data with batch processing
 * Optimized for large datasets
 * @param installments - Array of installment data
 * @param onProgress - Optional callback for progress updates
 * @returns Promise resolving to Excel buffer
 */
export async function generateExcelExportOptimized(
  installments: ExportInstallmentData[],
  onProgress?: (progress: number, total: number) => void
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('الأقساط', {
    views: [{ rightToLeft: true }],
  });

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

  // Style header row
  worksheet.getRow(1).font = { bold: true, size: 12 };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF560001' }, // Brand burgundy
  };
  worksheet.getRow(1).font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };

  // Add data rows in batches to prevent memory issues
  const BATCH_SIZE = 100;
  const total = installments.length;

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batch = installments.slice(i, i + BATCH_SIZE);

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

    // Report progress
    if (onProgress) {
      onProgress(i + batch.length, total);
    }
  }

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

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Generate PDF file from installment data with streaming
 * Optimized for large datasets to prevent memory issues
 * @param installments - Array of installment data
 * @returns PDF stream
 */
export function generatePDFExportOptimized(installments: ExportInstallmentData[]): Readable {
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margin: 50,
    bufferPages: true, // Enable buffering for better performance
  });

  // Title
  doc.fontSize(20).text('تقرير الأقساط', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}`, {
    align: 'center',
  });
  doc.moveDown(2);

  // Table headers
  const headers = [
    'اسم العميل',
    'الرقم القومي',
    'المنتج',
    'المبلغ الإجمالي',
    'القسط الشهري',
    'تاريخ الاستحقاق',
    'الحالة',
    'التقدم',
  ];

  const columnWidths = [80, 80, 80, 80, 80, 80, 60, 50];
  const startX = 50;
  let currentY = doc.y;

  // Draw header row
  doc.fontSize(10).fillColor('#560001');
  let currentX = startX;
  headers.forEach((header, index) => {
    doc.text(header, currentX, currentY, {
      width: columnWidths[index],
      align: 'center',
    });
    currentX += columnWidths[index];
  });

  currentY += 20;
  doc
    .moveTo(startX, currentY)
    .lineTo(startX + columnWidths.reduce((a, b) => a + b, 0), currentY)
    .stroke();
  currentY += 10;

  // Process rows in batches to prevent memory issues
  const BATCH_SIZE = 50;
  doc.fillColor('#000000');

  for (let i = 0; i < installments.length; i += BATCH_SIZE) {
    const batch = installments.slice(i, i + BATCH_SIZE);

    batch.forEach((installment, batchIndex) => {
      if (currentY > 500) {
        // Add new page if needed
        doc.addPage();
        currentY = 50;

        // Redraw headers on new page
        doc.fontSize(10).fillColor('#560001');
        currentX = startX;
        headers.forEach((header, index) => {
          doc.text(header, currentX, currentY, {
            width: columnWidths[index],
            align: 'center',
          });
          currentX += columnWidths[index];
        });

        currentY += 20;
        doc
          .moveTo(startX, currentY)
          .lineTo(startX + columnWidths.reduce((a, b) => a + b, 0), currentY)
          .stroke();
        currentY += 10;
        doc.fillColor('#000000');
      }

      currentX = startX;
      const rowData = [
        installment.customerName,
        installment.nationalId,
        installment.product,
        `${installment.totalAmount.toFixed(2)} ج.م`,
        `${installment.monthlyPayment.toFixed(2)} ج.م`,
        installment.nextDueDate
          ? new Date(installment.nextDueDate).toLocaleDateString('ar-EG')
          : '-',
        installment.status,
        `${installment.progressPercentage}%`,
      ];

      rowData.forEach((data, index) => {
        doc.text(data, currentX, currentY, {
          width: columnWidths[index],
          align: 'center',
        });
        currentX += columnWidths[index];
      });

      currentY += 20;

      // Draw row separator
      const globalIndex = i + batchIndex;
      if (globalIndex < installments.length - 1) {
        doc
          .moveTo(startX, currentY)
          .lineTo(startX + columnWidths.reduce((a, b) => a + b, 0), currentY)
          .stroke('#CCCCCC');
        currentY += 10;
      }
    });
  }

  // Footer
  doc.moveDown(3);
  doc.fontSize(10).fillColor('#666666').text(`إجمالي السجلات: ${installments.length}`, {
    align: 'center',
  });

  doc.end();

  // Return the stream directly for streaming response
  return doc as unknown as Readable;
}

/**
 * Create a readable stream from buffer for consistent streaming interface
 * @param buffer - Buffer to convert to stream
 * @returns Readable stream
 */
export function bufferToStream(buffer: Buffer): Readable {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}
