# Design Document

## Overview

The Arabic Login Page is a React TypeScript component that provides authentication for the Egyptian Retail Installments Management System. The design emphasizes Arabic language support with full RTL layout, a user-friendly dropdown selection mechanism instead of traditional username input, and modern UI patterns using Tailwind CSS. The component integrates with a backend REST API for user list retrieval and authentication, implements comprehensive form validation, and provides clear user feedback through toast notifications.

## Architecture

### Component Hierarchy

```
LoginPage (Container Component)
├── LoginCard (Presentational)
│   ├── LogoSection
│   │   └── SystemTitle
│   ├── LoginForm
│   │   ├── UserDropdown (with search)
│   │   ├── PasswordInput (with toggle)
│   │   ├── RememberMeCheckbox
│   │   └── SubmitButton
│   └── LoadingOverlay
└── ToastNotification (Portal)
```

### State Management

**Local Component State (React useState):**

- `selectedUserId: string | null` - Currently selected user ID
- `password: string` - Password input value
- `rememberMe: boolean` - Remember me checkbox state
- `isLoading: boolean` - Loading state during API calls
- `users: User[]` - List of users fetched from API
- `error: string | null` - Current error message
- `showPassword: boolean` - Password visibility toggle state

**Form State (React Hook Form):**

- Manages form validation and submission
- Tracks field-level errors
- Handles form reset on error

**Persistent State (localStorage):**

- `auth_token` - JWT token for authenticated sessions
- `remembered_user_id` - User ID when "Remember Me" is checked

### Data Flow

1. **Initial Load:**
   - Component mounts → Fetch users from GET /api/users/list
   - Check localStorage for remembered_user_id → Pre-select if exists
   - Set RTL direction on document root

2. **User Interaction:**
   - User selects from dropdown → Update selectedUserId → Auto-focus password
   - User types password → Update password state
   - User toggles Remember Me → Update rememberMe state

3. **Form Submission:**
   - Validate form → If invalid, show errors and stop
   - Set isLoading to true → Disable form
   - POST to /api/auth/login with {userId, password}
   - On success: Store token → Show success toast → Redirect to /dashboard
   - On error: Show error toast → Clear password → Re-enable form

## Components and Interfaces

### 1. LoginPage Component

**File:** `frontend/src/pages/LoginPage.tsx`

**Props:** None (root page component)

**State Interface:**

```typescript
interface LoginFormData {
  userId: string;
  password: string;
  rememberMe: boolean;
}

interface User {
  id: string;
  fullName: string;
  branchName: string;
  isActive: boolean;
}

interface AuthResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    name: string;
    role: 'SELLER' | 'MANAGER' | 'ADMIN';
    branch: string;
  };
}
```

**Key Methods:**

- `fetchUsers()` - Fetches user list from API
- `handleLogin(data: LoginFormData)` - Processes login submission
- `handleUserSelect(userId: string)` - Handles dropdown selection
- `togglePasswordVisibility()` - Shows/hides password

### 2. UserDropdown Component

**File:** `frontend/src/components/UserDropdown.tsx`

**Props:**

```typescript
interface UserDropdownProps {
  users: User[];
  selectedUserId: string | null;
  onSelect: (userId: string) => void;
  error?: string;
  disabled?: boolean;
}
```

**Features:**

- Searchable dropdown using Headless UI Combobox
- Filters users by Arabic name as user types
- Displays format: "أحمد محمد (فرع القاهرة)"
- RTL-aware positioning
- Keyboard navigation support

### 3. PasswordInput Component

**File:** `frontend/src/components/PasswordInput.tsx`

**Props:**

```typescript
interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}
```

**Features:**

- Toggle visibility with eye icon (Heroicons)
- RTL-aware icon positioning (left side)
- Focus ring with teal color
- Error state styling

### 4. ToastNotification Component

**File:** `frontend/src/components/ToastNotification.tsx`

**Props:**

```typescript
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
  onClose: () => void;
  duration?: number; // Auto-close after ms
}
```

**Implementation:**

- Uses React Portal for overlay rendering
- Auto-dismisses after 3 seconds
- Slide-in animation from top
- RTL-aware positioning (top-left for RTL)

## Data Models

### User Model (Frontend)

