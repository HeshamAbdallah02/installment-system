/**
 * Alert Logic Utilities
 * Handles all alert detection and threshold checking for the dashboard
 */

import type { DashboardMetrics, Activity } from '../store/dashboardSlice';

export interface AlertSettings {
  overdueThreshold: number; // Percentage (default: 10%)
  collectionRateThreshold: number; // Percentage (default: 80%)
}

export interface DashboardAlert {
  id: string;
  type: 'overdue' | 'collection_rate' | 'no_payments_today' | 'consecutive_overdue';
  severity: 'warning' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  metadata?: {
    value?: number;
    threshold?: number;
    customerName?: string;
    customerId?: number;
  };
}

// Default alert thresholds
export const DEFAULT_ALERT_SETTINGS: AlertSettings = {
  overdueThreshold: 10, // 10% of total
  collectionRateThreshold: 80, // 80%
};

/**
 * Load alert settings from localStorage
 */
export function loadAlertSettings(): AlertSettings {
  try {
    const stored = localStorage.getItem('dashboard_alert_settings');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        overdueThreshold: parsed.overdueThreshold ?? DEFAULT_ALERT_SETTINGS.overdueThreshold,
        collectionRateThreshold:
          parsed.collectionRateThreshold ?? DEFAULT_ALERT_SETTINGS.collectionRateThreshold,
      };
    }
  } catch (error) {
    console.error('Error loading alert settings:', error);
  }
  return DEFAULT_ALERT_SETTINGS;
}

/**
 * Save alert settings to localStorage
 */
