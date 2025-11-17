import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { MonthlyCollection } from '../../store/dashboardSlice';
import { LoadingSpinner } from './SkeletonLoaders';
import { ErrorState } from './ErrorStates';
import { CollectionTrendsEmptyState } from './EmptyStates';

interface CollectionTrendsChartProps {
  data: MonthlyCollection[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  onAddPayment?: () => void;
}

// Custom tooltip component with Arabic formatting
const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: MonthlyCollection }> }) => {
  if (active && payload && payload.length && payload[0]) {
    const data = payload[0].payload as MonthlyCollection;
    return (
      <div className="bg-white border-2 border-brand-primary-900 rounded-lg shadow-lg p-3">
        <p className="text-brand-primary-900 font-bold text-right mb-1">
          {data.month} {data.year}
        </p>
        <p className="text-brand-offwhite-900 text-right">
          {data.amount.toLocaleString('ar-EG')} ج.م
        </p>
      </div>
    );
  }
  return null;
};

// Format Y-axis values with abbreviated currency
const formatYAxis = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)} مليون`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)} ألف`;
  }
  return value.toString();
};

const CollectionTrendsChart: React.FC<CollectionTrendsChartProps> = ({
  data,
  loading = false,
  error,
  onRetry,
  onAddPayment,
}) => {
  // Memoize chart data transformation to avoid recalculation - Requirement 9.6
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return [...data].reverse();
  }, [data]);

  const hasData = chartData.length > 0;

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
          اتجاه التحصيل الشهري
        </h3>
        <ErrorState message={error} onRetry={onRetry} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-brand-offwhite-300">
      <h3 className="text-lg font-bold text-brand-primary-900 mb-4 text-right">
        اتجاه التحصيل الشهري
      </h3>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#d6d3d1"
            className="stroke-brand-offwhite-400"
          />
          <XAxis
            dataKey="month"
            reversed={true}
            tick={{ fill: '#57534e', fontSize: 12 }}
            className="text-brand-offwhite-700"
          />
          <YAxis
            tickFormatter={formatYAxis}
            tick={{ fill: '#57534e', fontSize: 12 }}
            className="text-brand-offwhite-700"
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="#560001"
            strokeWidth={3}
            dot={{
              fill: '#eacb95',
              stroke: '#560001',
              strokeWidth: 2,
              r: 5,
            }}
            activeDot={{
              fill: '#eacb95',
              stroke: '#560001',
              strokeWidth: 2,
              r: 7,
            }}
            strokeDasharray={hasData ? '0' : '5 5'}
            animationDuration={1000}
            animationEasing="ease-in-out"
          />
        </LineChart>
      </ResponsiveContainer>
      {!hasData && <CollectionTrendsEmptyState onAddPayment={onAddPayment} />}
    </div>
  );
};

export default CollectionTrendsChart;