```typescript
interface User {
  id: string; // User ID from database
  fullName: string; // Arabic full name
  branchName: string; // Branch name in Arabic
  isActive: boolean; // Account status
}
```

### Login Request Payload

```typescript
interface LoginRequest {
  userId: string; // Selected user ID
  password: string; // Plain text password (HTTPS required)
}
```

### Login Response

```typescript
interface LoginResponse {
  success: boolean;
  token: string; // JWT token
  user: {
    id: string;
    name: string;
    role: 'SELLER' | 'MANAGER' | 'ADMIN';
    branch: string;
  };
}
```

### Error Response

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string; // 'INVALID_CREDENTIALS' | 'ACCOUNT_DISABLED' | 'NETWORK_ERROR'
    message: string; // Arabic error message
  };
}
```

## API Integration

### Endpoints

**1. GET /api/users/list**

- **Purpose:** Fetch all active users for dropdown
- **Authentication:** None (public endpoint)
- **Response:**

```json
{
  "success": true,
  "users": [
    {
      "id": "1",
      "fullName": "أحمد محمد حسن",
      "branchName": "فرع القاهرة الرئيسي",
      "isActive": true
    }
  ]
}
```

**2. POST /api/auth/login**

- **Purpose:** Authenticate user credentials
- **Request Body:**

```json
{
  "userId": "1",
  "password": "userPassword123"
}
```

- **Success Response (200):**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1",
    "name": "أحمد محمد حسن",
    "role": "SELLER",
    "branch": "فرع القاهرة الرئيسي"
  }
}
```

