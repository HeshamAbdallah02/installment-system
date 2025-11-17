import React, { useMemo, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import { BranchData } from '../../store/dashboardSlice';
import { LoadingSpinner } from './SkeletonLoaders';
import { ErrorState } from './ErrorStates';
import { BranchDistributionEmptyState } from './EmptyStates';

interface BranchDistributionChartProps {
  data: BranchData[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  onBranchClick?: (branchId: number) => void;
}

// Custom tooltip component with Arabic formatting
const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: BranchData }> }) => {
  if (active && payload && payload.length && payload[0]) {
    const data = payload[0].payload as BranchData;
    return (
      <div className="bg-white border-2 border-brand-primary-900 rounded-lg shadow-lg p-3">
        <p className="text-brand-primary-900 font-bold text-right mb-1">{data.branchName}</p>
        <p className="text-brand-offwhite-900 text-right mb-1">
          {data.amount.toLocaleString('ar-EG')} ج.م
        </p>
        <p className="text-brand-offwhite-700 text-right text-sm">{data.installmentCount} قسط</p>
      </div>
    );
  }
  return null;
};

// Custom label to show percentage on bars
const renderCustomLabel = (props: { x?: number; y?: number; width?: number; value?: number }) => {
  const { x, y, width, value } = props;
  return (
    <text
      x={x + width / 2}
      y={y - 5}
      fill="#560001"
      textAnchor="middle"
      fontSize={14}
      fontWeight="bold"
    >
      {value}%
    </text>
  );
};

const BranchDistributionChart: React.FC<BranchDistributionChartProps> = ({
  data,
  loading = false,
  error,
  onRetry,
  onBranchClick,
}) => {
  // Memoize chart data transformation - Requirement 9.6
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return [...data].reverse();
  }, [data]);

  // Memoize color calculation - Requirement 9.6
  const getBarColor = useCallback((branchName: string): string => {
    if (branchName.includes('القاهرة') || branchName.includes('Cairo')) {
      return '#560001'; // Burgundy for Cairo
    }
    return '#eacb95'; // Gold for Alexandria
  }, []);

  const hasData = useMemo(() => data && data.length > 0 && data.some((b) => b.amount > 0), [data]);

  // Memoize click handler - Requirement 9.6
  const handleBarClick = useCallback(
    (data: BranchData) => {
      if (onBranchClick && data.amount > 0) {
        onBranchClick(data.branchId);
      }
    },
    [onBranchClick]
  );

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-brand-offwhite-300 h-[400px] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-brand-offwhite-300">
        <h3 className="text-lg font-bold text-brand-primary-900 mb-4 text-right">
          توزيع التحصيلات حسب الفرع
        </h3>
        <ErrorState message={error} onRetry={onRetry} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-brand-offwhite-300">
      <h3 className="text-lg font-bold text-brand-primary-900 mb-4 text-right">
        توزيع التحصيلات حسب الفرع
      </h3>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData} margin={{ top: 30, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#d6d3d1"
            className="stroke-brand-offwhite-400"
          />
          <XAxis
            dataKey="branchName"
            tick={{ fill: '#57534e', fontSize: 12 }}
            className="text-brand-offwhite-700"
          />
          <YAxis
            tick={{ fill: '#57534e', fontSize: 12 }}
            className="text-brand-offwhite-700"
            tickFormatter={(value) => value.toLocaleString('ar-EG')}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="amount"
            radius={[8, 8, 0, 0]}
            cursor={onBranchClick ? 'pointer' : 'default'}
            onClick={(data: unknown) => handleBarClick(data as BranchData)}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.branchName)} />
            ))}
            <LabelList dataKey="percentage" content={renderCustomLabel} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {!hasData && <BranchDistributionEmptyState />}
    </div>
  );
};

export default BranchDistributionChart;
