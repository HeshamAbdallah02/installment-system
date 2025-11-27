import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useDebounce } from '../../hooks/useDebounce';

interface SearchAndFiltersProps {
  onSearchChange: (search: string) => void;
  onStatusChange: (status: string) => void;
}

/**
 * SearchAndFilters component
 * Provides search input and filter dropdowns for customers
 * Requirements: 1.2, 1.3, 1.9
 */
const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  onSearchChange,
  onStatusChange,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Debounce search input (300ms)
  const debouncedSearch = useDebounce(searchInput, 300);

  // Trigger search when debounced value changes
  useEffect(() => {
    onSearchChange(debouncedSearch);
  }, [debouncedSearch, onSearchChange]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedStatus(value);
    onStatusChange(value);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6" dir="rtl">
      <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4">
        {/* Search Input */}
        <div className="relative">
          <label htmlFor="search" className="block text-sm font-medium text-brand-primary-900 mb-2">
            بحث
          </label>
          <div className="relative">
            <input
              id="search"
              type="text"
              value={searchInput}
              onChange={handleSearchInputChange}
              placeholder="ابحث بالاسم، الرقم القومي، أو الهاتف..."
              className="w-full pr-10 pl-4 py-2 border border-brand-offwhite-400 rounded-lg focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900 text-brand-offwhite-900 placeholder-brand-offwhite-500"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <MagnifyingGlassIcon className="w-5 h-5 text-brand-offwhite-500" />
            </div>
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-brand-primary-900 mb-2">
            حالة الدفع
          </label>
          <select
            id="status"
            value={selectedStatus}
            onChange={handleStatusChange}
            className="w-full px-4 py-2 border border-brand-offwhite-400 rounded-lg focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900 text-brand-offwhite-900 bg-white"
          >
            <option value="">الكل</option>
            <option value="on-track">في الموعد</option>
            <option value="overdue">متأخر</option>
            <option value="completed">مكتمل</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default SearchAndFilters;