- **Error Response (401):**

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "اسم المستخدم أو كلمة المرور غير صحيحة"
  }
}
```

### API Service Layer

**File:** `frontend/src/services/authService.ts`

```typescript
class AuthService {
  private baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  async fetchUsers(): Promise<User[]>;
  async login(userId: string, password: string): Promise<AuthResponse>;
  storeToken(token: string): void;
  getToken(): string | null;
  clearToken(): void;
  rememberUser(userId: string): void;
  getRememberedUser(): string | null;
  clearRememberedUser(): void;
}
```

## Error Handling

### Error Categories

1. **Validation Errors (Client-side)**
   - Missing user selection: "يرجى اختيار المستخدم"
   - Missing password: "يرجى إدخال كلمة المرور"
   - Display inline below respective fields

2. **Authentication Errors (Server-side)**
   - Invalid credentials (401): "اسم المستخدم أو كلمة المرور غير صحيحة"
   - Account disabled (403): "تم تعطيل هذا الحساب. يرجى التواصل مع المسؤول"
   - Display in toast notification

3. **Network Errors**
   - Connection failed: "خطأ في الاتصال. يرجى المحاولة مرة أخرى"
   - Timeout: "انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى"
   - Display in toast notification

4. **API Errors**
   - User list fetch failed: "خطأ في تحميل قائمة المستخدمين"
   - Display inline in dropdown area

### Error Recovery

- **On validation error:** Highlight field, show message, keep form enabled
- **On auth error:** Clear password, show toast, keep user selected, re-enable form
- **On network error:** Show toast with retry option, re-enable form
- **On API error:** Show inline message, provide manual retry button

## UI/UX Design

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│                    Gradient Background                   │
│                                                          │
│              ┌──────────────────────────┐               │
│              │                          │               │
│              │      [Company Logo]      │               │
│              │  نظام إدارة الأقساط     │               │
│              │                          │               │
│              │  ┌────────────────────┐ │               │
│              │  │ اختر المستخدم     │ │               │
│              │  │ [Dropdown ▼]       │ │               │
│              │  └────────────────────┘ │               │
│              │                          │               │
│              │  ┌────────────────────┐ │               │
│              │  │ كلمة المرور        │ │               │
│              │  │ [••••••••]    [👁] │ │               │
│              │  └────────────────────┘ │               │
│              │                          │               │
│              │  ☑ تذكرني               │               │
│              │                          │               │
│              │  ┌────────────────────┐ │               │
│              │  │      دخول          │ │               │
│              │  └────────────────────┘ │               │
│              │                          │               │
│              └──────────────────────────┘               │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Tailwind CSS Classes

**Page Container:**

```css
min-h-screen bg-gradient-to-br from-white to-gray-100 flex items-center justify-center p-8 dir-rtl
```

**Login Card:**

```css
bg-white rounded-lg shadow-xl p-8 w-full max-w-md space-y-6
```

**Logo:**

```css
w-32 h-32 mx-auto object-contain
```

**System Title:**

```css
text-2xl font-bold text-center text-gray-800 mt-4
```

**Input Fields:**

```css
w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-right
```

**Submit Button:**

```css
w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed
```

**Error Text:**

```css
text-sm text-red-600 mt-1 text-right
```

### Responsive Breakpoints

- **Desktop (1920px):** Max card width 448px, centered
- **Laptop (1440px):** Max card width 448px, centered
- **Tablet (1024px):** Max card width 400px, centered
- **Below 1024px:** Not supported (show message)

### Accessibility

- All form inputs have proper `aria-label` attributes in Arabic
- Error messages linked with `aria-describedby`
- Focus indicators visible on all interactive elements
- Keyboard navigation fully supported
- Screen reader announcements for loading states

## Testing Strategy

### Unit Tests

**Component Tests (React Testing Library):**

1. LoginPage renders correctly with all elements
2. UserDropdown filters users by Arabic text input
3. PasswordInput toggles visibility correctly
4. Form validation triggers on empty fields
5. RememberMe checkbox stores/retrieves userId

**Service Tests (Jest):**

1. AuthService.fetchUsers() calls correct endpoint
2. AuthService.login() sends correct payload
3. Token storage/retrieval works correctly
4. Error responses are parsed correctly

### Integration Tests

1. **Happy Path:** Select user → Enter password → Submit → Redirect
2. **Validation:** Submit empty form → See validation errors
3. **Auth Error:** Submit wrong password → See error toast
4. **Network Error:** Simulate network failure → See error message
5. **Remember Me:** Check box → Login → Reload → User pre-selected

### E2E Tests (Cypress)

1. Complete login flow from page load to dashboard
2. User dropdown search functionality
3. Password visibility toggle
4. Error message display and recovery
5. Remember me persistence across sessions

### Manual Testing Checklist

- [ ] RTL layout displays correctly in Chrome, Firefox, Edge
- [ ] Arabic text renders properly with correct fonts
- [ ] Dropdown search works with Arabic keyboard input
- [ ] All transitions and animations are smooth
- [ ] Loading states display correctly
- [ ] Toast notifications appear and dismiss properly
- [ ] Form works with keyboard only (no mouse)
- [ ] Responsive layout works at 1024px, 1440px, 1920px

## Security Considerations

1. **Password Handling:**
   - Never log passwords to console
   - Clear password from memory after submission
   - Use HTTPS for all API calls

2. **Token Storage:**
   - Store JWT in localStorage (acceptable for internal tool)
   - Include token expiration check
   - Clear token on logout

3. **XSS Prevention:**
   - React's built-in XSS protection via JSX
   - Sanitize any user-generated content (though minimal in login)

4. **CSRF Protection:**
   - Backend should implement CSRF tokens for state-changing operations
   - Login endpoint should validate origin headers

5. **Rate Limiting:**
   - Backend should implement rate limiting on login endpoint
   - Frontend should show appropriate message if rate limited

## Performance Optimization

1. **Code Splitting:**
   - Login page as separate chunk (lazy loaded)
   - Toast component lazy loaded

2. **API Optimization:**
   - Cache user list for 5 minutes
   - Debounce dropdown search (300ms)

3. **Bundle Size:**
   - Use Headless UI for dropdown (smaller than full component libraries)
   - Tree-shake unused Tailwind classes
   - Optimize logo image (WebP format, max 50KB)

4. **Rendering:**
   - Memoize user list filtering
   - Use React.memo for static components (Logo, SystemTitle)

## Deployment Considerations

1. **Environment Variables:**
   - `VITE_API_URL` - Backend API base URL
   - `VITE_ENABLE_REMEMBER_ME` - Feature flag for remember me

2. **Build Configuration:**
   - Enable Tailwind JIT mode
   - Configure RTL plugin for Tailwind
   - Set up Arabic font loading

3. **Browser Support:**
   - Chrome 90+
   - Firefox 88+
   - Edge 90+
   - Safari 14+ (if needed)

4. **Monitoring:**
   - Track login success/failure rates
   - Monitor API response times
   - Log authentication errors (without sensitive data)
