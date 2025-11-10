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
  TooltipProps,
  LabelList,
} from 'recharts';
import { ProductData } from '../../store/dashboardSlice';
import { LoadingSpinner } from './SkeletonLoaders';
import { ErrorState } from './ErrorStates';
import { TopProductsEmptyState } from './EmptyStates';

interface TopProductsChartProps {
  data: ProductData[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  onProductClick?: (productId: number) => void;
  onAddInstallment?: () => void;
}

// Custom tooltip component with Arabic formatting
const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as ProductData;
    return (
      <div className="bg-white border-2 border-brand-primary-900 rounded-lg shadow-lg p-3">
        <p className="text-brand-primary-900 font-bold text-right mb-1">{data.productName}</p>
        <p className="text-brand-offwhite-900 text-right mb-1">{data.installmentCount} قسط نشط</p>
        <p className="text-brand-offwhite-700 text-right text-sm">
          إجمالي القيمة: {data.totalValue.toLocaleString('ar-EG')} ج.م
        </p>
      </div>
    );
  }
  return null;
};

// Custom label to show count at bar end
const renderCustomLabel = (props: {
  x: number;
  y: number;
  width: number;
  height: number;
  value: number;
}) => {
  const { x, y, width, height, value } = props;
  return (
    <text
      x={x + width + 10}
      y={y + height / 2}
      fill="#560001"
      textAnchor="start"
      dominantBaseline="middle"
      fontSize={14}
      fontWeight="bold"
    >
      {value}
    </text>
  );
};

const TopProductsChart: React.FC<TopProductsChartProps> = ({
  data,
  loading = false,
  error,
  onRetry,
  onProductClick,
  onAddInstallment,
}) => {
  // Memoize filtered and sorted data - Requirement 9.6
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data
      .filter((product) => product.installmentCount > 0)
      .sort((a, b) => b.installmentCount - a.installmentCount)
      .slice(0, 5);
  }, [data]);

  const hasData = filteredData.length > 0;

  // Memoize click handler - Requirement 9.6
  const handleBarClick = useCallback(
    (data: ProductData) => {
      if (onProductClick) {
        onProductClick(data.productId);
      }
    },
    [onProductClick]
  );

  // Memoize gradient color calculation - Requirement 9.6
  const getBarColor = useCallback((index: number, total: number): string => {
    // Interpolate between gold (#eacb95) and burgundy (#560001)
    const ratio = index / Math.max(total - 1, 1);

    // Gold RGB: 234, 203, 149
    // Burgundy RGB: 86, 0, 1
    const r = Math.round(234 - (234 - 86) * ratio);
    const g = Math.round(203 - (203 - 0) * ratio);
    const b = Math.round(149 - (149 - 1) * ratio);

    return `rgb(${r}, ${g}, ${b})`;
  }, []);

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
        <h3 className="text-lg font-bold text-brand-primary-900 mb-4 text-right">أفضل المنتجات</h3>
        <ErrorState message={error} onRetry={onRetry} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-brand-offwhite-300">
      <h3 className="text-lg font-bold text-brand-primary-900 mb-4 text-right">أفضل المنتجات</h3>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={filteredData}
          layout="vertical"
          margin={{ top: 5, right: 60, left: 20, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#d6d3d1"
            className="stroke-brand-offwhite-400"
          />
          <XAxis
            type="number"
            tick={{ fill: '#57534e', fontSize: 12 }}
            className="text-brand-offwhite-700"
          />
          <YAxis
            type="category"
            dataKey="productName"
            tick={{ fill: '#57534e', fontSize: 12, textAnchor: 'end' }}
            className="text-brand-offwhite-700"
            width={150}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="installmentCount"
            radius={[0, 8, 8, 0]}
            cursor={onProductClick ? 'pointer' : 'default'}
            onClick={(data: unknown) => handleBarClick(data as ProductData)}
          >
            {filteredData.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(index, filteredData.length)} />
            ))}
            <LabelList dataKey="installmentCount" content={renderCustomLabel} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {!hasData && <TopProductsEmptyState onAddInstallment={onAddInstallment} />}
    </div>
  );
};

export default TopProductsChart;
