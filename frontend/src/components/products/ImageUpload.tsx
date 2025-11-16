import React, { useState, useRef } from 'react';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ImageUploadProps {
  value?: File | string | null;
  onChange: (file: File | null) => void;
  error?: string;
  disabled?: boolean;
  currentImageUrl?: string;
}

/**
 * ImageUpload Component
 * Handles product image upload with validation and preview
 * Requirements: 6.7
 */
const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  error,
  disabled = false,
  currentImageUrl,
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set initial preview from currentImageUrl or value
  React.useEffect(() => {
    if (typeof value === 'string' && value) {
      setPreview(value);
    } else if (value instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(value);
    } else if (currentImageUrl && !value) {
      // Show current image if no new file is selected
      setPreview(currentImageUrl);
    }
  }, [value, currentImageUrl]);

  /**
   * Validate file type and size
   * Requirements: 6.7 - Validate file type (JPG, PNG) and size (max 5MB)
   */
  const validateFile = (file: File): string | null => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      return 'صيغة الصورة غير مدعومة. يرجى اختيار صورة JPG أو PNG';
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return 'حجم الصورة يجب أن يكون أقل من 5 ميجابايت';
    }

    return null;
  };

  /**
   * Handle file selection
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    // Validate file
    const error = validateFile(file);
    if (error) {
      setValidationError(error);
      setPreview(null);
      onChange(null);
      return;
    }

    // Clear validation error
    setValidationError(null);

    // Simulate upload progress
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 50);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
      onChange(file);
    };
    reader.readAsDataURL(file);
  };

  /**
   * Handle remove image
   */
  const handleRemove = () => {
    setPreview(null);
    setValidationError(null);
    setUploadProgress(0);
    onChange(null);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Handle click on upload area
   */
  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const displayError = error || validationError;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-brand-primary-900">
        صورة المنتج <span className="text-brand-primary-700">*</span>
      </label>

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg overflow-hidden transition-colors ${
          displayError
            ? 'border-brand-primary-700 bg-brand-primary-50'
            : preview
              ? 'border-brand-secondary-400 bg-white'
              : 'border-brand-offwhite-400 bg-brand-offwhite-50 hover:border-brand-secondary-400 hover:bg-brand-offwhite-100'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={handleClick}
      >
        {preview ? (
          // Image Preview
          <div className="relative aspect-[4/3] bg-brand-offwhite-200">
            <img src={preview} alt="معاينة المنتج" className="w-full h-full object-cover" />

            {/* Remove Button */}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className="absolute top-2 left-2 p-2 bg-brand-primary-900 hover:bg-brand-primary-950 text-white rounded-full shadow-lg transition-colors"
                aria-label="إزالة الصورة"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}

            {/* Upload Progress */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2">
                <div className="w-full bg-brand-offwhite-300 rounded-full h-2">
                  <div
                    className="bg-brand-secondary-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          // Upload Placeholder
          <div className="aspect-[4/3] flex flex-col items-center justify-center p-6 text-center">
            <PhotoIcon className="w-16 h-16 text-brand-offwhite-500 mb-3" />
            <p className="text-brand-primary-900 font-medium mb-1">اضغط لاختيار صورة</p>
            <p className="text-sm text-brand-offwhite-700">JPG أو PNG (حد أقصى 5 ميجابايت)</p>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
          aria-label="اختر صورة المنتج"
        />
      </div>

      {/* Error Message */}
      {displayError && (
        <p className="text-sm text-brand-primary-700 flex items-start gap-1">
          <span>⚠</span>
          <span>{displayError}</span>
        </p>
      )}

      {/* Requirements Info */}
      {!preview && !displayError && (
        <p className="text-xs text-brand-offwhite-700">
          الصيغ المدعومة: JPG, PNG • الحد الأقصى للحجم: 5 ميجابايت
        </p>
      )}
    </div>
  );
};

export default ImageUpload;