export function saveAlertSettings(settings: AlertSettings): void {
  try {
    localStorage.setItem('dashboard_alert_settings', JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving alert settings:', error);
  }
}

/**
 * Check if overdue amount exceeds threshold
 * Requirement 10.1: Check if overdue amount > 10% of total
 */
export function checkOverdueAlert(
  metrics: DashboardMetrics | null,
  settings: AlertSettings
): DashboardAlert | null {
  if (!metrics) return null;

  const { overdueAmounts, pendingPayments } = metrics;

  // Calculate total active value (overdue + pending)
  const totalActiveValue = overdueAmounts.amount + pendingPayments.amount;

  if (totalActiveValue === 0) return null;

  const overduePercentage = (overdueAmounts.amount / totalActiveValue) * 100;

  if (overduePercentage > settings.overdueThreshold) {
    return {
      id: `overdue-${Date.now()}`,
      type: 'overdue',
      severity: overduePercentage > settings.overdueThreshold * 1.5 ? 'critical' : 'warning',
      title: 'تحذير: مبالغ متأخرة مرتفعة',
      message: `المبالغ المتأخرة تمثل ${overduePercentage.toFixed(1)}% من إجمالي المستحقات (الحد: ${settings.overdueThreshold}%)`,
      timestamp: new Date(),
      metadata: {
        value: overduePercentage,
        threshold: settings.overdueThreshold,
      },
    };
  }

  return null;
}

/**
 * Check if collection rate is below threshold
 * Requirement 10.2: Check if collection rate < 80%
 */
export function checkCollectionRateAlert(
  metrics: DashboardMetrics | null,
  settings: AlertSettings
): DashboardAlert | null {
  if (!metrics) return null;

  const { collectionRate } = metrics;

  if (collectionRate.percentage < settings.collectionRateThreshold) {
    return {
      id: `collection-rate-${Date.now()}`,
      type: 'collection_rate',
      severity:
        collectionRate.percentage < settings.collectionRateThreshold * 0.8 ? 'critical' : 'warning',
      title: 'تحذير: معدل تحصيل منخفض',
      message: `معدل التحصيل الحالي ${collectionRate.percentage.toFixed(1)}% أقل من الحد المطلوب (${settings.collectionRateThreshold}%)`,
      timestamp: new Date(),
      metadata: {
        value: collectionRate.percentage,
        threshold: settings.collectionRateThreshold,
      },
    };
  }

  return null;
}

/**
 * Check if no payments were recorded today
 * Requirement 10.3: Check if no payments recorded today
 */
export function checkNoPaymentsTodayAlert(activities: Activity[]): DashboardAlert | null {
  if (!activities || activities.length === 0) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if there are any payment activities today
  const hasPaymentToday = activities.some((activity) => {
    if (activity.type !== 'payment') return false;

    const activityDate = new Date(activity.timestamp);
    activityDate.setHours(0, 0, 0, 0);

    return activityDate.getTime() === today.getTime();
  });

  if (!hasPaymentToday) {
    return {
      id: `no-payments-${Date.now()}`,
      type: 'no_payments_today',
      severity: 'warning',
      title: 'تذكير: لا توجد دفعات اليوم',
      message: 'لم يتم تسجيل أي دفعات حتى الآن اليوم. تحقق من المستحقات المطلوبة.',
      timestamp: new Date(),
    };
  }

  return null;
}

/**
 * Check for customers with 3+ consecutive overdue payments
 * Requirement 10.4: Check for customers with 3+ consecutive overdue payments
 *
 * Note: This requires customer payment history data from the backend.
 * For now, we'll check activities for overdue patterns.
 */
export function checkConsecutiveOverdueAlert(activities: Activity[]): DashboardAlert[] {
  if (!activities || activities.length === 0) return [];

  // Group overdue activities by customer
  const customerOverdueMap = new Map<number, Activity[]>();

  activities
    .filter((activity) => activity.type === 'overdue')
    .forEach((activity) => {
      const customerId = activity.metadata?.customerId;
      if (customerId) {
        const existing = customerOverdueMap.get(customerId) || [];
        customerOverdueMap.set(customerId, [...existing, activity]);
      }
    });

  // Find customers with 3+ overdue activities
  const alerts: DashboardAlert[] = [];

  customerOverdueMap.forEach((overdueActivities, customerId) => {
    if (overdueActivities.length >= 3) {
      const customerName = overdueActivities[0].metadata?.customerName || 'عميل غير معروف';

      alerts.push({
        id: `consecutive-overdue-${customerId}-${Date.now()}`,
        type: 'consecutive_overdue',
        severity: 'critical',
        title: 'تحذير: عميل متعثر',
        message: `العميل ${customerName} لديه ${overdueActivities.length} دفعات متأخرة متتالية`,
        timestamp: new Date(),
        metadata: {
          customerId,
          customerName,
          value: overdueActivities.length,
        },
      });
    }
  });

  return alerts;
}

/**
 * Get all active alerts for the dashboard
 * Combines all alert checks and returns a prioritized list
 */
export function getAllActiveAlerts(
  metrics: DashboardMetrics | null,
  activities: Activity[],
  settings: AlertSettings = DEFAULT_ALERT_SETTINGS
): DashboardAlert[] {
  const alerts: DashboardAlert[] = [];

  // Check overdue amount alert
  const overdueAlert = checkOverdueAlert(metrics, settings);
  if (overdueAlert) alerts.push(overdueAlert);

  // Check collection rate alert
  const collectionRateAlert = checkCollectionRateAlert(metrics, settings);
  if (collectionRateAlert) alerts.push(collectionRateAlert);

  // Check no payments today alert
  const noPaymentsAlert = checkNoPaymentsTodayAlert(activities);
  if (noPaymentsAlert) alerts.push(noPaymentsAlert);

  // Check consecutive overdue alerts
  const consecutiveAlerts = checkConsecutiveOverdueAlert(activities);
  alerts.push(...consecutiveAlerts);

  // Sort by severity (critical first) and timestamp (newest first)
  return alerts.sort((a, b) => {
    if (a.severity !== b.severity) {
      return a.severity === 'critical' ? -1 : 1;
    }
    return b.timestamp.getTime() - a.timestamp.getTime();
  });
}
