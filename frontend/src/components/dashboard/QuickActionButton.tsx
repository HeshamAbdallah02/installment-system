import React from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface QuickActionButtonProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  label,
  icon,
  onClick,
  loading = false,
  disabled = false,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        relative flex flex-col items-center justify-center gap-3 
        px-6 py-6 tablet:py-8 
        bg-brand-primary-900 hover:bg-brand-primary-950 
        text-white font-bold rounded-lg 
        shadow-lg hover:shadow-xl 
        transition-all duration-300 
        transform hover:-translate-y-1
        disabled:opacity-50 disabled:cursor-not-allowed 
        disabled:transform-none disabled:shadow-lg
        min-h-[120px] tablet:min-h-[140px]
        w-full
      `}
      style={{ minHeight: '120px' }} // Requirement 8.6: Ensure 44px+ touch target (120px total)
    >
      {loading ? (
        <>
          <ArrowPathIcon className="w-8 h-8 tablet:w-10 tablet:h-10 animate-spin" />
          <span className="text-sm tablet:text-base">جاري التحميل...</span>
        </>
      ) : (
        <>
          <div className="w-10 h-10 tablet:w-12 tablet:h-12 flex items-center justify-center">
            {icon}
          </div>
          <span className="text-sm tablet:text-base text-center leading-tight">{label}</span>
        </>
      )}
    </button>
  );
};

export default QuickActionButton;
