# Guest User Token System - Implementation Summary

## Overview

A comprehensive guest user token system has been implemented to provide unique guest identities per device/browser session.

## Key Features

### 1. **Unique Guest Identity Per Device/Browser**

- Each guest receives a unique UUID token
- Token is stored in both:
  - HttpOnly cookie (`guest_token`) - secure, server-side
  - localStorage (`guest_token`) - client-side fallback
- Token persists across page reloads and sessions

### 2. **Isolation Between Devices**

- Different browsers → different guest users
- Different devices → different guest users
- Incognito mode → new guest user
- Clearing cookies/storage → new guest user

### 3. **Automatic Token Management**

- Tokens automatically created on first visit
- Existing tokens reused on subsequent visits
- Guest tokens cleared when user logs in as regular user
- New guest token created after logout

## Backend Implementation

### Files Modified/Created:

1. **`server/src/models/User.js`**
   - Added `isGuest` boolean field
   - Added `guestToken` unique field (UUID)
   - Added `lastActiveAt` timestamp for tracking activity

2. **`server/src/utils/guestToken.js`** (NEW)
   - `generateGuestToken()` - Creates secure UUID
   - `createGuestUser()` - Creates guest user in DB
   - `findGuestByToken()` - Finds and updates guest activity
   - `setGuestTokenCookie()` - Sets secure cookie
   - `clearGuestTokenCookie()` - Removes cookie
   - `generateGuestJWT()` - Creates JWT for guest

3. **`server/src/utils/guestCleanup.js`** (NEW)
   - `cleanupInactiveGuests()` - Removes old inactive guests
   - `getGuestStats()` - Returns guest user statistics

4. **`server/src/middleware/authMiddleware.js`**
   - Added `ensureGuestToken()` middleware
   - Enhanced `requireAuth()` to track guest activity
   - Added support for `X-Guest-Token` header

5. **`server/src/controllers/authController.js`**
   - Added `initGuestToken()` endpoint - Creates/retrieves guest token
   - Added `getGuestStats()` endpoint - Admin-only statistics
   - Updated `login()` - Clears guest token on login
   - Updated `logout()` - Clears guest token
   - Updated `toSafeUser()` - Includes guest fields

6. **`server/src/routes/authRoutes.js`**
   - Added `POST /auth/guest-token` - Initialize guest token
   - Added `GET /auth/guest-stats` - Get guest statistics (admin only)

## Frontend Implementation

### Files Modified/Created:

1. **`client/src/types/user.ts`**
   - Added `isGuest?: boolean` field
   - Added `guestToken?: string | null` field

2. **`client/src/services/authService.ts`**
   - Added `initGuestToken()` - Calls backend to create/retrieve guest
   - Added `getStoredGuestToken()` - Retrieves from localStorage
   - Added `storeGuestToken()` - Saves to localStorage
   - Added `clearStoredGuestToken()` - Removes from localStorage

3. **`client/src/lib/api/axiosInstance.ts`**
   - Added request interceptor to attach `X-Guest-Token` header
   - Added response interceptor to store new guest tokens

4. **`client/src/contexts/AuthContext.tsx`**
   - Modified `AuthProvider` to initialize guest token on mount
   - Updated `login()` to clear guest token
   - Updated `logout()` to create new guest token
   - Guest users can now access the app without authentication

5. **`client/src/components/AppShell.tsx`**
   - Updated routing logic to allow guest users
   - Only redirects to login if no user at all (not even guest)
   - Fixed React hydration and effect warnings

## API Endpoints

### New Endpoints:

- `POST /api/auth/guest-token` - Initialize or retrieve guest token
  - Returns: `{ user, guestToken, isNewGuest }`
- `GET /api/auth/guest-stats` - Get guest user statistics (admin only)
  - Returns: `{ totalGuests, activeGuests, inactiveGuests }`

### Modified Endpoints:

- `POST /api/auth/login` - Now clears guest tokens
- `POST /api/auth/logout` - Now clears guest tokens
- `GET /api/auth/me` - Now includes guest fields

## Security Features

1. **Secure Cookies**
   - HttpOnly: Cannot be accessed by JavaScript
   - SameSite: Lax (CSRF protection)
   - Secure: HTTPS only in production
   - Long expiry: 1 year for guest tokens

2. **Random Token Generation**
   - UUID v4 (crypto.randomUUID())
   - Non-predictable
   - Unique per guest

3. **Activity Tracking**
   - `lastActiveAt` updated on each request
   - Enables cleanup of inactive guests

4. **Dual Storage**
   - Cookie: Primary, secure storage
   - localStorage: Fallback for client-side persistence
   - Header: `X-Guest-Token` as additional method

## Usage Flow

### First Visit:

1. User visits site → No tokens exist
2. Frontend calls `initGuestToken()`
3. Backend creates new guest user with UUID
4. Backend sets `guest_token` cookie and JWT cookie
5. Frontend stores token in localStorage
6. User identified as guest throughout session

### Subsequent Visits:

1. User returns → Token exists in cookie/localStorage
2. Frontend calls `initGuestToken()` with existing token
3. Backend finds existing guest user
4. Backend updates `lastActiveAt`
5. Same guest identity maintained

### Login:

1. User logs in with credentials
2. Guest token cleared (cookie + localStorage)
3. Regular user session established

### Logout:

1. User logs out
2. All tokens cleared
3. New guest token automatically created
4. User continues as new guest

## Maintenance

### Cleanup Task:

Run periodically (via cron) to remove inactive guests:

```javascript
import { cleanupInactiveGuests } from "./utils/guestCleanup.js";

// Remove guests inactive for 90+ days
await cleanupInactiveGuests(90);
```

### Guest Statistics:

Admins can view guest metrics:

- Total guest users
- Active guests (last 7 days)
- Inactive guests

## Testing Checklist

- [ ] First visit creates unique guest
- [ ] Page reload maintains guest identity
- [ ] Different browser creates different guest
- [ ] Incognito mode creates different guest
- [ ] Login clears guest token
- [ ] Logout creates new guest token
- [ ] Cookie and localStorage sync properly
- [ ] Guests can access app without authentication
- [ ] Guest activity tracked correctly
- [ ] Admin can view guest statistics

## Benefits

1. **Unique Identity**: Each device/browser gets its own guest user
2. **Persistence**: Guest identity maintained across sessions
3. **Isolation**: No shared guest accounts between devices
4. **Seamless UX**: Automatic guest creation, no user action required
5. **Upgrade Path**: Easy conversion from guest to registered user
6. **Data Association**: Can link carts, favorites, etc. to specific guests
7. **Analytics**: Track unique guest sessions
8. **Security**: Tokens are secure, random, and non-predictable

## Notes

- Guest tokens have 1-year expiry (can be adjusted)
- Guests have full access to app features (controlled by permissions)
- Guest users marked with `isGuest: true` in database
- Activity tracking enables cleanup and analytics
- System handles token failures gracefully
