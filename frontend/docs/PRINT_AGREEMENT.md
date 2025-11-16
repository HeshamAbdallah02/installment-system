# Print Agreement Feature

## Overview

The print agreement feature allows users to print a formatted installment agreement directly from the installment detail page. The agreement includes all relevant information in Arabic with RTL layout and is optimized for printing.

## Components

### 1. PrintableAgreement Component

Located at: `frontend/src/components/installments/PrintableAgreement.tsx`

This component renders a print-friendly agreement template that includes:

- Company logo
- Agreement number and date
- Branch information
- Customer information (name, national ID, phone, address)
- Product information (name, cash price)
- Payment terms (total amount, deposit, monthly payment, term length, etc.)
- Complete payment schedule table
- Terms and conditions
- Signature sections for both parties

**Props:**

```typescript
interface PrintableAgreementProps {
  agreement: InstallmentAgreement;
}
```

### 2. Print Utility Functions

Located at: `frontend/src/utils/printAgreement.ts`

**prepareAgreementData()**: Converts InstallmentDetail data to the format required by PrintableAgreement component.

**triggerPrint()**: Triggers the browser print dialog after ensuring all images are loaded.

### 3. Print Styles

Located at: `frontend/src/styles/print.css`

Print-specific CSS that:

- Hides all non-printable UI elements
- Shows only the printable agreement
- Optimizes layout for A4 paper
- Ensures proper RTL layout
- Handles page breaks
- Ensures colors and borders print correctly

## Usage

### In InstallmentDetail Page

The print functionality is integrated into the InstallmentDetail page:

1. User clicks "طباعة العقد" (Print Agreement) from the actions menu
2. `handlePrintAgreement()` is called
3. Agreement data is prepared using `prepareAgreementData()`
4. PrintableAgreement component is rendered (hidden on screen)
5. `triggerPrint()` opens the browser print dialog
6. User can print or save as PDF

### Code Example

```typescript
const handlePrintAgreement = () => {
  if (!installment) return;

  // Prepare agreement data
  const agreement = prepareAgreementData({
    installment,
    schedule: paymentSchedule,
    branchName: 'الفرع الرئيسي',
    branchAddress: undefined,
    branchPhone: undefined,
    sellerName: installment.createdBy || 'البائع',
  });

  // Set agreement data to render the printable component
  setAgreementData(agreement);

  // Trigger print after component renders
  triggerPrint();
};
```

## Requirements Satisfied

- **8.1**: Print agreement button in actions menu
- **8.2**: Agreement includes company logo, customer info, product info, terms, schedule
- **8.3**: Agreement includes all required information
- **8.4**: Formatted in Arabic with RTL layout
- **8.5**: Print-friendly styling (optimized for A4, proper page breaks)
- **8.6**: Opens browser print dialog
- **8.7**: Hides UI elements in print view (only agreement is visible)

## Print Layout

The agreement is formatted for A4 paper with:

- 1.5cm margins
- Header with logo and agreement details
- Structured sections with clear headings
- Table for payment schedule
- Signature sections at the bottom
- Footer with print date

## Browser Compatibility

The print functionality works in all modern browsers:

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support

Users can:

- Print directly to a printer
- Save as PDF
- Adjust print settings (margins, orientation, etc.)

## Future Enhancements

Potential improvements:

- Add QR code for agreement verification
- Include company stamp/seal
- Add watermark for draft agreements
- Support for multiple languages
- Custom agreement templates per branch
