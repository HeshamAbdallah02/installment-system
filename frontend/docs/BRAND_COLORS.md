# Brand Visual Identity - Color System

## Overview

This document defines the official color palette for the Egyptian Retail Installments Management System (نظام إدارة الأقساط). All colors are derived from the Sabaya logo and must be used consistently across the entire application.

## Brand Colors

### Primary Color: Deep Burgundy/Maroon

**Hex:** `#560001`  
**Tailwind Class:** `brand-primary-900`

**Usage:**

- Primary buttons and CTAs
- Active navigation items
- Important headings
- Focus states for critical actions
- Error states and alerts

**Examples:**

```jsx
// Button
<button className="bg-brand-primary-900 hover:bg-brand-primary-950 text-white">
  دخول
</button>

// Heading
<h1 className="text-brand-primary-900 font-bold">
  نظام إدارة الأقساط
</h1>

// Border accent
<div className="border-r-4 border-brand-primary-900">
  Content
</div>
```

### Secondary Color: Warm Gold/Beige

**Hex:** `#eacb95`  
**Tailwind Class:** `brand-secondary-400`

**Usage:**

- Secondary buttons
- Hover states
- Badges and tags
- Highlights and accents
- Success states
- Decorative elements

**Examples:**

```jsx
// Secondary button
<button className="bg-brand-secondary-400 hover:bg-brand-secondary-500 text-brand-primary-900">
  إلغاء
</button>

// Badge
<span className="bg-brand-secondary-400 text-brand-primary-900 px-3 py-1 rounded-full">
  نشط
</span>

// Accent background
<div className="bg-brand-secondary-50 border border-brand-secondary-400">
  Highlighted content
</div>
```

### Neutral Color: Off-White

**Hex:** `#fafaf9`  
**Tailwind Class:** `brand-offwhite-100`

**Usage:**

- Page backgrounds
- Card backgrounds
- Input field backgrounds
- Modal backgrounds
- Light sections

**Examples:**

```jsx
// Page background
<div className="min-h-screen bg-brand-offwhite-100">
  Content
</div>

// Card
<div className="bg-white shadow-lg rounded-lg p-6">
  Card content
</div>

// Input
<input className="bg-brand-offwhite-100 border border-brand-offwhite-400" />
```

## Color Palette Reference

### Brand Primary (Burgundy) Scale

```
50:  #fef2f2  - Lightest tint
100: #fee2e2
200: #fecaca
300: #fca5a5
400: #f87171
500: #ef4444
600: #dc2626
700: #b91c1c
800: #991b1b
900: #560001  ← MAIN BRAND COLOR
950: #3d0001  - Darkest shade
```

### Brand Secondary (Gold) Scale

```
50:  #fdfbf7  - Lightest tint
100: #faf6ed
200: #f5edd9
300: #f0e3c5
400: #eacb95  ← MAIN BRAND COLOR
500: #e5b97d
600: #dfa765
700: #d9954d
800: #c07a35
900: #a05f1d  - Darkest shade
```

### Brand Neutral (Off-White) Scale

```
50:  #ffffff  - Pure white
100: #fafaf9  ← MAIN BRAND COLOR
200: #f5f5f4
300: #e7e5e4
400: #d6d3d1
500: #a8a29e
600: #78716c
700: #57534e
800: #44403c
900: #292524  - Near black
```

## Usage Guidelines

### ✅ DO

1. **Use brand colors for all UI elements**
   - Buttons: `brand-primary-900` for primary, `brand-secondary-400` for secondary
   - Backgrounds: `brand-offwhite-100` for pages, `white` for cards
   - Text: `brand-primary-900` for headings, `brand-offwhite-900` for body

2. **Maintain color hierarchy**
   - Primary actions: Burgundy (`brand-primary-900`)
   - Secondary actions: Gold (`brand-secondary-400`)
   - Neutral elements: Off-white shades

3. **Use appropriate contrast ratios**
   - Dark text on light backgrounds (WCAG AA compliant)
   - White text on burgundy backgrounds
   - Dark burgundy text on gold backgrounds

4. **Apply hover states consistently**
   - Primary buttons: `hover:bg-brand-primary-950`
   - Secondary buttons: `hover:bg-brand-secondary-500`
   - Links: `hover:text-brand-primary-800`

### ❌ DON'T

1. **Don't use arbitrary colors**
   - ❌ `bg-blue-500`, `text-green-600`, `border-purple-400`
   - ✅ Use only `brand-primary`, `brand-secondary`, `brand-offwhite`

2. **Don't use default Tailwind colors**
   - ❌ `bg-red-500`, `text-gray-700`, `border-indigo-300`
   - ✅ Use brand color scales instead

3. **Don't mix color systems**
   - ❌ Combining brand colors with default Tailwind colors
   - ✅ Stick to the brand palette exclusively

4. **Don't use colors without semantic meaning**
   - ❌ Random color choices for decoration
   - ✅ Every color should have a purpose (primary action, secondary action, neutral)

## Component Color Patterns

### Buttons

```jsx
// Primary Button
<button className="bg-brand-primary-900 hover:bg-brand-primary-950 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
  دخول
</button>

// Secondary Button
<button className="bg-brand-secondary-400 hover:bg-brand-secondary-500 text-brand-primary-900 font-semibold py-3 px-6 rounded-lg transition-colors">
  إلغاء
</button>

// Outline Button
<button className="border-2 border-brand-primary-900 text-brand-primary-900 hover:bg-brand-primary-900 hover:text-white font-semibold py-3 px-6 rounded-lg transition-colors">
  تفاصيل
</button>
```

### Forms

