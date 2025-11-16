import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

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
 * Generate Excel file from installment data
 * @param installments - Array of installment data
 * @returns Promise resolving to Excel buffer
 */
export async function generateExcelExport(installments: ExportInstallmentData[]): Promise<Buffer> {
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

  // Add data rows
  installments.forEach((installment) => {
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
 * Generate PDF file from installment data
 * @param installments - Array of installment data
 * @returns PDF stream
 */
export function generatePDFExport(
  installments: ExportInstallmentData[]
): typeof PDFDocument.prototype {
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margin: 50,
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

  // Draw data rows
  doc.fillColor('#000000');
  installments.forEach((installment, rowIndex) => {
    if (currentY > 500) {
      // Add new page if needed
      doc.addPage();
      currentY = 50;
    }

    currentX = startX;
    const rowData = [
      installment.customerName,
      installment.nationalId,
      installment.product,
      `${installment.totalAmount.toFixed(2)} ج.م`,
      `${installment.monthlyPayment.toFixed(2)} ج.م`,
      installment.nextDueDate ? new Date(installment.nextDueDate).toLocaleDateString('ar-EG') : '-',
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
    if (rowIndex < installments.length - 1) {
      doc
        .moveTo(startX, currentY)
        .lineTo(startX + columnWidths.reduce((a, b) => a + b, 0), currentY)
        .stroke('#CCCCCC');
      currentY += 10;
    }
  });

  // Footer
  doc.moveDown(3);
  doc.fontSize(10).fillColor('#666666').text(`إجمالي السجلات: ${installments.length}`, {
    align: 'center',
  });

  doc.end();
  return doc;
}
