import React, { useState } from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

interface BranchPerformanceComparisonProps {
  startDate: string;
  endDate: string;
}

interface BranchMetrics {
  branchId: number;
  branchName: string;
  totalCollections: number;
  installmentCount: number;
  averageValue: number;
  collectionRate: number;
}

type SortField =
  | 'branchName'
  | 'totalCollections'
  | 'installmentCount'
  | 'averageValue'
  | 'collectionRate';
type SortDirection = 'asc' | 'desc';

const BranchPerformanceComparison: React.FC<BranchPerformanceComparisonProps> = () => {
  // TODO: Use startDate and endDate props when API is implemented
  // const { startDate, endDate } = props;
  const [sortField, setSortField] = useState<SortField>('totalCollections');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Mock data - TODO: Replace with actual API call
  const branchData: BranchMetrics[] = [
    {
      branchId: 1,
      branchName: 'فرع القاهرة الرئيسي',
      totalCollections: 500000,
      installmentCount: 50,
      averageValue: 10000,
      collectionRate: 92.5,
    },
    {
      branchId: 2,
      branchName: 'فرع الإسكندرية',
      totalCollections: 350000,
      installmentCount: 35,
      averageValue: 10000,
      collectionRate: 88.0,
    },
  ];

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedData = [...branchData].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue, 'ar')
        : bValue.localeCompare(aValue, 'ar');
    }

    return sortDirection === 'asc'
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('ar-EG').format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const SortIcon: React.FC<{ field: SortField }> = ({ field }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ArrowUpIcon className="w-4 h-4" />
    ) : (
      <ArrowDownIcon className="w-4 h-4" />
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-brand-offwhite-300 overflow-hidden">
      <div className="p-6 border-b border-brand-offwhite-300">
        <h2 className="text-xl font-bold text-brand-primary-900 text-right">مقارنة أداء الفروع</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full" dir="rtl">
          <thead className="bg-brand-primary-900 text-white">
            <tr>
              <th
                className="px-6 py-4 text-right text-sm font-semibold cursor-pointer hover:bg-brand-primary-950 transition-colors"
                onClick={() => handleSort('branchName')}
              >
                <div className="flex items-center justify-start gap-2">
                  <span>اسم الفرع</span>
                  <SortIcon field="branchName" />
                </div>
              </th>
              <th
                className="px-6 py-4 text-right text-sm font-semibold cursor-pointer hover:bg-brand-primary-950 transition-colors"
                onClick={() => handleSort('totalCollections')}
              >
                <div className="flex items-center justify-start gap-2">
                  <span>إجمالي التحصيلات</span>
                  <SortIcon field="totalCollections" />
                </div>
              </th>
              <th
                className="px-6 py-4 text-right text-sm font-semibold cursor-pointer hover:bg-brand-primary-950 transition-colors"
                onClick={() => handleSort('installmentCount')}
              >
                <div className="flex items-center justify-start gap-2">
                  <span>عدد الأقساط</span>
                  <SortIcon field="installmentCount" />
                </div>
              </th>
              <th
                className="px-6 py-4 text-right text-sm font-semibold cursor-pointer hover:bg-brand-primary-950 transition-colors"
                onClick={() => handleSort('averageValue')}
              >
                <div className="flex items-center justify-start gap-2">
                  <span>متوسط القيمة</span>
                  <SortIcon field="averageValue" />
                </div>
              </th>
              <th
                className="px-6 py-4 text-right text-sm font-semibold cursor-pointer hover:bg-brand-primary-950 transition-colors"
                onClick={() => handleSort('collectionRate')}
              >
                <div className="flex items-center justify-start gap-2">
                  <span>معدل التحصيل</span>
                  <SortIcon field="collectionRate" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((branch, index) => (
              <tr
                key={branch.branchId}
                className={`border-b border-brand-offwhite-200 hover:bg-brand-offwhite-50 transition-colors ${
                  index % 2 === 0 ? 'bg-white' : 'bg-brand-offwhite-50'
                }`}
              >
                <td className="px-6 py-4 text-sm font-medium text-brand-primary-900">
                  {branch.branchName}
                </td>
                <td className="px-6 py-4 text-sm text-brand-offwhite-900">
                  {formatCurrency(branch.totalCollections)}
                </td>
                <td className="px-6 py-4 text-sm text-brand-offwhite-900">
                  {formatNumber(branch.installmentCount)}
                </td>
                <td className="px-6 py-4 text-sm text-brand-offwhite-900">
                  {formatCurrency(branch.averageValue)}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full font-semibold ${
                      branch.collectionRate >= 90
                        ? 'bg-brand-secondary-100 text-brand-secondary-700'
                        : branch.collectionRate >= 80
                          ? 'bg-brand-offwhite-200 text-brand-offwhite-800'
                          : 'bg-brand-primary-100 text-brand-primary-700'
                    }`}
                  >
                    {formatPercentage(branch.collectionRate)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BranchPerformanceComparison;
