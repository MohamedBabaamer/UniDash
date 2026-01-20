# Role-Based Access Control System

## Overview
The UniDash application now supports two user roles: **Admin** and **Student**.

## Roles

### Student (Default)
- **Capabilities**: View-only access
- **Features Available**:
  - Browse courses by year and semester
  - View course details, chapters, and resources
  - Access TD/TP series and exam materials (if available)
  - Manage their own profile
- **Features Hidden**:
  - Manage Modules link in sidebar
  - Manage Chapters link in sidebar
  - Cannot access `/admin/modules` route
  - Cannot access `/admin/chapters` route

### Admin
- **Capabilities**: Full CRUD access
- **Features Available**:
  - All student features PLUS:
  - Create, edit, and delete courses/modules
  - Create, edit, and delete chapters/resources
  - Access admin management pages
  - See "Admin" section in navigation sidebar

## Implementation Details

### 1. User Profile Type
```typescript
interface UserProfile {
  id?: string;
  email: string;
  displayName?: string;
  studentId?: string;
  phone?: string;
  address?: string;
  role: 'student' | 'admin'; // NEW: Role field
}
```

### 2. Auth Context Enhancement
The `AuthContext` now provides:
- `userProfile: UserProfile | null` - Full user profile data
- `isAdmin: boolean` - Computed flag based on role

### 3. Protected Routes
- **ProtectedRoute**: Requires authentication
- **AdminRoute**: Requires authentication + admin role
  - Redirects non-admin users to home page

### 4. Default Role Assignment
When a user first logs in, a profile is automatically created with:
- `role: 'student'` (default)
- Email and display name from auth

### 5. Navigation Visibility
The Layout component conditionally renders:
- Always visible: Home, Dashboard, My Profile
- Admin-only: Manage Modules, Manage Chapters

## How to Make a User an Admin

Since there's no UI for this yet, you need to manually update the Firestore database:

1. Go to Firebase Console
2. Navigate to Firestore Database
3. Find the `users` collection
4. Locate the user document (by email or UID)
5. Edit the document and change `role: "student"` to `role: "admin"`
6. Save changes
7. User needs to refresh the page to see admin features

## Future Enhancements
- [ ] Super admin panel to manage user roles
- [ ] Role assignment during signup/invitation
- [ ] More granular permissions (e.g., editor, viewer)
- [ ] Audit log for admin actions
