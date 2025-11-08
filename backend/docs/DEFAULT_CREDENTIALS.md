# Default Credentials

## Overview

This document lists the default user accounts created during database seeding. These credentials are for initial system access and **MUST** be changed after first login in a production environment.

⚠️ **SECURITY WARNING**: These default credentials are publicly documented and should only be used in development environments. Change all passwords immediately after deployment to production.

---

## Default Password

All seeded users share the same default password:

```
Password123
```

---

## Seeded User Accounts

### 1. Administrator Account

**Username:** `admin`  
**Password:** `Password123`  
**Full Name:** System Administrator  
**Role:** ADMIN  
**Branch:** Cairo Main Branch  
**Email:** admin@store.eg  
**Status:** Active

**Permissions:**
- Full system access
- User management
- Branch management
- All transaction operations
- System configuration

---

### 2. Manager Account

**Username:** `mohamed.ibrahim`  
**Password:** `Password123`  
**Full Name:** Mohamed Ibrahim  
**Role:** MANAGER  
**Branch:** Cairo Main Branch  
**Email:** mohamed.ibrahim@store.eg  
**Status:** Active

**Permissions:**
- Branch-level operations
- View and manage transactions
- Customer management
- Report generation
- User supervision

---

### 3. Seller Accounts

#### Seller 1
**Username:** `ahmed.hassan`  
**Password:** `Password123`  
**Full Name:** Ahmed Hassan  
**Role:** SELLER  
**Branch:** Cairo Main Branch  
**Email:** ahmed.hassan@store.eg  
**Status:** Active

**Permissions:**
- Create and manage sales
- Customer registration
- Payment processing
- View assigned transactions

---

#### Seller 2
**Username:** `fatima.ali`  
**Password:** `Password123`  
**Full Name:** Fatima Ali  
**Role:** SELLER  
**Branch:** Cairo Main Branch  
**Email:** fatima.ali@store.eg  
**Status:** Active

**Permissions:**
- Create and manage sales
- Customer registration
- Payment processing
- View assigned transactions

---

#### Seller 3
**Username:** `sara.mahmoud`  
**Password:** `Password123`  
**Full Name:** Sara Mahmoud  
**Role:** SELLER  
**Branch:** Alexandria Branch  
**Email:** sara.mahmoud@store.eg  
**Status:** Active

**Permissions:**
- Create and manage sales
- Customer registration
- Payment processing
- View assigned transactions

---

## Password Requirements

When changing passwords, ensure they meet the following requirements:

- **Minimum Length:** 8 characters
- **Recommended:** Use a mix of uppercase, lowercase, numbers, and special characters
- **Avoid:** Common words, sequential numbers, or personal information
- **Best Practice:** Use a password manager to generate and store strong passwords

### Example Strong Passwords:
- `Sb@y@2024!Secure`
- `M@nager#Cairo99`
- `S3ll3r$Alex2024`

---

## Changing Passwords After First Login

### For Development

Currently, the system does not have a password change endpoint implemented. To change passwords in development:

1. **Using Prisma Studio:**
   ```bash
   cd backend
   npx prisma studio
   ```
   - Navigate to the User model
   - Find the user you want to update
   - Generate a new password hash using bcrypt
   - Update the `passwordHash` field

2. **Using a Script:**
   Create a password update script:
   ```typescript
   import { PrismaClient } from '@prisma/client';
   import passwordService from './src/services/passwordService';

   const prisma = new PrismaClient();

   async function updatePassword(username: string, newPassword: string) {
     const hash = await passwordService.hashPassword(newPassword);
     await prisma.user.update({
       where: { username },
       data: { passwordHash: hash }
     });
     console.log(`Password updated for ${username}`);
   }

   // Usage
   updatePassword('admin', 'NewSecurePassword123!');
   ```

### For Production

**IMPORTANT:** Implement a password change feature before deploying to production. This should include:

1. **Password Change Endpoint:**
   - POST /api/auth/change-password
   - Requires current password verification
   - Validates new password strength
   - Updates passwordHash in database
   - Logs password change event

2. **Password Reset Flow:**
   - Email-based password reset
   - Temporary reset tokens
   - Secure token expiration
   - Email notification on password change

3. **Force Password Change:**
   - Add `mustChangePassword` flag to User model
   - Set to `true` for all default accounts
   - Redirect to password change page on first login
   - Prevent access until password is changed

---

## Security Best Practices

### For Administrators

1. **Change Default Passwords Immediately:**
   - Change all default passwords before allowing user access
   - Use unique passwords for each account
   - Store passwords securely (password manager)

2. **Disable Unused Accounts:**
   - Set `isActive = false` for accounts not in use
   - Regularly audit user accounts
   - Remove accounts for departed employees

3. **Monitor Login Activity:**
   - Review event_log table regularly
   - Watch for failed login attempts
   - Investigate suspicious activity

4. **Implement Password Policies:**
   - Require password changes every 90 days
   - Enforce strong password requirements
   - Prevent password reuse

### For Users

1. **Never Share Passwords:**
   - Each user should have their own account
   - Do not share credentials with colleagues
   - Report compromised accounts immediately

2. **Use Strong Passwords:**
   - Follow password requirements
   - Avoid predictable patterns
   - Use password manager

3. **Secure Your Session:**
   - Log out when finished
   - Don't leave workstation unattended while logged in
   - Clear browser cache on shared computers

---

## Troubleshooting

### Cannot Login with Default Credentials

**Problem:** Login fails with "Invalid credentials" error

**Solutions:**
1. Verify you're using the correct username (case-sensitive)
2. Ensure password is exactly `Password123` (case-sensitive)
3. Check if account is active in database
4. Verify database was seeded correctly:
   ```bash
   cd backend
   npx prisma studio
   ```
   Check if users exist with `isActive = true`

### Account Disabled

**Problem:** Login fails with "Account disabled" error

**Solution:**
1. Contact system administrator
2. Administrator can enable account in Prisma Studio:
   - Open user record
   - Set `isActive = true`
   - Save changes

### Rate Limit Exceeded

**Problem:** "Too many login attempts" error

**Solution:**
1. Wait 15 minutes before trying again
2. Ensure you're using correct credentials
3. Check if IP address is being rate-limited
4. Contact administrator if issue persists

---

## Database Seed Command

To recreate the default users (this will reset the database):

```bash
cd backend
npx prisma migrate reset
npx prisma db seed
```

⚠️ **WARNING:** This command will delete all existing data and recreate the database with default values. Only use in development.

---

## Contact

For password reset requests or account issues, contact:
- **System Administrator:** admin@store.eg
- **Technical Support:** support@store.eg

---

## Changelog

### Version 1.0.0 (Initial Release)
- Created 5 default user accounts (1 ADMIN, 1 MANAGER, 3 SELLERS)
- Default password: Password123
- All accounts assigned to branches
- All accounts set to active status
