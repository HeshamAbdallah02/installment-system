import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import UserDropdown from '../components/UserDropdown';
import PasswordInput from '../components/PasswordInput';
import ToastNotification from '../components/ToastNotification';
import LoadingOverlay from '../components/LoadingOverlay';
import authService from '../services/authService';
import type { User } from '../types/auth';

interface LoginFormData {
  userId: string;
  password: string;
  rememberMe: boolean;
}

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
}

const Login = () => {
  const navigate = useNavigate();
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Form state management with React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<LoginFormData>({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      userId: '',
      password: '',
      rememberMe: false,
    },
  });

  // Component state
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingUsers, setIsFetchingUsers] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'info',
    isVisible: false,
  });

  // Watch form values
  const selectedUserId = watch('userId');
  const password = watch('password');

  // Configure RTL direction on component mount
  useEffect(() => {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';

    return () => {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = 'en';
    };
  }, []);

  // Fetch users on component mount and check for remembered user
  useEffect(() => {
    const fetchUsersData = async () => {
      try {
        setIsFetchingUsers(true);
        setFetchError(null);
        const fetchedUsers = await authService.fetchUsers();
        setUsers(fetchedUsers);

        // Check for remembered user
        const rememberedUserId = authService.getRememberedUser();
        if (rememberedUserId) {
          const userExists = fetchedUsers.some((user) => user.id === rememberedUserId);
          if (userExists) {
            setValue('userId', rememberedUserId);
            setValue('rememberMe', true);
          } else {
            // Clear invalid remembered user
            authService.clearRememberedUser();
          }
        }

        // Check for session expired message
        const sessionExpiredMessage = sessionStorage.getItem('session_expired_message');
        if (sessionExpiredMessage) {
          sessionStorage.removeItem('session_expired_message');
          setToast({
            message: sessionExpiredMessage,
            type: 'info',
            isVisible: true,
          });
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'خطأ في تحميل قائمة المستخدمين';
        setFetchError(errorMessage);
      } finally {
        setIsFetchingUsers(false);
      }
    };

    fetchUsersData();
  }, [setValue]);

  // Handle user selection from dropdown
  const handleUserSelect = (userId: string | null) => {
    if (!userId) return;
    setValue('userId', userId, { shouldValidate: true, shouldDirty: true });

    // Auto-focus password field when user is selected
    setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 100);
  };

  // Handle form submission
  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);

      // Find the selected user to get their username
      const selectedUser = users.find((user) => user.id === data.userId);
      if (!selectedUser) {
        throw new Error('المستخدم المحدد غير موجود');
      }

      // Call login API with username
      const response = await authService.login(selectedUser.username, data.password);

      // Store token
      authService.storeToken(response.token);

      // Store current user information
      authService.storeCurrentUser({
        name: response.user.name,
        role: response.user.role,
        branch: (response.user as { branch?: string }).branch || 'الفرع الرئيسي',
      });

      // Handle Remember Me
      if (data.rememberMe) {
        authService.rememberUser(data.userId);
      } else {
        authService.clearRememberedUser();
      }

      // Show success toast
      setToast({
        message: 'تم تسجيل الدخول بنجاح',
        type: 'success',
        isVisible: true,
      });

      // Check if there's a redirect path stored
      const redirectPath = sessionStorage.getItem('redirect_after_login');
      if (redirectPath) {
        sessionStorage.removeItem('redirect_after_login');
      }

      // Redirect after 1 second
      setTimeout(() => {
        navigate(redirectPath || '/dashboard');
      }, 1000);
    } catch (error) {
      // Parse error message from Error object or use default
      const errorMessage = error instanceof Error ? error.message : 'خطأ في تسجيل الدخول';

      // Show error toast with appropriate message
      setToast({
        message: errorMessage,
        type: 'error',
        isVisible: true,
      });

      // Clear password field on authentication failure
      setValue('password', '', { shouldValidate: false });

      // Re-focus password field for retry
      setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 100);

      setIsLoading(false);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      e.preventDefault();
      handleSubmit(onSubmit)();
    }
  };

  // Close toast notification
  const closeToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  };

  return (
    <div className="min-h-screen bg-brand-secondary-400 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md space-y-8 relative border border-brand-offwhite-300">
        {/* Loading Overlay */}
        <LoadingOverlay isVisible={isLoading} />

        {/* Logo Section */}
        <div className="flex flex-col items-center space-y-4">
          <div className="bg-gradient-to-br from-brand-secondary-100 to-brand-secondary-200 p-4 rounded-2xl shadow-lg">
            <img
              src="/Sabaya Logo.jpg"
              alt="شعار الشركة"
              className="h-28 w-auto object-contain mx-auto min-h-[80px]"
            />
          </div>
          <h1 className="text-3xl font-bold text-center text-brand-primary-900 mt-2">
            نظام إدارة الأقساط
          </h1>
          <p className="text-brand-offwhite-700 text-center text-sm">
            مرحباً بك، يرجى تسجيل الدخول للمتابعة
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} onKeyDown={handleKeyDown} className="space-y-6">
          {/* User Dropdown */}
          {isFetchingUsers ? (
            <div className="text-center text-brand-offwhite-700 py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-brand-secondary-400 border-t-brand-primary-900 mb-2"></div>
              <p>جاري تحميل المستخدمين...</p>
            </div>
          ) : fetchError ? (
            <div className="text-center bg-brand-primary-50 border border-brand-primary-200 rounded-lg p-4">
              <p className="text-brand-primary-900 mb-3 text-right font-semibold">{fetchError}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="bg-brand-offwhite-100 hover:bg-white text-brand-primary-900 px-6 py-2 rounded-lg text-sm font-semibold transition-colors duration-300 border-2 border-brand-offwhite-300"
              >
                إعادة المحاولة
              </button>
            </div>
          ) : (
            <>
              <UserDropdown
                users={users}
                selectedUserId={selectedUserId}
                onSelect={handleUserSelect}
                error={errors.userId?.message}
                disabled={isLoading}
              />
              <input
                type="hidden"
                {...register('userId', {
                  required: 'يرجى اختيار المستخدم',
                })}
              />

              {/* Password Input */}
              <div>
                <PasswordInput
                  ref={passwordInputRef}
                  value={password}
                  onChange={(value) =>
                    setValue('password', value, { shouldValidate: true, shouldDirty: true })
                  }
                  error={errors.password?.message}
                  disabled={isLoading}
                  autoFocus={false}
                />
                <input
                  type="hidden"
                  {...register('password', {
                    required: 'يرجى إدخال كلمة المرور',
                  })}
                />
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-end">
                <label htmlFor="rememberMe" className="flex items-center cursor-pointer group">
                  <span className="text-sm text-brand-offwhite-800 ml-2 group-hover:text-brand-primary-900 transition-colors">
                    تذكرني
                  </span>
                  <input
                    id="rememberMe"
                    type="checkbox"
                    {...register('rememberMe')}
                    disabled={isLoading}
                    className="w-5 h-5 text-brand-primary-900 border-brand-offwhite-400 rounded focus:ring-brand-primary-900 focus:ring-2 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || isFetchingUsers}
                className="w-full bg-brand-primary-900 hover:bg-brand-primary-950 text-white font-bold py-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    جاري التحميل...
                  </span>
                ) : (
                  'دخول'
                )}
              </button>
            </>
          )}
        </form>
      </div>

      {/* Toast Notification */}
      <ToastNotification
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={closeToast}
      />
    </div>
  );
};

export default Login;
