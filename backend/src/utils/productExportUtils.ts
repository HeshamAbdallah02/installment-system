import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

/**
 * Interface for product export data
 */
interface ExportProductData {
  code: string;
  name: string;
  category: string | null;
  sellingPrice: number;
  installmentPrice: number;
  stockQuantity: number;
  stockStatus: string;
  status: string;
  imageUrl?: string | null;
  statistics?:
    | {
        totalInstallments: number;
        activeInstallments: number;
        totalRevenue: number;
      }
    | unknown;
  inventoryHistory?:
    | Array<{
        type: string;
        quantity: number;
        reason: string;
        createdAt: Date;
      }>
    | unknown;
}

/**
 * Generate Excel file from product data
 * @param products - Array of product data
 * @returns Promise resolving to Excel buffer
 */
export async function generateProductExcelExport(products: ExportProductData[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('المنتجات', {
    views: [{ rightToLeft: true }],
  });

  // Define columns with Arabic headers
  const columns: Array<{ header: string; key: string; width: number }> = [
    { header: 'كود المنتج', key: 'code', width: 20 },
    { header: 'اسم المنتج', key: 'name', width: 30 },
    { header: 'الفئة', key: 'category', width: 20 },
    { header: 'سعر البيع', key: 'sellingPrice', width: 18 },
    { header: 'سعر التقسيط', key: 'installmentPrice', width: 18 },
    { header: 'الكمية', key: 'stockQuantity', width: 12 },
    { header: 'حالة المخزون', key: 'stockStatus', width: 18 },
    { header: 'الحالة', key: 'status', width: 15 },
  ];

  // Add statistics columns if included
  if (products.length > 0 && products[0].statistics) {
    columns.push(
      { header: 'إجمالي الأقساط', key: 'totalInstallments', width: 18 },
      { header: 'الأقساط النشطة', key: 'activeInstallments', width: 18 },
      { header: 'إجمالي الإيرادات', key: 'totalRevenue', width: 20 }
    );
  }

  worksheet.columns = columns;

  // Style header row
  worksheet.getRow(1).font = { bold: true, size: 12 };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF560001' }, // Brand burgundy
  };
  worksheet.getRow(1).font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };

  // Translate stock status
  const translateStockStatus = (status: string) => {
    const translations: Record<string, string> = {
      IN_STOCK: 'متوفر',
      LOW_STOCK: 'مخزون منخفض',
      OUT_OF_STOCK: 'نفذ المخزون',
    };
    return translations[status] || status;
  };

  // Translate status
  const translateStatus = (status: string) => {
    const translations: Record<string, string> = {
      ACTIVE: 'نشط',
      DISCONTINUED: 'موقوف',
    };
    return translations[status] || status;
  };

  // Add data rows
  products.forEach((product) => {
    const rowData: Record<string, string | number> = {
      code: product.code,
      name: product.name,
      category: product.category || '-',
      sellingPrice: `${product.sellingPrice.toFixed(2)} ج.م`,
      installmentPrice: `${product.installmentPrice.toFixed(2)} ج.م`,
      stockQuantity: product.stockQuantity,
      stockStatus: translateStockStatus(product.stockStatus),
      status: translateStatus(product.status),
    };

    // Add statistics if included
    if (product.statistics && typeof product.statistics === 'object') {
      const stats = product.statistics as {
        totalInstallments?: number;
        activeInstallments?: number;
        totalRevenue?: number;
      };
      if (stats.totalInstallments !== undefined)
        rowData.totalInstallments = stats.totalInstallments;
      if (stats.activeInstallments !== undefined)
        rowData.activeInstallments = stats.activeInstallments;
      if (stats.totalRevenue !== undefined)
        rowData.totalRevenue = `${stats.totalRevenue.toFixed(2)} ج.م`;
    }

    worksheet.addRow(rowData);
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
 * Generate PDF file from product data
 * @param products - Array of product data
 * @returns PDF stream
 */
export function generateProductPDFExport(
  products: ExportProductData[]
): typeof PDFDocument.prototype {
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margin: 50,
  });

  // Title
  doc.fontSize(20).text('تقرير المنتجات', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}`, {
    align: 'center',
  });
  doc.moveDown(2);

  // Table headers
  const headers = [
    'كود المنتج',
    'اسم المنتج',
    'الفئة',
    'السعر',
    'الكمية',
    'حالة المخزون',
    'الحالة',
  ];

  const columnWidths = [80, 120, 80, 80, 60, 100, 80];
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

  // Translate stock status
  const translateStockStatus = (status: string) => {
    const translations: Record<string, string> = {
      IN_STOCK: 'متوفر',
      LOW_STOCK: 'مخزون منخفض',
      OUT_OF_STOCK: 'نفذ المخزون',
    };
    return translations[status] || status;
  };

  // Translate status
  const translateStatus = (status: string) => {
    const translations: Record<string, string> = {
      ACTIVE: 'نشط',
      DISCONTINUED: 'موقوف',
    };
    return translations[status] || status;
  };

  // Draw data rows
  doc.fillColor('#000000');
  products.forEach((product, rowIndex) => {
    if (currentY > 500) {
      // Add new page if needed
      doc.addPage();
      currentY = 50;
    }

    currentX = startX;
    const rowData = [
      product.code,
      product.name.length > 20 ? product.name.substring(0, 20) + '...' : product.name,
      product.category || '-',
      `${product.sellingPrice.toFixed(2)} ج.م`,
      `${product.installmentPrice.toFixed(2)} ج.م`,
      product.stockQuantity.toString(),
      translateStockStatus(product.stockStatus),
      translateStatus(product.status),
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
    if (rowIndex < products.length - 1) {
      doc
        .moveTo(startX, currentY)
        .lineTo(startX + columnWidths.reduce((a, b) => a + b, 0), currentY)
        .stroke('#CCCCCC');
      currentY += 10;
    }
  });

  // Footer
  doc.moveDown(3);
  doc.fontSize(10).fillColor('#666666').text(`إجمالي المنتجات: ${products.length}`, {
    align: 'center',
  });

  doc.end();
  return doc;
}
