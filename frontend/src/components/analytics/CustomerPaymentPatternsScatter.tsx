import React from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ZAxis,
} from 'recharts';

interface CustomerPaymentPatternsScatterProps {
  startDate: string;
  endDate: string;
}

interface CustomerPattern {
  customerId: number;
  customerName: string;
  earlyPayments: number;
  latePayments: number;
  type: 'early' | 'late' | 'mixed';
}

const CustomerPaymentPatternsScatter: React.FC<CustomerPaymentPatternsScatterProps> = () => {
  // TODO: Use startDate and endDate props when API is implemented
  // const { startDate, endDate } = props;
  // Mock data - TODO: Replace with actual API call
  const earlyPayers: CustomerPattern[] = [
    { customerId: 1, customerName: 'أحمد محمد', earlyPayments: 12, latePayments: 1, type: 'early' },
    { customerId: 2, customerName: 'فاطمة علي', earlyPayments: 10, latePayments: 0, type: 'early' },
    { customerId: 3, customerName: 'محمود حسن', earlyPayments: 8, latePayments: 2, type: 'early' },
    { customerId: 4, customerName: 'سارة أحمد', earlyPayments: 15, latePayments: 1, type: 'early' },
  ];

  const latePayers: CustomerPattern[] = [
    {
      customerId: 5,
      customerName: 'خالد عبدالله',
      earlyPayments: 2,
      latePayments: 8,
      type: 'late',
    },
    { customerId: 6, customerName: 'نور محمد', earlyPayments: 1, latePayments: 10, type: 'late' },
    { customerId: 7, customerName: 'عمر حسين', earlyPayments: 3, latePayments: 7, type: 'late' },
  ];

  const mixedPayers: CustomerPattern[] = [
    { customerId: 8, customerName: 'ليلى سعيد', earlyPayments: 5, latePayments: 5, type: 'mixed' },
    {
      customerId: 9,
      customerName: 'يوسف إبراهيم',
      earlyPayments: 6,
      latePayments: 4,
      type: 'mixed',
    },
  ];

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ payload: CustomerPattern }>;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          className="bg-white p-4 rounded-lg shadow-lg border border-brand-offwhite-300"
          dir="rtl"
        >
          <p className="text-sm font-semibold text-brand-primary-900 mb-2">{data.customerName}</p>
          <p className="text-sm text-brand-offwhite-900">دفعات مبكرة: {data.earlyPayments}</p>
          <p className="text-sm text-brand-offwhite-900">دفعات متأخرة: {data.latePayments}</p>
          <p className="text-sm text-brand-offwhite-700 mt-2">
            النوع:{' '}
            {data.type === 'early' ? 'دافع مبكر' : data.type === 'late' ? 'دافع متأخر' : 'مختلط'}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = () => {
    return (
      <div className="flex flex-wrap justify-center gap-6 mt-4" dir="rtl">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-brand-secondary-400" />
          <span className="text-sm text-brand-offwhite-900">دافعون مبكرون</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-brand-primary-900" />
          <span className="text-sm text-brand-offwhite-900">دافعون متأخرون</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-brand-offwhite-500" />
          <span className="text-sm text-brand-offwhite-900">مختلط</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-brand-offwhite-300">
      <h2 className="text-xl font-bold text-brand-primary-900 text-right mb-6">
        أنماط دفع العملاء
      </h2>

      <ResponsiveContainer width="100%" height={350}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e4" />
          <XAxis
            type="number"
            dataKey="earlyPayments"
            name="دفعات مبكرة"
            label={{
              value: 'عدد الدفعات المبكرة',
              position: 'insideBottom',
              offset: -10,
              style: { fill: '#560001', fontWeight: 'bold', fontSize: 12 },
            }}
            stroke="#78716c"
          />
          <YAxis
            type="number"
            dataKey="latePayments"
            name="دفعات متأخرة"
            label={{
              value: 'عدد الدفعات المتأخرة',
              angle: -90,
              position: 'insideLeft',
              style: { fill: '#560001', fontWeight: 'bold', fontSize: 12 },
            }}
            stroke="#78716c"
          />
          <ZAxis range={[100, 400]} />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <Legend content={<CustomLegend />} />

          {/* Early Payers - Gold */}
          <Scatter name="دافعون مبكرون" data={earlyPayers} fill="#eacb95" shape="circle" />

          {/* Late Payers - Burgundy */}
          <Scatter name="دافعون متأخرون" data={latePayers} fill="#560001" shape="circle" />

          {/* Mixed Payers - Gray */}
          <Scatter name="مختلط" data={mixedPayers} fill="#78716c" shape="circle" />
        </ScatterChart>
      </ResponsiveContainer>

      {/* Summary Statistics */}
      <div className="mt-6 pt-6 border-t border-brand-offwhite-300">
        <div className="grid grid-cols-3 gap-4" dir="rtl">
          <div className="text-center">
            <p className="text-sm text-brand-offwhite-700 mb-1">دافعون مبكرون</p>
            <p className="text-lg font-bold text-brand-secondary-600">{earlyPayers.length}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-brand-offwhite-700 mb-1">دافعون متأخرون</p>
            <p className="text-lg font-bold text-brand-primary-700">{latePayers.length}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-brand-offwhite-700 mb-1">مختلط</p>
            <p className="text-lg font-bold text-brand-offwhite-700">{mixedPayers.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerPaymentPatternsScatter;
