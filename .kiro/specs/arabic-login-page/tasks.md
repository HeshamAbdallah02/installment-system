# Implementation Plan

- [x] 1. Set up project configuration and dependencies
  - Install required npm packages: @headlessui/react, @heroicons/react, react-hook-form, axios
  - Configure Tailwind CSS with RTL plugin and Arabic font support
  - Set up environment variables for API URL in .env file
  - _Requirements: 7.7_

- [x] 2. Create authentication service layer
  - [x] 2.1 Implement AuthService class with API methods
    - Create authService.ts with fetchUsers() and login() methods
    - Implement token storage methods (storeToken, getToken, clearToken)
    - Implement remember me methods (rememberUser, getRememberedUser, clearRememberedUser)
    - Add error handling and response parsing
    - _Requirements: 1.1, 4.1, 4.2, 6.2, 6.3_

  - [x] 2.2 Create TypeScript interfaces for API data models
    - Define User, LoginRequest, LoginResponse, ErrorResponse interfaces
    - Export interfaces from types file for reuse across components
    - _Requirements: 1.2, 4.1_

- [x] 3. Build reusable UI components
  - [x] 3.1 Create UserDropdown component with search functionality
    - Implement Headless UI Combobox with Arabic text filtering
    - Add RTL-aware styling and keyboard navigation
    - Display users in format "الاسم الكامل (اسم الفرع)"
    - Handle loading and error states
    - _Requirements: 1.2, 1.3, 1.4_

  - [x] 3.2 Create PasswordInput component with visibility toggle
    - Implement password input with show/hide eye icon
    - Add RTL-aware icon positioning (left side)
    - Apply focus states with teal color
    - Handle disabled and error states
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 3.3 Create ToastNotification component
    - Implement React Portal for overlay rendering
    - Add slide-in animation from top with RTL positioning
    - Implement auto-dismiss after 3 seconds
    - Support success, error, and info types with appropriate styling
    - _Requirements: 4.3, 4.4, 4.5, 4.6_

  - [x] 3.4 Create LoadingOverlay component
    - Display loading spinner with Arabic text "جاري التحميل..."
    - Overlay entire form during API calls
    - Use Tailwind CSS for backdrop and centering
    - _Requirements: 5.5_

- [x] 4. Implement main LoginPage component
  - [x] 4.1 Set up component structure and state management
    - Initialize React Hook Form with validation schema
    - Set up state for users list, loading, errors, and password visibility
    - Configure RTL direction on component mount
    - _Requirements: 2.1, 2.2, 5.1, 5.2_

  - [x] 4.2 Implement user list fetching on component mount
    - Call fetchUsers() on component mount
    - Handle loading state while fetching
    - Display error message if fetch fails
    - Check localStorage for remembered user and pre-select
    - _Requirements: 1.1, 1.5, 6.3_

  - [x] 4.3 Implement form submission and authentication logic
    - Validate form data before submission
    - Call login API with userId and password
    - Handle success: store token, show toast, redirect to /dashboard
    - Handle errors: show appropriate Arabic error messages, clear password
    - Implement Remember Me functionality
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 6.2, 6.5_

  - [x] 4.4 Implement user selection and auto-focus behavior
    - Handle user selection from dropdown
    - Auto-focus password field when user is selected
    - Update form state and validation
    - _Requirements: 1.4_

  - [x] 4.5 Add keyboard navigation support
    - Enable Enter key to submit form
    - Ensure Tab navigation works correctly in RTL
    - Disable form during submission
    - _Requirements: 5.4, 5.5_

- [x] 5. Style the login page with Tailwind CSS
  - [x] 5.1 Create page layout with gradient background
    - Apply gradient from white to light gray
    - Center login card vertically and horizontally
    - Ensure responsive layout for 1024px+ screens
    - _Requirements: 7.3, 7.6_

  - [x] 5.2 Style login card with logo "D:\installment-system\Sabaya Logo.jpg" and system title
    - Display company logo with proper sizing (80px+ height)
    - Add system name "نظام إدارة الأقساط" below logo
    - Apply white background, rounded corners, and shadow-xl
    - _Requirements: 7.1, 7.2, 2.5_

  - [x] 5.3 Style form inputs and buttons
    - Apply teal (#00B5B8) primary color to buttons and focus states
    - Add smooth transitions (300ms) to interactive elements
    - Style error states with red borders and text
    - Ensure all text is right-aligned for RTL
    - _Requirements: 7.4, 7.5, 2.3_

- [x] 6. Implement form validation and error handling
  - [x] 6.1 Add client-side validation rules
    - Validate user selection is not empty
    - Validate password is not empty
    - Display inline error messages in Arabic
    - Highlight invalid fields with red borders
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 6.2 Handle API error responses
    - Parse error codes from backend (INVALID_CREDENTIALS, ACCOUNT_DISABLED)
    - Map error codes to Arabic error messages
    - Display errors in toast notifications
    - Clear password field on authentication failure
    - _Requirements: 4.4, 4.5, 4.6, 6.5_

- [x] 7. Add Remember Me functionality
  - [x] 7.1 Implement Remember Me checkbox
    - Add checkbox with label "تذكرني" below password field
    - Store selected userId in localStorage when checked
    - Retrieve and pre-select user on page load
    - Clear stored userId when unchecked
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 8. Integrate with backend API endpoints
  - [x] 8.1 Connect to GET /api/users/list endpoint
    - Fetch users on component mount
    - Handle response and populate dropdown
    - Handle network errors gracefully
    - _Requirements: 1.1_

  - [x] 8.2 Connect to POST /api/auth/login endpoint
    - Send userId and password in request body
    - Handle success response: store token and redirect
    - Handle error responses: display appropriate messages
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 9. Configure routing and navigation
  - Create route for /login path in React Router
  - Implement redirect to /dashboard on successful login
  - Add route guard to prevent accessing login when already authenticated
  - _Requirements: 4.3_

- [x] 10. Write component tests
  - [x] 10.1 Write unit tests for AuthService
    - Test fetchUsers() API call and response parsing
    - Test login() API call with correct payload
    - Test token storage and retrieval methods
    - Test remember me storage methods
    - _Requirements: 1.1, 4.1, 6.2_

  - [x] 10.2 Write component tests for UI components
    - Test UserDropdown renders and filters correctly
    - Test PasswordInput visibility toggle
    - Test ToastNotification display and auto-dismiss
    - Test form validation triggers
    - _Requirements: 1.2, 1.3, 3.2, 3.3, 5.1, 5.2_

  - [x] 10.3 Write integration tests for LoginPage
    - Test complete login flow (select user, enter password, submit)
    - Test validation error display
    - Test authentication error handling
    - Test Remember Me functionality
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 6.2_
