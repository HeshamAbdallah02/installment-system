import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BanknotesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  WifiIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import QuickPaymentModal from '../components/payments/QuickPaymentModal';
import MultiplePaymentModal from '../components/payments/MultiplePaymentModal';
import KeyboardShortcutsLegend from '../components/payments/KeyboardShortcutsLegend';
import { getTodaysDues, getOverdueDues } from '../services/paymentService';
import { useRealtimePayments } from '../hooks/useRealtimePayments';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import type {
  TodaysDue,
  OverdueDue,
  TodaysDuesResponse,
  OverdueDuesResponse,
} from '../types/payment';

const PaymentCollection: React.FC = () => {
  const [selectedDues, setSelectedDues] = useState<Set<number>>(new Set());
  const [selectedPayment, setSelectedPayment] = useState<TodaysDue | OverdueDue | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isMultiplePaymentModalOpen, setIsMultiplePaymentModalOpen] = useState(false);
  const [showShortcutsLegend, setShowShortcutsLegend] = useState(false);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(0);

  // Enable real-time payment updates
  const { isConnected } = useRealtimePayments({
    enabled: true,
    onPaymentRecorded: () => {
      // Clear selections when payment is recorded by another user
      setSelectedDues(new Set());
    },
  });

  // Fetch today's dues with caching (Requirement 6.5: Cache today's dues for 5 minutes)
  const { data: todaysData, isLoading: todaysLoading } = useQuery<TodaysDuesResponse>({
    queryKey: ['todaysDues'],
    queryFn: getTodaysDues,
    staleTime: 1 * 60 * 1000, // Consider data fresh for 1 minute (reduced from 5)
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchInterval: 1 * 60 * 1000, // Refresh every 1 minute (reduced from 5)
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  // Fetch overdue payments with caching
  const { data: overdueData, isLoading: overdueLoading } = useQuery<OverdueDuesResponse>({
    queryKey: ['overdueDues'],
    queryFn: getOverdueDues,
    staleTime: 1 * 60 * 1000, // Consider data fresh for 1 minute (reduced from 5)
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchInterval: 1 * 60 * 1000, // Refresh every 1 minute (reduced from 5)
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  // Combined list of all dues for keyboard navigation
  const allDues = useMemo(() => {
    return [...(todaysData?.dues || []), ...(overdueData?.overdues || [])];
  }, [todaysData, overdueData]);

  // Handle checkbox selection
  const handleSelectDue = (scheduleId: number, customerId: number) => {
    const newSelected = new Set(selectedDues);

    if (newSelected.has(scheduleId)) {
      newSelected.delete(scheduleId);
    } else {
      // Check if all selected dues belong to same customer
      if (newSelected.size > 0) {
        const firstSelectedDue = [
          ...(todaysData?.dues || []),
          ...(overdueData?.overdues || []),
        ].find((due) => newSelected.has(due.scheduleId));

        if (firstSelectedDue && firstSelectedDue.customerId !== customerId) {
          alert('يجب اختيار أقساط لنفس العميل فقط');
          return;
        }
      }
      newSelected.add(scheduleId);
    }

    setSelectedDues(newSelected);
  };

  // Calculate total for selected dues
  const selectedTotal = useMemo(() => {
    const allDues = [...(todaysData?.dues || []), ...(overdueData?.overdues || [])];
    return allDues
      .filter((due) => selectedDues.has(due.scheduleId))
      .reduce((sum, due) => sum + due.amountDue, 0);
  }, [selectedDues, todaysData, overdueData]);

  // Get customer name for selected dues
  const selectedCustomerName = useMemo(() => {
    if (selectedDues.size === 0) return null;
    const allDues = [...(todaysData?.dues || []), ...(overdueData?.overdues || [])];
    const firstSelected = allDues.find((due) => selectedDues.has(due.scheduleId));
    return firstSelected?.customerName || null;
  }, [selectedDues, todaysData, overdueData]);

  // Get selected dues objects for multiple payment modal
  const selectedDuesObjects = useMemo(() => {
    const allDues = [...(todaysData?.dues || []), ...(overdueData?.overdues || [])];
    return allDues.filter((due) => selectedDues.has(due.scheduleId));
  }, [selectedDues, todaysData, overdueData]);

  // Keyboard shortcuts configuration (Requirements: 14.1-14.8)
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: '?',
        description: 'عرض الاختصارات',
        action: () => setShowShortcutsLegend(!showShortcutsLegend),
      },
      {
        key: ' ',
        description: 'فتح دفع سريع',
        action: () => {
          if (allDues.length > 0 && selectedRowIndex < allDues.length) {
            handleQuickPay(allDues[selectedRowIndex]);
          }
        },
      },
      {
        key: '1',
        description: 'اختيار العميل 1',
        action: () => {
          if (allDues.length >= 1) {
            setSelectedRowIndex(0);
            handleQuickPay(allDues[0]);
          }
        },
      },
      {
        key: '2',
        description: 'اختيار العميل 2',
        action: () => {
          if (allDues.length >= 2) {
            setSelectedRowIndex(1);
            handleQuickPay(allDues[1]);
          }
        },
      },
      {
        key: '3',
        description: 'اختيار العميل 3',
        action: () => {
          if (allDues.length >= 3) {
            setSelectedRowIndex(2);
            handleQuickPay(allDues[2]);
          }
        },
      },
      {
        key: '4',
        description: 'اختيار العميل 4',
        action: () => {
          if (allDues.length >= 4) {
            setSelectedRowIndex(3);
            handleQuickPay(allDues[3]);
          }
        },
      },
      {
        key: '5',
        description: 'اختيار العميل 5',
        action: () => {
          if (allDues.length >= 5) {
            setSelectedRowIndex(4);
            handleQuickPay(allDues[4]);
          }
        },
      },
      {
        key: '6',
        description: 'اختيار العميل 6',
        action: () => {
          if (allDues.length >= 6) {
            setSelectedRowIndex(5);
            handleQuickPay(allDues[5]);
          }
        },
      },
      {
        key: '7',
        description: 'اختيار العميل 7',
        action: () => {
          if (allDues.length >= 7) {
            setSelectedRowIndex(6);
            handleQuickPay(allDues[6]);
          }
        },
      },
      {
        key: '8',
        description: 'اختيار العميل 8',
        action: () => {
          if (allDues.length >= 8) {
            setSelectedRowIndex(7);
            handleQuickPay(allDues[7]);
          }
        },
      },
      {
        key: '9',
        description: 'اختيار العميل 9',
        action: () => {
          if (allDues.length >= 9) {
            setSelectedRowIndex(8);
            handleQuickPay(allDues[8]);
          }
        },
      },
    ],
    enabled: !isPaymentModalOpen && !isMultiplePaymentModalOpen && !showShortcutsLegend,
  });

  const handleQuickPay = (due: TodaysDue | OverdueDue) => {
    setSelectedPayment(due);
    setIsPaymentModalOpen(true);
  };

  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setSelectedPayment(null);
  };

  const handlePaymentSuccess = () => {
    // Modal will handle showing success state
    // Queries will be invalidated automatically
  };

  const handleMultiplePay = () => {
    if (selectedDues.size === 0) return;
    setIsMultiplePaymentModalOpen(true);
  };

  const handleCloseMultiplePaymentModal = () => {
    setIsMultiplePaymentModalOpen(false);
    setSelectedDues(new Set()); // Clear selections after closing
  };

  const handleMultiplePaymentSuccess = () => {
    // Modal will handle showing success state
    // Queries will be invalidated automatically
    setSelectedDues(new Set()); // Clear selections after success
  };

  const handleSendReminder = (due: OverdueDue) => {
    // TODO: Implement send reminder
    console.log('Send reminder to:', due);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = () => {
    return new Intl.DateTimeFormat('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date());
  };

  return (
    <DashboardLayout title="التحصيل اليومي">
      {/* Quick Payment Modal */}
      <QuickPaymentModal
        isOpen={isPaymentModalOpen}
        duePayment={selectedPayment}
        onClose={handleClosePaymentModal}
        onSuccess={handlePaymentSuccess}
      />

      {/* Multiple Payment Modal */}
      <MultiplePaymentModal
        isOpen={isMultiplePaymentModalOpen}
        selectedDues={selectedDuesObjects}
        onClose={handleCloseMultiplePaymentModal}
        onSuccess={handleMultiplePaymentSuccess}
      />

      {/* Keyboard Shortcuts Legend */}
      <KeyboardShortcutsLegend
        isOpen={showShortcutsLegend}
        onClose={() => setShowShortcutsLegend(false)}
      />

      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <p className="text-brand-offwhite-700 text-sm">{formatDate()}</p>

          {/* Keyboard Shortcuts Button */}
          <button
            type="button"
            onClick={() => setShowShortcutsLegend(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-brand-offwhite-100 hover:bg-brand-offwhite-200 text-brand-primary-900 text-xs font-medium rounded-lg transition-colors border border-brand-offwhite-300"
            title="اضغط ? لعرض الاختصارات"
          >
            <QuestionMarkCircleIcon className="w-4 h-4" />
            <span>اختصارات لوحة المفاتيح</span>
          </button>
        </div>

        {/* Real-time Connection Status */}
        <div className="flex items-center gap-2">
          <WifiIcon
            className={`w-5 h-5 ${isConnected ? 'text-green-600' : 'text-brand-offwhite-400'}`}
          />
          <span
            className={`text-xs font-medium ${
              isConnected ? 'text-green-600' : 'text-brand-offwhite-600'
            }`}
          >
            {isConnected ? 'متصل' : 'غير متصل'}
          </span>
        </div>
      </div>

      {/* This Month's Dues Section */}
      <section className="mb-8">
        <div className="bg-white rounded-xl shadow-lg border border-brand-offwhite-300 overflow-hidden">
          {/* Section Header */}
          <div className="bg-brand-primary-900 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BanknotesIcon className="w-6 h-6 text-white" />
                <h2 className="text-xl font-bold text-white">مستحقات الشهر الحالي</h2>
              </div>
            </div>
          </div>

          {/* Summary Card */}
          <div className="bg-brand-secondary-50 px-6 py-4 border-b border-brand-offwhite-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-brand-offwhite-700">عدد العملاء</p>
                <p className="text-2xl font-bold text-brand-primary-900">
                  {todaysData?.count || 0}
                </p>
              </div>
              <div className="text-left">
                <p className="text-sm text-brand-offwhite-700">الإجمالي</p>
                <p className="text-2xl font-bold text-brand-primary-900">
                  {formatCurrency(todaysData?.totalAmount || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Dues Table */}
          <div className="overflow-x-auto">
            {todaysLoading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary-900"></div>
                <p className="mt-2 text-brand-offwhite-700">جاري التحميل...</p>
              </div>
            ) : todaysData?.dues && todaysData.dues.length > 0 ? (
              <table className="w-full">
                <thead className="bg-brand-offwhite-100 border-b border-brand-offwhite-300">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-brand-primary-900">
                      <input
                        type="checkbox"
                        aria-label="تحديد جميع المستحقات اليوم"
                        className="rounded border-brand-offwhite-400 text-brand-primary-900 focus:ring-brand-primary-900"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDues(new Set(todaysData.dues.map((d) => d.scheduleId)));
                          } else {
                            setSelectedDues(new Set());
                          }
                        }}
                      />
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-brand-primary-900">
                      العميل
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-brand-primary-900">
                      تاريخ الاستحقاق
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-brand-primary-900">
                      المنتج
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-brand-primary-900">
                      القسط
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-brand-primary-900">
                      المبلغ
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-brand-primary-900">
                      الهاتف
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-brand-primary-900">
                      إجراء
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-offwhite-200">
                  {todaysData.dues.map((due) => (
                    <tr
                      key={due.scheduleId}
                      className="hover:bg-brand-offwhite-50 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          aria-label={`تحديد قسط ${due.customerName}`}
                          checked={selectedDues.has(due.scheduleId)}
                          onChange={() => handleSelectDue(due.scheduleId, due.customerId)}
                          className="rounded border-brand-offwhite-400 text-brand-primary-900 focus:ring-brand-primary-900"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-medium text-brand-primary-900">
                          {due.customerName}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-brand-offwhite-700">
                          {new Date(due.dueDate).toLocaleDateString('ar-EG', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-brand-offwhite-700">{due.productName}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-brand-offwhite-700">
                          {due.installmentNumber} من {due.totalInstallments}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-semibold text-brand-primary-900">
                          {formatCurrency(due.amountDue)}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-brand-offwhite-700 direction-ltr text-right">
                          {due.phone}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleQuickPay(due)}
                          className="px-4 py-2 min-h-[44px] bg-brand-primary-900 hover:bg-brand-primary-950 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          دفع سريع
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center">
                <CheckCircleIcon className="w-16 h-16 text-brand-secondary-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-brand-offwhite-700">
                  لا توجد مستحقات هذا الشهر
                </p>
                <p className="text-sm text-brand-offwhite-600 mt-2">
                  جميع المدفوعات المستحقة هذا الشهر تم تحصيلها
                </p>
              </div>
            )}
          </div>

          {/* Multiple Payment Button */}
          {selectedDues.size > 1 && (
            <div className="px-6 py-4 bg-brand-secondary-50 border-t border-brand-offwhite-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-brand-offwhite-700">
                    {selectedDues.size} أقساط محددة • {selectedCustomerName}
                  </p>
                  <p className="text-lg font-bold text-brand-primary-900">
                    الإجمالي: {formatCurrency(selectedTotal)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleMultiplePay}
                  className="px-6 py-3 min-h-[44px] bg-brand-primary-900 hover:bg-brand-primary-950 text-white font-bold rounded-lg transition-colors shadow-lg"
                >
                  دفع متعدد
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Overdue Section */}
      <section>
        <div className="bg-white rounded-xl shadow-lg border border-brand-offwhite-300 overflow-hidden">
          {/* Section Header */}
          <div className="bg-brand-primary-900 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ExclamationTriangleIcon className="w-6 h-6 text-white" />
                <h2 className="text-xl font-bold text-white">المتأخرات</h2>
              </div>
            </div>
          </div>

          {/* Summary Card */}
          <div className="bg-brand-primary-50 px-6 py-4 border-b border-brand-offwhite-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-brand-offwhite-700">عدد المتأخرات</p>
                <p className="text-2xl font-bold text-brand-primary-900">
                  {overdueData?.count || 0}
                </p>
              </div>
              <div className="text-left">
                <p className="text-sm text-brand-offwhite-700">الإجمالي</p>
                <p className="text-2xl font-bold text-brand-primary-900">
                  {formatCurrency(overdueData?.totalAmount || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Overdue Table */}
          <div className="overflow-x-auto">
            {overdueLoading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary-900"></div>
                <p className="mt-2 text-brand-offwhite-700">جاري التحميل...</p>
              </div>
            ) : overdueData?.overdues && overdueData.overdues.length > 0 ? (
              <table className="w-full">
                <thead className="bg-brand-offwhite-100 border-b border-brand-offwhite-300">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-brand-primary-900">
                      <input
                        type="checkbox"
                        aria-label="تحديد جميع المتأخرات"
                        className="rounded border-brand-offwhite-400 text-brand-primary-900 focus:ring-brand-primary-900"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDues(new Set(overdueData.overdues.map((d) => d.scheduleId)));
                          } else {
                            setSelectedDues(new Set());
                          }
                        }}
                      />
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-brand-primary-900">
                      العميل
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-brand-primary-900">
                      تاريخ الاستحقاق
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-brand-primary-900">
                      متأخر
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-brand-primary-900">
                      المنتج
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-brand-primary-900">
                      المبلغ
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-brand-primary-900">
                      الهاتف
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-brand-primary-900">
                      إجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-offwhite-200">
                  {overdueData.overdues.map((due) => (
                    <tr
                      key={due.scheduleId}
                      className="hover:bg-brand-primary-50 transition-colors bg-brand-primary-50/30"
                    >
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          aria-label={`تحديد قسط متأخر ${due.customerName}`}
                          checked={selectedDues.has(due.scheduleId)}
                          onChange={() => handleSelectDue(due.scheduleId, due.customerId)}
                          className="rounded border-brand-offwhite-400 text-brand-primary-900 focus:ring-brand-primary-900"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-medium text-brand-primary-900">
                          {due.customerName}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-brand-offwhite-700">
                          {new Date(due.dueDate).toLocaleDateString('ar-EG', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-brand-primary-900 text-white">
                          {due.daysOverdue} يوم
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-brand-offwhite-700">{due.productName}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-semibold text-brand-primary-900">
                          {formatCurrency(due.amountDue)}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-brand-offwhite-700 direction-ltr text-right">
                          {due.phone}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSendReminder(due)}
                            className="px-3 py-2 min-h-[44px] bg-brand-secondary-400 hover:bg-brand-secondary-500 text-brand-primary-900 text-sm font-medium rounded-lg transition-colors"
                          >
                            تذكير
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickPay(due)}
                            className="px-3 py-2 min-h-[44px] bg-brand-primary-900 hover:bg-brand-primary-950 text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            دفع
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center">
                <CheckCircleIcon className="w-16 h-16 text-brand-secondary-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-brand-offwhite-700">لا توجد متأخرات</p>
                <p className="text-sm text-brand-offwhite-600 mt-2">جميع المدفوعات محدثة</p>
              </div>
            )}
          </div>

          {/* Multiple Payment Button for Overdue */}
          {selectedDues.size > 1 &&
            overdueData?.overdues.some((d) => selectedDues.has(d.scheduleId)) && (
              <div className="px-6 py-4 bg-brand-primary-50 border-t border-brand-offwhite-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-brand-offwhite-700">
                      {selectedDues.size} أقساط محددة • {selectedCustomerName}
                    </p>
                    <p className="text-lg font-bold text-brand-primary-900">
                      الإجمالي: {formatCurrency(selectedTotal)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleMultiplePay}
                    className="px-6 py-3 min-h-[44px] bg-brand-primary-900 hover:bg-brand-primary-950 text-white font-bold rounded-lg transition-colors shadow-lg"
                  >
                    دفع متعدد
                  </button>
                </div>
              </div>
            )}
        </div>
      </section>
    </DashboardLayout>
  );
};

export default PaymentCollection;
