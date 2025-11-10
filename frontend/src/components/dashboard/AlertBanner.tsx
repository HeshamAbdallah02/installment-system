import React from 'react';
import {
  ExclamationTriangleIcon,
  XMarkIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import type { DashboardAlert } from '../../utils/alertLogic';

interface AlertBannerProps {
  alerts: DashboardAlert[];
  onDismiss: (alertId: string) => void;
}

/**
 * AlertBanner Component
 * Displays high-priority alerts at the top of the dashboard
 * Requirement 10.2: Display reminder notification at top of dashboard
 */
const AlertBanner: React.FC<AlertBannerProps> = ({ alerts, onDismiss }) => {
  if (alerts.length === 0) return null;

  return (
    <div className="mb-6 space-y-3">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`rounded-lg p-4 shadow-md border-r-4 ${
            alert.severity === 'critical'
              ? 'bg-brand-primary-50 border-brand-primary-900'
              : 'bg-brand-secondary-50 border-brand-secondary-600'
          }`}
          role="alert"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {alert.severity === 'critical' ? (
                  <ExclamationCircleIcon
                    className="w-6 h-6 text-brand-primary-900"
                    aria-hidden="true"
                  />
                ) : (
                  <ExclamationTriangleIcon
                    className="w-6 h-6 text-brand-secondary-700"
                    aria-hidden="true"
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 text-right">
                <h4
                  className={`text-sm font-bold mb-1 ${
                    alert.severity === 'critical'
                      ? 'text-brand-primary-900'
                      : 'text-brand-secondary-900'
                  }`}
                >
                  {alert.title}
                </h4>
                <p
                  className={`text-sm ${
                    alert.severity === 'critical'
                      ? 'text-brand-primary-800'
                      : 'text-brand-secondary-800'
                  }`}
                >
                  {alert.message}
                </p>
              </div>
            </div>

            {/* Dismiss Button */}
            <button
              onClick={() => onDismiss(alert.id)}
              className={`flex-shrink-0 p-1 rounded-lg transition-colors ${
                alert.severity === 'critical'
                  ? 'hover:bg-brand-primary-100 text-brand-primary-700'
                  : 'hover:bg-brand-secondary-100 text-brand-secondary-700'
              }`}
              aria-label="إغلاق التنبيه"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AlertBanner;
