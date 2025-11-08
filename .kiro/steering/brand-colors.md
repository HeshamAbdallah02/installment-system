---
inclusion: always
---

# Brand Color System - Mandatory Guidelines

## Critical Rule: ONLY Use Brand Colors

**ALL frontend components MUST use the official brand color palette. No exceptions.**

### Official Brand Colors (From Sabaya Logo)

1. **Primary: Deep Burgundy** - `#560001` → `brand-primary-900`
2. **Secondary: Warm Gold** - `#eacb95` → `brand-secondary-400`  
3. **Neutral: Off-White** - `#fafaf9` → `brand-offwhite-100`

### Tailwind Color Classes

**✅ ALLOWED - Use These:**
```
brand-primary-{50-950}    // Burgundy shades
brand-secondary-{50-900}  // Gold shades
brand-offwhite-{50-900}   // Off-white/gray shades
white                     // Pure white
black                     // Pure black (sparingly)
```

**❌ FORBIDDEN - Never Use:**
```
red-*, blue-*, green-*, yellow-*, purple-*, pink-*, indigo-*
teal-*, cyan-*, emerald-*, lime-*, amber-*, orange-*
gray-*, slate-*, zinc-*, neutral-*, stone-*
```

### Quick Reference for Common Elements

**Buttons:**
- Primary: `bg-brand-primary-900 hover:bg-brand-primary-950 text-white`
- Secondary: `bg-brand-secondary-400 hover:bg-brand-secondary-500 text-brand-primary-900`

**Backgrounds:**
- Page: `bg-brand-offwhite-100`
- Card: `bg-white`
- Highlighted: `bg-brand-secondary-50`

**Text:**
- Headings: `text-brand-primary-900`
- Body: `text-brand-offwhite-900`
- Secondary: `text-brand-offwhite-700`

**Borders:**
- Primary: `border-brand-primary-900`
- Neutral: `border-brand-offwhite-400`

**Focus States:**
- `focus:ring-brand-primary-900 focus:border-brand-primary-900`

### Enforcement

When writing or reviewing code:
1. Search for any non-brand color classes (e.g., `bg-blue-`, `text-red-`)
2. Replace with appropriate brand color
3. Verify contrast ratios for accessibility
4. Reference `/frontend/docs/BRAND_COLORS.md` for detailed guidelines

### Why This Matters

Consistent brand colors:
- Strengthen brand identity
- Improve user experience
- Ensure accessibility compliance
- Maintain professional appearance
- Reflect the Sabaya logo throughout the app

**No arbitrary colors. No default Tailwind colors. Only brand colors.**
