import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { useDebounce } from '../../hooks/useDebounce';
import type { ProductFilters } from '../../types/product';

interface FiltersBarProps {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  categories: string[];
}

/**
 * FiltersBar Component
 * Provides search and filtering capabilities for products
 * Requirements: 2.1-2.9
 */
const FiltersBar: React.FC<FiltersBarProps> = ({ filters, onFiltersChange, categories }) => {
  const [searchInput, setSearchInput] = useState(filters.search || '');

  // Debounce search input (300ms) - Requirement 2.6
  const debouncedSearch = useDebounce(searchInput, 300);

  // Update filters when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onFiltersChange({ ...filters, search: debouncedSearch, page: 1 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  /**
   * Count active filters - Requirement 2.8
   */
  const getActiveFiltersCount = (): number => {
    let count = 0;
    if (filters.search) count++;
    if (filters.category) count++;
    if (filters.minPrice || filters.maxPrice) count++;
    if (filters.status && filters.status !== 'ALL') count++;
    if (filters.installmentAvailable !== undefined) count++;
    return count;
  };

  /**
   * Clear all filters - Requirement 2.9
   */
  const handleClearFilters = () => {
    setSearchInput('');
    onFiltersChange({
      page: 1,
      limit: filters.limit,
    });
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-brand-offwhite-300 mb-6">
      {/* Filters Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-5 h-5 text-brand-primary-900" />
          <h3 className="text-lg font-bold text-brand-primary-900">البحث والتصفية</h3>
        </div>

        {/* Active Filters Count & Clear Button - Requirements 2.8, 2.9 */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-brand-primary-900 bg-brand-secondary-50 px-3 py-1 rounded-full">
              {activeFiltersCount} فلاتر نشطة
            </span>
            <button
              type="button"
              onClick={handleClearFilters}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-primary-900 hover:bg-brand-offwhite-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
              <span>مسح الفلاتر</span>
            </button>
          </div>
        )}
      </div>

      {/* Filters Grid */}
      <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-5 gap-4">
        {/* Search Input - Requirements 2.1, 2.6 */}
        <div className="desktop:col-span-2">
          <label
            htmlFor="search"
            className="block text-sm font-medium text-brand-primary-900 mb-2 text-right"
          >
            البحث
          </label>
          <div className="relative">
            <input
              id="search"
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="ابحث بالاسم أو الكود..."
              className="w-full pr-10 pl-4 py-2 border border-brand-offwhite-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900 text-right"
            />
            <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-offwhite-500" />
          </div>
        </div>

        {/* Category Filter - Requirement 2.2 */}
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-brand-primary-900 mb-2 text-right"
          >
            الفئة
          </label>
          <select
            id="category"
            value={filters.category || ''}
            onChange={(e) =>
              onFiltersChange({ ...filters, category: e.target.value || undefined, page: 1 })
            }
            className="w-full px-4 py-2 border border-brand-offwhite-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900 text-right"
          >
            <option value="">جميع الفئات</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter - Requirement 2.4 */}
        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-brand-primary-900 mb-2 text-right"
          >
            الحالة
          </label>
          <select
            id="status"
            value={filters.status || 'ALL'}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                status: e.target.value === 'ALL' ? undefined : e.target.value,
                page: 1,
              })
            }
            className="w-full px-4 py-2 border border-brand-offwhite-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900 text-right"
          >
            <option value="ALL">الكل</option>
            <option value="ACTIVE">متوفر</option>
            <option value="OUT_OF_STOCK">نفذ المخزون</option>
          </select>
        </div>

        {/* Installment Availability Filter - Requirement 2.5 */}
        <div>
          <label
            htmlFor="installment"
            className="block text-sm font-medium text-brand-primary-900 mb-2 text-right"
          >
            التقسيط
          </label>
          <select
            id="installment"
            value={
              filters.installmentAvailable === undefined
                ? 'ALL'
                : filters.installmentAvailable
                  ? 'YES'
                  : 'NO'
            }
            onChange={(e) => {
              const value = e.target.value === 'ALL' ? undefined : e.target.value === 'YES';
              onFiltersChange({ ...filters, installmentAvailable: value, page: 1 });
            }}
            className="w-full px-4 py-2 border border-brand-offwhite-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900 text-right"
          >
            <option value="ALL">الكل</option>
            <option value="YES">متاح للتقسيط</option>
            <option value="NO">نقدي فقط</option>
          </select>
        </div>
      </div>

      {/* Price Range Filter - Requirement 2.3 */}
      <div className="mt-4 grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-4 gap-4">
        <div>
          <label
            htmlFor="minPrice"
            className="block text-sm font-medium text-brand-primary-900 mb-2 text-right"
          >
            السعر من (ج.م)
          </label>
          <input
            id="minPrice"
            type="number"
            min="0"
            value={filters.minPrice || ''}
            onChange={(e) => {
              const value = e.target.value ? parseFloat(e.target.value) : undefined;
              onFiltersChange({ ...filters, minPrice: value, page: 1 });
            }}
            placeholder="0"
            className="w-full px-4 py-2 border border-brand-offwhite-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900 text-right"
          />
        </div>

        <div>
          <label
            htmlFor="maxPrice"
            className="block text-sm font-medium text-brand-primary-900 mb-2 text-right"
          >
            السعر إلى (ج.م)
          </label>
          <input
            id="maxPrice"
            type="number"
            min="0"
            value={filters.maxPrice || ''}
            onChange={(e) => {
              const value = e.target.value ? parseFloat(e.target.value) : undefined;
              onFiltersChange({ ...filters, maxPrice: value, page: 1 });
            }}
            placeholder="∞"
            className="w-full px-4 py-2 border border-brand-offwhite-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900 text-right"
          />
        </div>
      </div>
    </div>
  );
};

export default FiltersBar;
