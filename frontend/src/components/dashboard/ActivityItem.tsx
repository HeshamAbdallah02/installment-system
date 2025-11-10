import React from 'react';
import {
  CheckCircleIcon,
  PlusCircleIcon,
  ExclamationTriangleIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/solid';
import { formatDistanceToNow } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Activity } from '../../store/dashboardSlice';

interface ActivityItemProps {
  activity: Activity;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity }) => {
  // Get icon based on activity type
  const getIcon = () => {
    switch (activity.type) {
      case 'payment':
        return <CheckCircleIcon className="w-6 h-6 text-brand-secondary-600" />;
      case 'installment':
        return <PlusCircleIcon className="w-6 h-6 text-brand-offwhite-700" />;
      case 'overdue':
        return <ExclamationTriangleIcon className="w-6 h-6 text-brand-primary-700" />;
      case 'completed':
        return <CheckBadgeIcon className="w-6 h-6 text-brand-secondary-600" />;
      default:
        return <CheckCircleIcon className="w-6 h-6 text-brand-offwhite-700" />;
    }
  };

  // Get border color based on activity type
  const getBorderColor = () => {
    switch (activity.type) {
      case 'payment':
        return 'border-brand-secondary-400';
      case 'overdue':
        return 'border-brand-primary-700';
      case 'completed':
        return 'border-brand-secondary-400';
      case 'installment':
      default:
        return 'border-brand-offwhite-400';
    }
  };

  // Format timestamp in relative Arabic
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return formatDistanceToNow(date, {
        addSuffix: true,
        locale: arSA,
      });
    } catch (error) {
      return timestamp;
    }
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg hover:bg-brand-offwhite-100 transition-colors duration-200 border-r-4 ${getBorderColor()}`}
    >
      <div className="flex-shrink-0 mt-1">{getIcon()}</div>

      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-brand-primary-900 text-right mb-1">
          {activity.title}
        </h4>
        <p className="text-sm text-brand-offwhite-700 text-right mb-2">{activity.description}</p>
        <p className="text-xs text-brand-offwhite-600 text-right">
          {formatTimestamp(activity.timestamp)}
        </p>
      </div>
    </div>
  );
};

export default ActivityItem;
