import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface PaymentDistributionPieChartProps {
  startDate: string;
  endDate: string;
}

interface DistributionData {
  category: string;
  amount: number;
  percentage: number;
  [key: string]: string | number;
}

const PaymentDistributionPieChart: React.FC<PaymentDistributionPieChartProps> = () => {
  // TODO: Use startDate and endDate props when API is implemented
  // const { startDate, endDate } = props;
  // Mock data - TODO: Replace with actual API call
  const data: DistributionData[] = [
    { category: 'أجهزة إلكترونية', amount: 450000, percentage: 45 },
    { category: 'أثاث منزلي', amount: 300000, percentage: 30 },
    { category: 'أجهزة كهربائية', amount: 150000, percentage: 15 },
    { category: 'أخرى', amount: 100000, percentage: 10 },
  ];

  // Brand color palette for pie chart
  const COLORS = [
    '#560001', // brand-primary-900 (burgundy)
    '#eacb95', // brand-secondary-400 (gold)
    '#7f0002', // brand-primary-800 (lighter burgundy)
    '#d4b57f', // brand-secondary-500 (darker gold)
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ payload: DistributionData }>;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          className="bg-white p-4 rounded-lg shadow-lg border border-brand-offwhite-300"
          dir="rtl"
        >
          <p className="text-sm font-semibold text-brand-primary-900 mb-2">{data.category}</p>
          <p className="text-sm text-brand-offwhite-900">المبلغ: {formatCurrency(data.amount)}</p>
          <p className="text-sm text-brand-offwhite-900">النسبة: {data.percentage}%</p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percentage } = props;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-sm font-bold"
      >
        {`${percentage}%`}
      </text>
    );
  };

  const CustomLegend = ({ payload }: { payload?: Array<{ value: string; color: string }> }) => {
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4" dir="rtl">
        {payload?.map((entry, index: number) => (
          <div key={`legend-${index}`} className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: entry.color }} />
            <span className="text-sm text-brand-offwhite-900">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-brand-offwhite-300">
      <h2 className="text-xl font-bold text-brand-primary-900 text-right mb-6">
        توزيع المدفوعات حسب الفئة
      </h2>

      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={120}
            fill="#8884d8"
            dataKey="amount"
            nameKey="category"
          >
            {data.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Summary Statistics */}
      <div className="mt-6 pt-6 border-t border-brand-offwhite-300">
        <div className="grid grid-cols-2 gap-4" dir="rtl">
          <div className="text-center">
            <p className="text-sm text-brand-offwhite-700 mb-1">إجمالي المدفوعات</p>
            <p className="text-lg font-bold text-brand-primary-900">
              {formatCurrency(data.reduce((sum, item) => sum + item.amount, 0))}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-brand-offwhite-700 mb-1">عدد الفئات</p>
            <p className="text-lg font-bold text-brand-primary-900">{data.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDistributionPieChart;
