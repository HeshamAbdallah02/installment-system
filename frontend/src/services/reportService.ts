import apiClient from './api';
import type { DailyReportData, WeeklyReportData, MonthlyReportData } from '../types/report';

/**
 * Get daily collection report
 */
export const getDailyReport = async (date: Date, branchId?: number): Promise<DailyReportData> => {
  const params = new URLSearchParams();
  params.append('date', date.toISOString().split('T')[0]);
  if (branchId) params.append('branchId', branchId.toString());

  const response = await apiClient.get<DailyReportData>(`/api/reports/daily?${params.toString()}`);
  return response.data;
};

/**
 * Get weekly collection report
 */
export const getWeeklyReport = async (
  startDate: Date,
  endDate: Date,
  branchId?: number
): Promise<WeeklyReportData> => {
  const params = new URLSearchParams();
  params.append('startDate', startDate.toISOString().split('T')[0]);
  params.append('endDate', endDate.toISOString().split('T')[0]);
  if (branchId) params.append('branchId', branchId.toString());

  const response = await apiClient.get<WeeklyReportData>(
    `/api/reports/weekly?${params.toString()}`
  );
  return response.data;
};

/**
 * Get monthly collection report
 */
export const getMonthlyReport = async (
  month: number,
  year: number,
  branchId?: number
): Promise<MonthlyReportData> => {
  const params = new URLSearchParams();
  params.append('month', month.toString());
  params.append('year', year.toString());
  if (branchId) params.append('branchId', branchId.toString());

  const response = await apiClient.get<MonthlyReportData>(
    `/api/reports/monthly?${params.toString()}`
  );
  return response.data;
};

/**
 * Export report to Excel or PDF
 */
export const exportReport = async (
  reportType: 'daily' | 'weekly' | 'monthly',
  startDate: Date,
  endDate: Date,
  format: 'excel' | 'pdf',
  branchId?: number
): Promise<Blob> => {
  const payload: any = {
    reportType,
    format,
    branchId,
  };

  // Add appropriate date parameters based on report type
  if (reportType === 'daily') {
    payload.date = startDate.toISOString().split('T')[0];
  } else if (reportType === 'weekly') {
    payload.startDate = startDate.toISOString().split('T')[0];
    payload.endDate = endDate.toISOString().split('T')[0];
  } else if (reportType === 'monthly') {
    payload.month = startDate.getMonth() + 1;
    payload.year = startDate.getFullYear();
  }

  const response = await apiClient.post('/api/reports/export', payload, {
    responseType: 'blob',
  });
  return response.data;
};
