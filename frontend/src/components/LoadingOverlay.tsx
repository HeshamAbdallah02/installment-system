interface LoadingOverlayProps {
  isVisible: boolean;
}

export default function LoadingOverlay({ isVisible }: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-lg z-10 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-secondary-300 border-t-brand-primary-900"></div>
        <p className="text-brand-primary-900 font-semibold">جاري التحميل...</p>
      </div>
    </div>
  );
}
