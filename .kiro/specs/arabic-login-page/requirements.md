# Requirements Document

## Introduction

This document specifies the requirements for an Arabic RTL login page for the Egyptian Retail Installments Management System (نظام إدارة الأقساط). The system is an internal tool designed for store owners and authorized sellers to manage customer installment accounts. The login page serves as the authentication gateway, featuring a user-selection dropdown instead of traditional username input, full Arabic language support with RTL layout, and integration with a backend authentication API.

## Glossary

- **Login System**: The authentication component that verifies user credentials and grants access to the Installments Management System
- **User Dropdown**: A searchable select component that displays all active users with their full names and branch assignments
- **RTL Layout**: Right-to-Left text direction and UI layout required for Arabic language interfaces
- **Authentication Token**: A JWT (JSON Web Token) returned by the backend upon successful login, stored in localStorage for session management
- **Backend API**: The Express.js REST API that provides user lists and authentication endpoints
- **Form Validation**: Client-side validation logic that ensures required fields are filled before submission
- **Toast Notification**: A temporary message overlay that displays success or error feedback to users

## Requirements

### Requirement 1

**User Story:** As a store seller, I want to select my name from a dropdown list instead of typing a username, so that I can quickly identify myself without memorizing login credentials.

#### Acceptance Criteria

1. WHEN the Login System loads, THE Login System SHALL fetch the list of active users from the Backend API endpoint GET /api/users/list
2. WHEN the user list is received, THE Login System SHALL display a searchable dropdown component with each user's full name and branch name in the format "الاسم الكامل (اسم الفرع)"
3. WHEN the User Dropdown contains more than 10 users, THE Login System SHALL provide search/filter functionality that filters users by typing Arabic characters
4. WHEN a user is selected from the User Dropdown, THE Login System SHALL auto-focus the password input field
5. WHEN the User Dropdown fails to load users, THE Login System SHALL display an error message "خطأ في تحميل قائمة المستخدمين"

### Requirement 2

**User Story:** As a store owner, I want the entire interface to be in Arabic with RTL layout, so that my team can use the system naturally in our native language.

#### Acceptance Criteria

1. THE Login System SHALL render all text content in Arabic language
2. THE Login System SHALL apply RTL (Right-to-Left) text direction to all text elements and form inputs
3. THE Login System SHALL position UI elements in RTL order with labels on the right side of inputs
4. THE Login System SHALL use Arabic-compatible fonts that render Arabic characters clearly
5. THE Login System SHALL display the system name "نظام إدارة الأقساط" prominently below the company logo

### Requirement 3

**User Story:** As a seller, I want to securely enter my password with the option to show/hide it, so that I can verify my input while maintaining security.

#### Acceptance Criteria

1. THE Login System SHALL provide a password input field with label "كلمة المرور" and placeholder "أدخل كلمة المرور"
2. THE Login System SHALL display the password as masked characters by default
3. WHEN the user clicks the eye icon toggle, THE Login System SHALL reveal the password in plain text
4. WHEN the user clicks the eye icon toggle again, THE Login System SHALL mask the password characters
5. WHEN the password field receives focus, THE Login System SHALL highlight the input border with the primary teal color (#00B5B8)

### Requirement 4

**User Story:** As a user, I want to submit my login credentials and receive clear feedback, so that I know whether my login attempt succeeded or failed.

#### Acceptance Criteria

1. WHEN the user clicks the "دخول" button with valid userId and password, THE Login System SHALL send a POST request to /api/auth/login with payload {userId, password}
2. WHEN the Backend API returns a successful response with token and user data, THE Login System SHALL store the Authentication Token in localStorage
3. WHEN authentication succeeds, THE Login System SHALL display a Toast Notification with message "تم تسجيل الدخول بنجاح" and redirect to /dashboard within 1 second
4. WHEN the Backend API returns invalid credentials error, THE Login System SHALL display error message "اسم المستخدم أو كلمة المرور غير صحيحة"
5. WHEN the Backend API returns a disabled account error, THE Login System SHALL display error message "تم تعطيل هذا الحساب. يرجى التواصل مع المسؤول"
6. WHEN a network error occurs during login, THE Login System SHALL display error message "خطأ في الاتصال. يرجى المحاولة مرة أخرى"

### Requirement 5

**User Story:** As a user, I want the form to validate my input before submission, so that I receive immediate feedback about missing or invalid data.

#### Acceptance Criteria

1. WHEN the user attempts to submit without selecting a user, THE Login System SHALL display validation error "يرجى اختيار المستخدم"
2. WHEN the user attempts to submit without entering a password, THE Login System SHALL display validation error "يرجى إدخال كلمة المرور"
3. WHEN Form Validation detects errors, THE Login System SHALL prevent form submission and highlight invalid fields with red borders
4. WHEN the user presses the Enter key with valid form data, THE Login System SHALL submit the login form
5. WHILE the login request is in progress, THE Login System SHALL disable the submit button and display loading text "جاري التحميل..."

### Requirement 6

**User Story:** As a frequent user, I want the option to stay logged in, so that I don't have to re-enter my credentials every time I access the system.

#### Acceptance Criteria

1. THE Login System SHALL provide a "تذكرني" (Remember Me) checkbox below the password field
2. WHEN the Remember Me checkbox is checked during login, THE Login System SHALL store the selected userId in localStorage
3. WHEN the Login System loads and a remembered userId exists in localStorage, THE Login System SHALL pre-select that user in the User Dropdown
4. WHEN the user unchecks the Remember Me checkbox, THE Login System SHALL remove the stored userId from localStorage upon next login
5. WHEN authentication fails, THE Login System SHALL clear the password field but maintain the selected user

### Requirement 7

**User Story:** As a user, I want a visually appealing and professional login interface, so that I feel confident using the system.

#### Acceptance Criteria

1. THE Login System SHALL display the company logo at the top of the login card with minimum height of 80 pixels
2. THE Login System SHALL render the login form within a centered card with white background, rounded corners, and shadow-xl elevation
3. THE Login System SHALL apply a subtle gradient background from white (#FFFFFF) to light gray (#F3F4F6) on the page
4. THE Login System SHALL use teal (#00B5B8) as the primary color for buttons and focus states
5. THE Login System SHALL apply smooth transitions (300ms duration) to all interactive elements including buttons and inputs
6. THE Login System SHALL ensure the login card is responsive for screen widths from 1024px to 1920px
7. THE Login System SHALL use Tailwind CSS utility classes for all styling without custom CSS files
