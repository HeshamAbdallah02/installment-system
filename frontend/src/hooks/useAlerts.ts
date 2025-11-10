import { useMemo, useState, useEffect } from 'react';
import type { DashboardMetrics, Activity } from '../store/dashboardSlice';
import {
  getAllActiveAlerts,
  loadAlertSettings,
  saveAlertSettings,
  type AlertSettings,
  DEFAULT_ALERT_SETTINGS,
} from '../utils/alertLogic';

/**
 * Custom hook for managing dashboard alerts
 * Handles alert detection, settings management, and alert state
 */
export function useAlerts(metrics: DashboardMetrics | null, activities: Activity[]) {
  const [settings, setSettings] = useState<AlertSettings>(() => loadAlertSettings());
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  // Load settings on mount
  useEffect(() => {
    const loadedSettings = loadAlertSettings();
    setSettings(loadedSettings);
  }, []);

  // Get all active alerts based on current metrics and activities
  const allAlerts = useMemo(() => {
    return getAllActiveAlerts(metrics, activities, settings);
  }, [metrics, activities, settings]);

  // Filter out dismissed alerts
  const activeAlerts = useMemo(() => {
    return allAlerts.filter((alert) => !dismissedAlerts.has(alert.id));
  }, [allAlerts, dismissedAlerts]);

  // Update alert settings
  const updateSettings = (newSettings: Partial<AlertSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    saveAlertSettings(updated);
  };

  // Reset settings to defaults
  const resetSettings = () => {
    setSettings(DEFAULT_ALERT_SETTINGS);
    saveAlertSettings(DEFAULT_ALERT_SETTINGS);
  };

  // Dismiss an alert
  const dismissAlert = (alertId: string) => {
    setDismissedAlerts((prev) => new Set([...prev, alertId]));
  };

  // Clear all dismissed alerts
  const clearDismissed = () => {
    setDismissedAlerts(new Set());
  };

  return {
    alerts: activeAlerts,
    allAlerts,
    settings,
    updateSettings,
    resetSettings,
    dismissAlert,
    clearDismissed,
    hasAlerts: activeAlerts.length > 0,
    criticalAlerts: activeAlerts.filter((a) => a.severity === 'critical'),
    warningAlerts: activeAlerts.filter((a) => a.severity === 'warning'),
  };
}