```jsx
// Input Field
<input
  className="w-full px-4 py-3 bg-brand-offwhite-100 border border-brand-offwhite-400 rounded-lg focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900 text-brand-offwhite-900"
  placeholder="أدخل النص"
/>

// Label
<label className="block text-brand-primary-900 font-semibold mb-2">
  اسم المستخدم
</label>

// Error Message
<p className="text-brand-primary-700 text-sm mt-1">
  هذا الحقل مطلوب
</p>
```

### Cards

```jsx
// Standard Card
<div className="bg-white rounded-lg shadow-lg p-6 border border-brand-offwhite-300">
  <h3 className="text-brand-primary-900 font-bold text-xl mb-4">
    عنوان البطاقة
  </h3>
  <p className="text-brand-offwhite-700">
    محتوى البطاقة
  </p>
</div>

// Highlighted Card
<div className="bg-brand-secondary-50 rounded-lg border-2 border-brand-secondary-400 p-6">
  <h3 className="text-brand-primary-900 font-bold text-xl mb-4">
    بطاقة مميزة
  </h3>
  <p className="text-brand-offwhite-800">
    محتوى مهم
  </p>
</div>
```

### Navigation

```jsx
// Active Nav Item
<a className="text-brand-primary-900 bg-brand-secondary-100 px-4 py-2 rounded-lg font-semibold">
  لوحة التحكم
</a>

// Inactive Nav Item
<a className="text-brand-offwhite-700 hover:text-brand-primary-900 hover:bg-brand-offwhite-200 px-4 py-2 rounded-lg transition-colors">
  العملاء
</a>
```

### Badges and Tags

```jsx
// Success Badge
<span className="bg-brand-secondary-400 text-brand-primary-900 px-3 py-1 rounded-full text-sm font-semibold">
  نشط
</span>

// Warning Badge
<span className="bg-brand-secondary-200 text-brand-secondary-900 px-3 py-1 rounded-full text-sm font-semibold">
  قيد الانتظار
</span>

// Error Badge
<span className="bg-brand-primary-100 text-brand-primary-900 px-3 py-1 rounded-full text-sm font-semibold">
  معطل
</span>
```

### Tables

```jsx
// Table Header
<thead className="bg-brand-primary-900 text-white">
  <tr>
    <th className="px-6 py-3 text-right">الاسم</th>
    <th className="px-6 py-3 text-right">الفرع</th>
  </tr>
</thead>

// Table Row (Alternating)
<tbody>
  <tr className="bg-white hover:bg-brand-offwhite-100 transition-colors">
    <td className="px-6 py-4 text-brand-offwhite-900">أحمد محمد</td>
    <td className="px-6 py-4 text-brand-offwhite-700">فرع القاهرة</td>
  </tr>
  <tr className="bg-brand-offwhite-50 hover:bg-brand-offwhite-100 transition-colors">
    <td className="px-6 py-4 text-brand-offwhite-900">فاطمة علي</td>
    <td className="px-6 py-4 text-brand-offwhite-700">فرع الإسكندرية</td>
  </tr>
</tbody>
```

## Accessibility

### Contrast Ratios (WCAG AA Compliant)

✅ **Passing Combinations:**

- White text on `brand-primary-900` (Burgundy) - 12.5:1
- `brand-primary-900` text on white - 12.5:1
- `brand-primary-900` text on `brand-secondary-400` (Gold) - 4.8:1
- `brand-offwhite-900` text on white - 15.2:1

❌ **Failing Combinations (Avoid):**

- `brand-secondary-400` text on white - Low contrast
- White text on `brand-secondary-400` - Low contrast

### Recommended Text Colors

**On White/Light Backgrounds:**

- Headings: `text-brand-primary-900`
- Body text: `text-brand-offwhite-900` or `text-brand-offwhite-800`
- Secondary text: `text-brand-offwhite-700`

**On Burgundy Background:**

- All text: `text-white`

**On Gold Background:**

- All text: `text-brand-primary-900`

## Implementation Checklist

When creating new components, ensure:

- [ ] All colors use `brand-primary`, `brand-secondary`, or `brand-offwhite` classes
- [ ] No default Tailwind colors (red, blue, green, etc.) are used
- [ ] Hover states use darker shades from the same color family
- [ ] Focus states use `brand-primary-900` ring
- [ ] Text contrast meets WCAG AA standards
- [ ] Color usage follows semantic meaning (primary = main actions, secondary = supporting)

## Quick Reference

```jsx
// Most Common Classes
bg - brand - primary - 900; // Primary button background
bg - brand - secondary - 400; // Secondary button background
bg - brand - offwhite - 100; // Page background
bg - white; // Card background

text - brand - primary - 900; // Headings
text - brand - offwhite - 900; // Body text
text - brand - offwhite - 700; // Secondary text

border - brand - primary - 900; // Primary borders
border - brand - offwhite - 400; // Neutral borders

hover: bg - brand - primary - 950; // Primary button hover
hover: bg - brand - secondary - 500; // Secondary button hover

focus: ring - brand - primary - 900; // Focus ring
focus: border - brand - primary - 900; // Focus border
```

## Enforcement

To ensure brand colors are used consistently:

1. **Code Review:** Check that all new components use brand colors
2. **Linting:** Consider adding ESLint rules to flag non-brand colors
3. **Design Review:** Verify UI matches brand guidelines before merging
4. **Documentation:** Reference this guide in all component documentation

## Questions?

If you're unsure which color to use:

1. **Primary actions** (login, save, submit) → `brand-primary-900`
2. **Secondary actions** (cancel, back) → `brand-secondary-400`
3. **Backgrounds** → `brand-offwhite-100` or `white`
4. **Text** → `brand-primary-900` (headings) or `brand-offwhite-900` (body)

When in doubt, refer to existing components or ask the design team.
