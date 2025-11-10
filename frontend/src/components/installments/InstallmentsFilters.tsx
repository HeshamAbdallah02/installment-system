import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useDebounce } from '../../hooks/useDebounce';

interface InstallmentsFiltersProps {
  onSearchChange: (search: string) => void;
  onBranchChange: (branch: string) => void;
  onStatusChange: (status: string) => void;
  onDateRangeChange: (startDate: string, endDate: string) => void;
  branches?: { id: number; name: string }[];
}

/**
 * InstallmentsFilters component
 * Provides search input and filter dropdowns for installments
 * Requirements: 9.6, 9.7
 */
const InstallmentsFilters: React.FC<InstallmentsFiltersProps> = ({
  onSearchChange,
  onBranchChange,
  onStatusChange,
  onDateRangeChange,
  branches = [],
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Debounce search input (300ms)
  const debouncedSearch = useDebounce(searchInput, 300);

  // Trigger search when debounced value changes
  useEffect(() => {
    onSearchChange(debouncedSearch);
  }, [debouncedSearch, onSearchChange]);

  // Trigger date range change when dates change
  useEffect(() => {
    if (startDate || endDate) {
      onDateRangeChange(startDate, endDate);
    }
  }, [startDate, endDate, onDateRangeChange]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedBranch(value);
    onBranchChange(value);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedStatus(value);
    onStatusChange(value);
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6" dir="rtl">
      <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-5 gap-4">
        {/* Search Input */}
        <div className="relative desktop:col-span-2">
          <label htmlFor="search" className="block text-sm font-medium text-brand-primary-900 mb-2">
            بحث
          </label>
          <div className="relative">
            <input
              id="search"
              type="text"
              value={searchInput}
              onChange={handleSearchInputChange}
              placeholder="ابحث باسم العميل أو المنتج..."
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
            الحالة
          </label>
          <select
            id="status"
            value={selectedStatus}
            onChange={handleStatusChange}
            className="w-full px-4 py-2 border border-brand-offwhite-400 rounded-lg focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900 text-brand-offwhite-900 bg-white"
          >
            <option value="">الكل</option>
            <option value="on-track">في الموعد</option>
            <option value="due-soon">مستحق قريباً</option>
            <option value="overdue">متأخر</option>
          </select>
        </div>

        {/* Branch Filter */}
        <div>
          <label htmlFor="branch" className="block text-sm font-medium text-brand-primary-900 mb-2">
            الفرع
          </label>
          <select
            id="branch"
            value={selectedBranch}
            onChange={handleBranchChange}
            className="w-full px-4 py-2 border border-brand-offwhite-400 rounded-lg focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900 text-brand-offwhite-900 bg-white"
          >
            <option value="">جميع الفروع</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id.toString()}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range Filter */}
        <div className="desktop:col-span-5 grid grid-cols-1 tablet:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="startDate"
              className="block text-sm font-medium text-brand-primary-900 mb-2"
            >
              من تاريخ
            </label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={handleStartDateChange}
              className="w-full px-4 py-2 border border-brand-offwhite-400 rounded-lg focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900 text-brand-offwhite-900 bg-white"
            />
          </div>
          <div>
            <label
              htmlFor="endDate"
              className="block text-sm font-medium text-brand-primary-900 mb-2"
            >
              إلى تاريخ
            </label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={handleEndDateChange}
              className="w-full px-4 py-2 border border-brand-offwhite-400 rounded-lg focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900 text-brand-offwhite-900 bg-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallmentsFilters;
