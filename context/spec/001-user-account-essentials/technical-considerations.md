# Technical Specification: User Account Essentials

- **Functional Specification:** [001-user-account-essentials/functional-spec.md](./functional-spec.md)
- **Status:** Draft
- **Author(s):** SavePoint Team (with Claude Code assistance)

---

## 1. High-Level Technical Approach

This feature implements the foundational authentication and profile management system for SavePoint. The implementation leverages the existing NextAuth v5 + AWS Cognito infrastructure while adding:

1. **First-time user detection** with conditional redirect to optional profile setup
2. **Profile management feature module** with setup and editing capabilities
3. **S3-compatible storage** (LocalStack for development, AWS S3 for production) for avatar uploads
4. **Real-time username validation** with uniqueness, profanity, and reserved name checks
5. **30-day session duration** to match functional requirements

**Systems Affected:**
- Authentication flow (`auth.ts`, Cognito OAuth callbacks)
- User model schema (new fields and constraints)
- New feature module: `features/profile/`
- New app routes: `/profile`, `/profile/setup`, `/profile/settings`
- New service: `ProfileService` with supporting repository functions
- Docker Compose configuration (add LocalStack service)
- Infrastructure (Terraform): S3 bucket creation for production

---

## 2. Proposed Solution & Implementation Plan

### 2.1. Architecture Changes

**New Feature Module Structure:**

```
features/profile/
├── ui/
│   ├── profile-setup-form.tsx           # First-time setup (skip allowed)
│   ├── profile-settings-form.tsx        # Edit profile anytime
│   ├── profile-view.tsx                 # Private read-only profile
│   ├── avatar-upload.tsx                # Reusable avatar upload component
│   └── username-input.tsx               # Username input with real-time validation
├── server-actions/
│   ├── update-profile.ts                # Update username/avatar
│   ├── upload-avatar.ts                 # Handle avatar upload to S3
│   ├── check-username-availability.ts   # Real-time validation
│   └── complete-profile-setup.ts        # First-time setup completion
├── hooks/
│   └── use-username-validation.ts       # Client-side debounced validation hook
├── lib/
│   ├── validation.ts                    # Username validation logic
│   └── profanity-filter.ts              # Profanity check wrapper
└── schemas.ts                           # Zod schemas for profile operations
```

**New App Routes (Unified `/profile` Structure):**

```
app/
└── profile/
    ├── page.tsx                         # Private profile view (read-only)
    ├── setup/
    │   └── page.tsx                     # First-time profile setup (optional)
    ├── settings/
    │   └── page.tsx                     # Edit profile (username, avatar)
    └── layout.tsx                       # Shared layout for all /profile routes
```

**Service Layer Addition:**

```
data-access-layer/services/profile/
├── profile-service.ts                   # Business logic for profile operations
├── profile-service.unit.test.ts         # Service layer unit tests
└── types.ts                             # Profile-specific types
```

**Repository Layer Additions:**

```
data-access-layer/repository/user/
├── user-repository.ts                   # Add profile-related user queries
└── user-repository.integration.test.ts

data-access-layer/repository/library/
├── library-repository.ts                # Add getLibraryStatsByUserId
└── library-repository.integration.test.ts
```

**Shared Infrastructure:**

```
shared/lib/storage/
├── s3-client.ts                         # AWS SDK S3 client wrapper
├── avatar-storage.ts                    # Avatar-specific storage operations
└── storage.unit.test.ts                 # S3 operations unit tests
```

---

### 2.2. Data Model / Database Changes

#### **Prisma Schema Modifications** (`schema.prisma`)

```prisma
model User {
  id                   String                 @id @default(cuid())
  name                 String?
  email                String?                @unique
  emailVerified        DateTime?
  image                String?                // S3 URL or path
  password             String?
  username             String?                @unique  // NEW: Unique constraint
  usernameNormalized   String?                @unique  // NEW: Lowercase for case-insensitive check
  createdAt            DateTime               @default(now())  // NEW: Join date tracking
  steamProfileURL      String?
  steamId64            String?
  steamUsername        String?
  steamAvatar          String?
  steamConnectedAt     DateTime?

  // Relations (unchanged)
  Account              Account[]
  Session              Session[]
  LibraryItem          LibraryItem[]
  Review               Review[]
  JournalEntry         JournalEntry[]
  IgnoredImportedGames IgnoredImportedGames[]
  ImportedGame         ImportedGame[]

  @@index([usernameNormalized])  // NEW: Index for fast lookups
}
```

**Key Changes:**
1. **`username`**: Made unique (application enforces 3-25 chars, letters/numbers/special chars)
2. **`usernameNormalized`**: Stores lowercase version for case-insensitive uniqueness checks (e.g., "JohnDoe" → "johndoe")
3. **`createdAt`**: Tracks account creation timestamp (for "Joined [Month Year]" display)
4. **`image`**: Will store S3 URLs like `https://s3.amazonaws.com/savepoint-prod/user-avatars/{userId}/{filename}`

**Migration Strategy:**

```bash
# Migration will be named: 20250120_add_user_profile_fields
# Steps:
# 1. Add username, usernameNormalized, createdAt columns (nullable initially)
# 2. Backfill createdAt from Account.created_at or Session.created_at (earliest timestamp)
# 3. Add unique constraints on username and usernameNormalized
# 4. Add index on usernameNormalized for fast lookups
```

**Handling Existing Users:**
- Migration will backfill `createdAt` from the earliest `Account` or `Session` record
- `username` remains nullable; existing users will be prompted to set it on next login
- Default username suggestion: Use their `name` field from Google OAuth

---

### 2.3. API Contracts & Server Actions

All server actions follow the established pattern using `next-safe-action` with `authorizedActionClient` for authenticated operations and `actionClient` for public endpoints.

#### **Server Actions**

**1. Complete Profile Setup** (`features/profile/server-actions/complete-profile-setup.ts`)

```typescript
"use server";

import { authorizedActionClient } from "@/shared/lib/safe-action";
import { CompleteProfileSetupSchema } from "../schemas";
import { ProfileService } from "@/data-access-layer/services/profile";

export const completeProfileSetup = authorizedActionClient
  .inputSchema(CompleteProfileSetupSchema)
  .action(async ({ parsedInput, ctx: { userId } }) => {
    // CompleteProfileSetupSchema validates:
    // - username: optional, 3-25 chars, alphanumeric + special chars
    // - avatarUrl: optional string (S3 URL after upload)

    return ProfileService.completeSetup(userId, parsedInput);
  });
```

**2. Update Profile** (`features/profile/server-actions/update-profile.ts`)

```typescript
"use server";

import { authorizedActionClient } from "@/shared/lib/safe-action";
import { UpdateProfileSchema } from "../schemas";
import { ProfileService } from "@/data-access-layer/services/profile";

export const updateProfile = authorizedActionClient
  .inputSchema(UpdateProfileSchema)
  .action(async ({ parsedInput, ctx: { userId } }) => {
    // UpdateProfileSchema validates:
    // - username: required, 3-25 chars
    // - avatarUrl: optional string

    return ProfileService.updateProfile(userId, parsedInput);
  });
```

**3. Check Username Availability** (`features/profile/server-actions/check-username-availability.ts`)

```typescript
"use server";

import { actionClient } from "@/shared/lib/safe-action";
import { CheckUsernameSchema } from "../schemas";
import { ProfileService } from "@/data-access-layer/services/profile";

export const checkUsernameAvailability = actionClient
  .inputSchema(CheckUsernameSchema)
  .action(async ({ parsedInput }) => {
    // No auth required (public endpoint for real-time validation)
    // CheckUsernameSchema validates: username string

    return ProfileService.checkUsernameAvailability(parsedInput.username);
  });
```

**4. Upload Avatar** (`features/profile/server-actions/upload-avatar.ts`)

```typescript
"use server";

import { authorizedActionClient } from "@/shared/lib/safe-action";
import { UploadAvatarSchema } from "../schemas";
import { AvatarStorageService } from "@/shared/lib/storage";

export const uploadAvatar = authorizedActionClient
  .inputSchema(UploadAvatarSchema)
  .action(async ({ parsedInput, ctx: { userId } }) => {
    // UploadAvatarSchema validates:
    // - file: File object, max 5MB, mime type check

    const result = await AvatarStorageService.uploadAvatar(userId, parsedInput.file);

    if (result.ok) {
      // Update user record with new avatar URL
      await ProfileService.updateAvatarUrl(userId, result.data.url);
    }

    return result;
  });
```

---

### 2.4. Component Breakdown

#### **App Router Pages (Server Components)**

**1. Profile View** (`app/profile/page.tsx`)
```typescript
import { getServerUserId } from "@/auth";
import { ProfileService } from "@/data-access-layer/services/profile";
import { ProfileView } from "@/features/profile/ui/profile-view";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const userId = await getServerUserId();

  // ✅ Service layer only - no direct Prisma calls
  const result = await ProfileService.getProfileWithStats(userId);

  if (!result.ok) {
    redirect("/login");
  }

  return <ProfileView profile={result.data} />;
}
```

**2. Setup Page** (`app/profile/setup/page.tsx`)
```typescript
import { redirect } from "next/navigation";
import { getServerUserId } from "@/auth";
import { ProfileService } from "@/data-access-layer/services/profile";
import { ProfileSetupForm } from "@/features/profile/ui/profile-setup-form";

export default async function ProfileSetupPage() {
  const userId = await getServerUserId();

  // ✅ Service layer determines if setup is needed
  const result = await ProfileService.checkSetupStatus(userId);

  if (!result.ok) {
    redirect("/login");
  }

  // If setup already completed, redirect to profile
  if (!result.data.needsSetup) {
    redirect("/profile");
  }

  return <ProfileSetupForm defaultUsername={result.data.suggestedUsername} />;
}
```

**3. Settings Page** (`app/profile/settings/page.tsx`)
```typescript
import { getServerUserId } from "@/auth";
import { ProfileService } from "@/data-access-layer/services/profile";
import { ProfileSettingsForm } from "@/features/profile/ui/profile-settings-form";
import { redirect } from "next/navigation";

export default async function ProfileSettingsPage() {
  const userId = await getServerUserId();

  // ✅ Service layer provides current profile data
  const result = await ProfileService.getProfile(userId);

  if (!result.ok) {
    redirect("/login");
  }

  return (
    <ProfileSettingsForm
      currentUsername={result.data.username}
      currentAvatar={result.data.image}
    />
  );
}
```

**4. Shared Layout** (`app/profile/layout.tsx`)
```typescript
import { redirect } from "next/navigation";
import { getServerUserId } from "@/auth";

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getServerUserId();

  if (!userId) {
    redirect("/login");
  }

  return (
    <div className="container max-w-4xl py-8">
      {children}
    </div>
  );
}
```

#### **Client Components**

**1. Profile Setup Form** (`features/profile/ui/profile-setup-form.tsx`)
- **Purpose:** Optional first-time user configuration after OAuth
- **Behavior:**
  - Displays username input (optional, pre-filled with `defaultUsername` from Google name)
  - Avatar upload area (optional, blank if skipped)
  - "Skip" button → redirects to `/dashboard`
  - "Save & Continue" button → saves data, redirects to `/dashboard`
- **Uses:** `useUsernameValidation` hook for real-time checks, `completeProfileSetup` server action

**2. Profile Settings Form** (`features/profile/ui/profile-settings-form.tsx`)
- **Purpose:** Edit profile anytime
- **Behavior:**
  - Pre-fills current username and avatar
  - Real-time username validation with debounced API calls
  - "Save Changes" button → updates profile, shows success toast
- **Uses:** `updateProfile` server action, `UsernameInput` component

**3. Private Profile View** (`features/profile/ui/profile-view.tsx`)
- **Purpose:** Read-only view of own profile with stats
- **Displays:**
  - Username
  - Avatar (or blank placeholder)
  - Join date ("Joined January 2025")
  - Status breakdown (Curious About: 3, Currently Exploring: 2, etc.)
  - Last 3-5 games marked as `CURRENTLY_EXPLORING` (most recent first)
- **Client Component:** Receives pre-fetched data from server component

**4. Avatar Upload Component** (`features/profile/ui/avatar-upload.tsx`)
- **Reusable client component** for file upload
- **Features:**
  - Drag-and-drop or click to select
  - Client-side validation (file size, MIME type)
  - Image preview before upload
  - Progress indicator during upload
  - Error handling with user-friendly messages
- **Uses:** `uploadAvatar` server action

**5. Username Input Component** (`features/profile/ui/username-input.tsx`)
- **Reusable client component** with real-time validation
- **Features:**
  - Debounced input (500ms delay before validation)
  - Loading spinner during validation
  - Error states: "Username already exists", "Username not allowed", "Too short/long"
  - Success state: Green checkmark when valid
- **Uses:** `useUsernameValidation` hook

---

### 2.5. Business Logic & Algorithms

#### **Username Validation Logic** (`features/profile/lib/validation.ts`)

```typescript
import Filter from "bad-words";

export type ValidationResult =
  | { valid: true }
  | { valid: false; error: string };

const RESERVED_USERNAMES = ["admin", "support", "savepoint", "moderator"];

export const validateUsername = (username: string): ValidationResult => {
  // 1. Length check (3-25 chars)
  if (username.length < 3 || username.length > 25) {
    return { valid: false, error: "Username must be 3-25 characters" };
  }

  // 2. Character check (alphanumeric + _-.)
  const validChars = /^[a-zA-Z0-9_\-\.]+$/;
  if (!validChars.test(username)) {
    return {
      valid: false,
      error: "Username can only contain letters, numbers, _, -, and ."
    };
  }

  // 3. Reserved names check (case-insensitive)
  if (RESERVED_USERNAMES.includes(username.toLowerCase())) {
    return { valid: false, error: "Username is not allowed" };
  }

  // 4. Profanity check (using bad-words library)
  const filter = new Filter();
  if (filter.isProfane(username)) {
    return { valid: false, error: "Username is not allowed" };
  }

  return { valid: true };
};
```

**Real-Time Availability Check Flow:**
1. User types in username input → debounced to 500ms
2. Client validation runs first (length, characters, profanity, reserved)
3. If client validation passes, call `checkUsernameAvailability` server action
4. Server normalizes username to lowercase
5. Repository query: Check if `usernameNormalized` exists
6. Return `{ available: boolean }` to client
7. Client displays checkmark (available) or error message (taken)

#### **Avatar Upload Flow**

```
Client                    Server Action              S3 (LocalStack/AWS)
  │                             │                            │
  │──1. Select File────────────▶│                            │
  │                             │                            │
  │                             │──2. Validate───────────────│
  │                             │   (size, MIME type)        │
  │                             │                            │
  │                             │──3. Generate unique name───│
  │                             │   {userId}/{timestamp}.jpg │
  │                             │                            │
  │                             │──4. Upload to S3──────────▶│
  │                             │                            │
  │                             │◀─5. Return S3 URL──────────│
  │                             │                            │
  │                             │──6. Call ProfileService────│
  │                             │   updateAvatarUrl()        │
  │                             │                            │
  │◀─7. Return success─────────│                            │
  │   + S3 URL                  │                            │
  │                             │                            │
  │──8. Display new avatar──────│                            │
```

**S3 Key Format:** `user-avatars/{userId}/{timestamp}-{sanitized-filename}.{ext}`

**Example:** `user-avatars/clx123abc/1705847392-profile-pic.jpg`

---

### 2.6. Authentication Flow Modifications

#### **Current Flow:**
```
User → OAuth (Cognito/Google) → NextAuth callback → Redirect to /dashboard
```

#### **New Flow:**
```
User → OAuth (Cognito/Google) → NextAuth callback
  → ProfileService.getRedirectAfterAuth(userId)
    → Checks if first-time user (no username OR createdAt within last 5 minutes)
      → YES: Redirect to /profile/setup (optional setup)
      → NO: Redirect to /dashboard
```

**Implementation:** Modify `auth.ts` callbacks

```typescript
// auth.ts (updated redirect callback)
export const { auth, handlers, signIn } = NextAuth({
  adapter: PrismaAdapter(prisma),
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session: async ({ session, token }) => {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
        },
      };
    },
    redirect: async ({ url, baseUrl }) => {
      const session = await auth();

      // ✅ Service layer determines redirect logic
      const result = await ProfileService.getRedirectAfterAuth(session.user.id);

      if (!result.ok) {
        return `${baseUrl}/login`; // Fallback on error
      }

      const { isNewUser } = result.data;

      if (isNewUser) {
        return `${baseUrl}/profile/setup`;
      }

      // Respect original redirect URL if valid, else go to dashboard
      return url.startsWith(baseUrl) ? url : `${baseUrl}/dashboard`;
    },
  },
  providers: [
    Cognito({
      issuer: env.AUTH_COGNITO_ISSUER,
      clientId: env.AUTH_COGNITO_ID,
      clientSecret: env.AUTH_COGNITO_SECRET,
      authorization: {
        params: { identity_provider: "Google" },
      },
    }),
    ...(enableCredentials ? [Credentials({ /* ... */ })] : []),
  ],
  session: {
    maxAge: 30 * 24 * 60 * 60, // ✅ Updated from 7 days to 30 days
    strategy: "jwt",
    updateAge: 24 * 60 * 60, // Rotate every day
  },
});
```

---

### 2.7. Service Layer Implementation

#### **ProfileService** (`data-access-layer/services/profile/profile-service.ts`)

```typescript
import { BaseService } from "../base-service";
import type { ServiceResult } from "../types";
import { validateUsername } from "@/features/profile/lib/validation";
import { createLogger } from "@/shared/lib/logger";
import {
  findUserById,
  updateUserProfile,
  findUserByNormalizedUsername,
} from "@/data-access-layer/repository/user";
import { getLibraryStatsByUserId } from "@/data-access-layer/repository/library";

type ProfileError = {
  code: string;
  message: string;
};

export class ProfileService extends BaseService {
  private logger = createLogger({ service: "ProfileService" });

  /**
   * Get user profile with aggregated stats (for profile view page)
   */
  async getProfileWithStats(
    userId: string
  ): Promise<ServiceResult<ProfileWithStats, ProfileError>> {
    this.logger.info({ userId }, "Fetching profile with stats");

    try {
      const user = await findUserById(userId, {
        select: {
          username: true,
          image: true,
          createdAt: true,
        },
      });

      if (!user) {
        return {
          ok: false,
          error: { code: "USER_NOT_FOUND", message: "User not found" },
        };
      }

      // Get library stats from repository
      const statsResult = await getLibraryStatsByUserId(userId);

      if (!statsResult.ok) {
        return {
          ok: false,
          error: { code: "STATS_FETCH_FAILED", message: "Failed to load stats" },
        };
      }

      return {
        ok: true,
        data: {
          username: user.username,
          avatar: user.image,
          joinDate: user.createdAt,
          stats: statsResult.data,
        },
      };
    } catch (error) {
      this.logger.error({ err: error, userId }, "Failed to fetch profile");
      return {
        ok: false,
        error: { code: "FETCH_FAILED", message: "Failed to load profile" },
      };
    }
  }

  /**
   * Get basic profile data (for settings page)
   */
  async getProfile(
    userId: string
  ): Promise<ServiceResult<Profile, ProfileError>> {
    this.logger.info({ userId }, "Fetching profile");

    const user = await findUserById(userId, {
      select: { username: true, image: true },
    });

    if (!user) {
      return {
        ok: false,
        error: { code: "USER_NOT_FOUND", message: "User not found" },
      };
    }

    return { ok: true, data: user };
  }

  /**
   * Check if user needs to complete profile setup
   * Returns suggested username (from Google name) if needed
   */
  async checkSetupStatus(
    userId: string
  ): Promise<ServiceResult<SetupStatus, ProfileError>> {
    this.logger.info({ userId }, "Checking setup status");

    const user = await findUserById(userId, {
      select: { username: true, name: true, createdAt: true },
    });

    if (!user) {
      return {
        ok: false,
        error: { code: "USER_NOT_FOUND", message: "User not found" },
      };
    }

    // Business logic: needs setup if no username OR created within last 5 minutes
    const needsSetup =
      !user.username ||
      (user.createdAt && Date.now() - user.createdAt.getTime() < 5 * 60 * 1000);

    return {
      ok: true,
      data: {
        needsSetup,
        suggestedUsername: user.name || undefined,
      },
    };
  }

  /**
   * Determine where to redirect user after OAuth authentication
   */
  async getRedirectAfterAuth(
    userId: string
  ): Promise<ServiceResult<AuthRedirect, ProfileError>> {
    this.logger.info({ userId }, "Determining post-auth redirect");

    const setupStatus = await this.checkSetupStatus(userId);

    if (!setupStatus.ok) {
      return setupStatus;
    }

    return {
      ok: true,
      data: {
        isNewUser: setupStatus.data.needsSetup,
        redirectTo: setupStatus.data.needsSetup ? "/profile/setup" : "/dashboard",
      },
    };
  }

  /**
   * Complete profile setup for first-time users
   */
  async completeSetup(
    userId: string,
    data: { username?: string; avatarUrl?: string }
  ): Promise<ServiceResult<User, ProfileError>> {
    this.logger.info({ userId }, "Completing profile setup");

    try {
      // Validate username if provided
      if (data.username) {
        const validation = validateUsername(data.username);
        if (!validation.valid) {
          return {
            ok: false,
            error: { code: "INVALID_USERNAME", message: validation.error },
          };
        }

        // Check uniqueness
        const availabilityResult = await this.checkUsernameAvailability(data.username);
        if (!availabilityResult.ok || !availabilityResult.data.available) {
          return {
            ok: false,
            error: { code: "USERNAME_TAKEN", message: "Username already exists" },
          };
        }
      }

      // Update user record via repository
      const user = await updateUserProfile(userId, {
        username: data.username,
        usernameNormalized: data.username?.toLowerCase(),
        image: data.avatarUrl,
      });

      this.logger.info({ userId, username: data.username }, "Profile setup completed");
      return { ok: true, data: user };
    } catch (error) {
      this.logger.error({ err: error, userId }, "Profile setup failed");
      return {
        ok: false,
        error: { code: "SETUP_FAILED", message: "Failed to complete setup" },
      };
    }
  }

  /**
   * Update existing user profile
   */
  async updateProfile(
    userId: string,
    data: { username: string; avatarUrl?: string }
  ): Promise<ServiceResult<User, ProfileError>> {
    this.logger.info({ userId }, "Updating profile");

    try {
      // Validate username
      const validation = validateUsername(data.username);
      if (!validation.valid) {
        return {
          ok: false,
          error: { code: "INVALID_USERNAME", message: validation.error },
        };
      }

      // Check if username changed
      const currentUser = await findUserById(userId, {
        select: { username: true },
      });

      if (currentUser?.username !== data.username) {
        // Username changed - check availability
        const availabilityResult = await this.checkUsernameAvailability(data.username);
        if (!availabilityResult.ok || !availabilityResult.data.available) {
          return {
            ok: false,
            error: { code: "USERNAME_TAKEN", message: "Username already exists" },
          };
        }
      }

      // Update via repository
      const user = await updateUserProfile(userId, {
        username: data.username,
        usernameNormalized: data.username.toLowerCase(),
        image: data.avatarUrl,
      });

      this.logger.info({ userId, username: data.username }, "Profile updated");
      return { ok: true, data: user };
    } catch (error) {
      this.logger.error({ err: error, userId }, "Profile update failed");
      return {
        ok: false,
        error: { code: "UPDATE_FAILED", message: "Failed to update profile" },
      };
    }
  }

  /**
   * Check if username is available (case-insensitive)
   */
  async checkUsernameAvailability(
    username: string
  ): Promise<ServiceResult<{ available: boolean }, ProfileError>> {
    const normalized = username.toLowerCase();

    const existingUser = await findUserByNormalizedUsername(normalized);

    return {
      ok: true,
      data: { available: !existingUser },
    };
  }

  /**
   * Update user avatar URL after S3 upload
   */
  async updateAvatarUrl(
    userId: string,
    avatarUrl: string
  ): Promise<ServiceResult<void, ProfileError>> {
    this.logger.info({ userId }, "Updating avatar URL");

    try {
      await updateUserProfile(userId, { image: avatarUrl });
      return { ok: true, data: undefined };
    } catch (error) {
      this.logger.error({ err: error, userId }, "Avatar URL update failed");
      return {
        ok: false,
        error: { code: "UPDATE_FAILED", message: "Failed to update avatar" },
      };
    }
  }
}

// Export singleton instance
export const profileService = new ProfileService();
```

---

### 2.8. Repository Layer Implementation

#### **User Repository** (`data-access-layer/repository/user/user-repository.ts`)

```typescript
import { prisma } from "@/shared/lib/db";
import type { Prisma } from "@prisma/client";

/**
 * Find user by ID with flexible field selection
 */
export const findUserById = async <T extends Prisma.UserSelect>(
  userId: string,
  options?: { select?: T }
) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: options?.select,
  });
};

/**
 * Update user profile fields
 */
export const updateUserProfile = async (
  userId: string,
  data: {
    username?: string;
    usernameNormalized?: string;
    image?: string;
  }
) => {
  return prisma.user.update({
    where: { id: userId },
    data,
  });
};

/**
 * Check if username exists (case-insensitive)
 */
export const findUserByNormalizedUsername = async (
  usernameNormalized: string
) => {
  return prisma.user.findUnique({
    where: { usernameNormalized },
    select: { id: true },
  });
};
```

#### **Library Repository** (`data-access-layer/repository/library/library-repository.ts`)

```typescript
import { prisma } from "@/shared/lib/db";

/**
 * Get aggregated library statistics for a user
 * Returns status breakdown and recently played games
 */
export const getLibraryStatsByUserId = async (userId: string) => {
  try {
    const [statusCounts, recentGames] = await Promise.all([
      // Count games by status
      prisma.libraryItem.groupBy({
        by: ["status"],
        where: { userId },
        _count: true,
      }),

      // Get last 5 games marked as CURRENTLY_EXPLORING
      prisma.libraryItem.findMany({
        where: {
          userId,
          status: "CURRENTLY_EXPLORING",
        },
        orderBy: { updatedAt: "desc" },
        take: 5,
        include: {
          game: {
            select: {
              title: true,
              coverImage: true,
            },
          },
        },
      }),
    ]);

    return {
      ok: true,
      data: {
        statusCounts: statusCounts.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {} as Record<string, number>),
        recentGames: recentGames.map((item) => ({
          gameId: item.gameId,
          title: item.game.title,
          coverImage: item.game.coverImage,
          lastPlayed: item.updatedAt,
        })),
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: { code: "STATS_FETCH_FAILED", message: "Failed to fetch library stats" },
    };
  }
};
```

---

### 2.9. S3 Storage Setup

#### **LocalStack Configuration** (Development)

**Add to `docker-compose.yml`:**

```yaml
services:
  # ... existing PostgreSQL and pgAdmin services

  localstack:
    image: localstack/localstack:latest
    container_name: savepoint-localstack
    ports:
      - "4566:4566"  # LocalStack gateway
      - "4510-4559:4510-4559"  # External services port range
    environment:
      - SERVICES=s3
      - DEBUG=1
      - DATA_DIR=/tmp/localstack/data
      - DOCKER_HOST=unix:///var/run/docker.sock
    volumes:
      - "./localstack-data:/tmp/localstack"
      - "/var/run/docker.sock:/var/run/docker.sock"
    networks:
      - savepoint-network

networks:
  savepoint-network:
    driver: bridge
```

**LocalStack Initialization Script** (`scripts/init-localstack.sh`):

```bash
#!/bin/bash
# Wait for LocalStack to be ready
echo "Waiting for LocalStack to start..."
sleep 5

# Create S3 bucket
aws --endpoint-url=http://localhost:4566 s3 mb s3://savepoint-dev

# Set bucket CORS policy
aws --endpoint-url=http://localhost:4566 s3api put-bucket-cors \
  --bucket savepoint-dev \
  --cors-configuration file://scripts/localstack-cors.json

echo "LocalStack S3 bucket 'savepoint-dev' created successfully"
```

**CORS Configuration** (`scripts/localstack-cors.json`):

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:6060"],
      "AllowedMethods": ["GET", "PUT", "POST"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

**Environment Variables** (`.env` additions):

```bash
# S3 Configuration
AWS_REGION=us-east-1
AWS_ENDPOINT_URL=http://localhost:4566  # LocalStack (dev only, omit in production)
AWS_ACCESS_KEY_ID=test                   # LocalStack dummy credentials (dev only)
AWS_SECRET_ACCESS_KEY=test               # LocalStack dummy credentials (dev only)
S3_BUCKET_NAME=savepoint-dev             # savepoint-prod in production
S3_AVATAR_PATH_PREFIX=user-avatars/
```

**Update `.env.example`:**

```bash
# Add these lines to .env.example
AWS_REGION=us-east-1
AWS_ENDPOINT_URL=http://localhost:4566
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
S3_BUCKET_NAME=savepoint-dev
S3_AVATAR_PATH_PREFIX=user-avatars/
```

#### **S3 Client Wrapper** (`shared/lib/storage/s3-client.ts`)

```typescript
import { S3Client } from "@aws-sdk/client-s3";
import { env } from "@/env.mjs";

export const s3Client = new S3Client({
  region: env.AWS_REGION,
  endpoint: env.AWS_ENDPOINT_URL, // LocalStack in dev, undefined in prod
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
  forcePathStyle: !!env.AWS_ENDPOINT_URL, // Required for LocalStack
});
```

#### **Avatar Storage Service** (`shared/lib/storage/avatar-storage.ts`)

```typescript
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "./s3-client";
import { env } from "@/env.mjs";
import { createLogger } from "@/shared/lib/logger";

const logger = createLogger({ service: "AvatarStorage" });

export class AvatarStorageService {
  /**
   * Upload avatar to S3 and return URL
   */
  static async uploadAvatar(
    userId: string,
    file: File
  ): Promise<{ ok: true; data: { url: string } } | { ok: false; error: string }> {
    try {
      // Validate file
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        return { ok: false, error: "File size exceeds 5MB" };
      }

      const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        return { ok: false, error: "Unsupported file format" };
      }

      // Generate unique key
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const key = `${env.S3_AVATAR_PATH_PREFIX}${userId}/${timestamp}-${sanitizedName}`;

      // Convert File to Buffer
      const buffer = Buffer.from(await file.arrayBuffer());

      // Upload to S3
      await s3Client.send(
        new PutObjectCommand({
          Bucket: env.S3_BUCKET_NAME,
          Key: key,
          Body: buffer,
          ContentType: file.type,
        })
      );

      // Construct URL
      const url = env.AWS_ENDPOINT_URL
        ? `${env.AWS_ENDPOINT_URL}/${env.S3_BUCKET_NAME}/${key}` // LocalStack
        : `https://${env.S3_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${key}`; // AWS

      logger.info({ userId, key }, "Avatar uploaded successfully");
      return { ok: true, data: { url } };
    } catch (error) {
      logger.error({ error, userId }, "Avatar upload failed");
      return { ok: false, error: "Upload failed. Please try again." };
    }
  }
}
```

#### **Production S3 Setup** (Terraform)

**Create new module:** `infra/modules/s3/main.tf`

```hcl
resource "aws_s3_bucket" "savepoint_storage" {
  bucket = "savepoint-${var.environment}"

  tags = {
    Name        = "SavePoint Storage"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "savepoint_storage" {
  bucket = aws_s3_bucket.savepoint_storage.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_cors_configuration" "savepoint_storage" {
  bucket = aws_s3_bucket.savepoint_storage.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = ["https://savepoint.app"]  # Production domain
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_public_access_block" "savepoint_storage" {
  bucket = aws_s3_bucket.savepoint_storage.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# IAM policy for ECS task to access S3
resource "aws_iam_policy" "s3_access" {
  name        = "savepoint-s3-access-${var.environment}"
  description = "Allow SavePoint app to access S3 bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.savepoint_storage.arn}/*"
      }
    ]
  })
}
```

**Add to ECS task role:** Reference this policy in the ECS task execution role

---

## 3. Impact and Risk Analysis

### 3.1. System Dependencies

**Direct Dependencies:**
- **NextAuth v5**: Authentication flow modifications (redirect callback logic)
- **Prisma**: Schema changes require migration (potential downtime during deployment)
- **Docker Compose**: LocalStack service addition for development
- **AWS SDK**: New dependency for S3 operations (`@aws-sdk/client-s3`)
- **External Libraries**:
  - `bad-words` (profanity filter, ~100KB)
  - `sharp` (optional, for image processing, ~10MB - defer to Phase 2)

**Affected Features:**
- **Dashboard**: May need to handle users without usernames (edge case for existing users)
- **Navigation**: Add "Profile" and "Settings" links
- **Journal/Library Features**: Profile stats query adds minimal overhead (indexed queries)
- **Future Social Features**: Username uniqueness is foundational for @mentions, public profiles

**New Environment Variables Required:**
- `AWS_REGION`, `AWS_ENDPOINT_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- `S3_BUCKET_NAME`, `S3_AVATAR_PATH_PREFIX`

### 3.2. Potential Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Migration failure on existing users** | High (data loss/corruption) | Low | 1. Test migration on staging database with production-like data<br>2. Create rollback migration script<br>3. Backfill `createdAt` from earliest Account/Session record<br>4. Keep `username` nullable to avoid breaking existing users |
| **S3 upload failures** | Medium (UX degradation) | Medium | 1. Implement retry logic with exponential backoff (3 attempts)<br>2. Show clear error messages to users<br>3. Allow profile save without avatar<br>4. Monitor upload success rate in CloudWatch |
| **Username uniqueness race condition** | Low (duplicate usernames) | Low | 1. Database-level unique constraint prevents duplicates at DB layer<br>2. Service layer handles unique constraint violations gracefully<br>3. Return "Username already exists" error to user |
| **Profanity filter false positives** | Low (UX friction) | Medium | 1. Use conservative profanity filter settings initially<br>2. Log all blocked usernames for manual review<br>3. Plan manual override mechanism for Phase 2<br>4. Allow users to contact support if blocked incorrectly |
| **LocalStack not running in dev** | Medium (dev experience) | Medium | 1. Add health check script: `scripts/check-localstack.sh`<br>2. Show clear error message if S3 unavailable<br>3. Document LocalStack setup in README<br>4. Add to onboarding checklist for new developers |
| **30-day session causing security concerns** | Low (account compromise) | Low | 1. Document as intended behavior in security policy<br>2. Session tokens rotate daily (`updateAge: 24h`)<br>3. Plan "Sign Out All Devices" feature for Phase 2<br>4. Monitor suspicious login patterns |
| **Large avatar uploads slowing page** | Medium (UX degradation) | Medium | 1. Validate file size on client before upload (5MB max)<br>2. Show progress indicator during upload<br>3. Lazy load avatars in lists (IntersectionObserver)<br>4. Consider image resizing in Phase 2 with `sharp` |
| **OAuth callback redirect loop** | High (login broken) | Low | 1. Add redirect loop detection (max 2 redirects)<br>2. Fallback to `/dashboard` after loop detected<br>3. Log redirect loops for debugging<br>4. Comprehensive E2E testing of OAuth flows |
| **Existing users without username** | Medium (UX confusion) | High | 1. Prompt existing users to set username on next login<br>2. Auto-generate suggestion from Google name<br>3. Allow app usage without username (non-blocking)<br>4. Add banner in dashboard: "Complete your profile" |

**Critical Path Testing:**
1. ✅ Test migration with production-like data (seed 10,000 users, verify backfill)
2. ✅ Load test S3 uploads (100 concurrent uploads, measure success rate)
3. ✅ E2E test OAuth flow (first-time user, returning user, skip setup)
4. ✅ Test username validation edge cases (unicode, emojis, SQL injection attempts)
5. ✅ Test redirect logic with various scenarios (new user, existing user, setup complete)

---

## 4. Testing Strategy

### 4.1. Unit Tests

**Service Layer** (`profile-service.unit.test.ts`):
- ✅ `completeSetup` with valid username → returns user
- ✅ `completeSetup` with invalid username (too short) → returns INVALID_USERNAME error
- ✅ `completeSetup` with taken username → returns USERNAME_TAKEN error
- ✅ `completeSetup` with no username (skipped) → returns user with null username
- ✅ `checkUsernameAvailability` with available name → returns `{ available: true }`
- ✅ `checkUsernameAvailability` with taken name (case-insensitive) → returns `{ available: false }`
- ✅ `updateProfile` with unchanged username → succeeds
- ✅ `updateProfile` with new valid username → succeeds
- ✅ `getProfileWithStats` → returns profile with status breakdown
- ✅ `checkSetupStatus` for new user (no username) → returns `{ needsSetup: true }`
- ✅ `checkSetupStatus` for existing user → returns `{ needsSetup: false }`
- ✅ `getRedirectAfterAuth` for new user → returns `/profile/setup`
- ✅ `getRedirectAfterAuth` for existing user → returns `/dashboard`

**Validation Logic** (`validation.unit.test.ts`):
- ✅ Username too short (2 chars) → invalid
- ✅ Username too long (26 chars) → invalid
- ✅ Username with invalid chars (@#$%) → invalid
- ✅ Username with valid chars (a-z, 0-9, _-.) → valid
- ✅ Reserved username ("admin", "support") → invalid (case-insensitive)
- ✅ Profane username → invalid (mock `bad-words` library)
- ✅ Unicode characters in username → invalid
- ✅ SQL injection attempt in username → invalid (caught by character check)

**S3 Storage** (`avatar-storage.unit.test.ts`):
- ✅ Upload valid JPEG image → returns S3 URL
- ✅ Upload oversized file (6MB) → returns error "File size exceeds 5MB"
- ✅ Upload invalid MIME type (text/plain) → returns error "Unsupported file format"
- ✅ S3 upload failure → returns error after retry attempts
- ✅ Generate correct S3 key format (`user-avatars/{userId}/{timestamp}-{filename}`)

### 4.2. Integration Tests

**Repository Layer** (`user-repository.integration.test.ts`):
- ✅ Create user with username → username and usernameNormalized are set
- ✅ Create two users with same username (different case) → second fails with unique constraint error
- ✅ Update user username → usernameNormalized is updated
- ✅ Query user by usernameNormalized → finds correct user
- ✅ Find user by ID with select → returns only requested fields

**Library Repository** (`library-repository.integration.test.ts`):
- ✅ `getLibraryStatsByUserId` with games in multiple statuses → returns correct counts
- ✅ `getLibraryStatsByUserId` with no games → returns empty stats
- ✅ `getLibraryStatsByUserId` recent games → returns last 5 CURRENTLY_EXPLORING games

**S3 Integration** (`localstack-s3.integration.test.ts`):
- ✅ Upload avatar to LocalStack → file exists in bucket
- ✅ Upload duplicate filename → both files stored with unique timestamps
- ✅ Download uploaded file → file contents match original
- ✅ Delete avatar → file is removed from bucket

### 4.3. Component Tests

**Username Input** (`username-input.test.tsx`):
- ✅ Typing triggers debounced validation after 500ms
- ✅ Available username shows green checkmark icon
- ✅ Taken username shows error message
- ✅ Invalid username (too short) shows validation error
- ✅ Loading spinner displayed during validation
- ✅ Clearing input resets validation state

**Avatar Upload** (`avatar-upload.test.tsx`):
- ✅ Selecting file shows preview
- ✅ Dragging file over dropzone highlights it
- ✅ Uploading shows progress indicator
- ✅ Upload success displays new avatar
- ✅ Upload failure shows error toast
- ✅ Oversized file rejected before upload

**Profile Setup Form** (`profile-setup-form.test.tsx`):
- ✅ Clicking "Skip" redirects to `/dashboard`
- ✅ Submitting with valid data redirects to `/dashboard`
- ✅ Submitting with invalid username shows error
- ✅ Submitting without username uses default (Google name)
- ✅ Form shows default username from props

**Profile Settings Form** (`profile-settings-form.test.tsx`):
- ✅ Form pre-fills current username and avatar
- ✅ Changing username triggers validation
- ✅ Saving with valid data shows success toast
- ✅ Saving with invalid data shows error
- ✅ Upload new avatar updates preview

### 4.4. End-to-End Tests (Playwright)

**Critical User Journeys:**

1. **First-Time Google OAuth Sign-Up with Profile Setup**
   - Sign in with Google (using test account)
   - Verify redirect to `/profile/setup`
   - Fill in username "e2euser123" and upload avatar
   - Click "Save & Continue"
   - Verify redirect to `/dashboard`
   - Verify username and avatar displayed in navigation
   - Navigate to `/profile` and verify profile view shows correct data

2. **First-Time User Skips Setup**
   - Sign in with Google (new test account)
   - Verify redirect to `/profile/setup`
   - Click "Skip" button
   - Verify redirect to `/dashboard`
   - Verify default username (Google name) displayed in navigation
   - Navigate to `/profile` and verify blank avatar

3. **Returning User Login**
   - Sign in with existing account (has username)
   - Verify direct redirect to `/dashboard` (no setup page)
   - Verify username in navigation

4. **Edit Profile**
   - Sign in with existing account
   - Navigate to `/profile/settings`
   - Change username from "oldname" to "newname123"
   - Verify real-time validation shows checkmark
   - Upload new avatar
   - Click "Save Changes"
   - Verify success toast appears
   - Verify new username in navigation
   - Navigate to `/profile` and verify new avatar displayed

5. **Username Conflict**
   - Create user A with username "johndoe"
   - Sign in as user B
   - Navigate to `/profile/settings`
   - Attempt to change username to "JohnDoe" (different case)
   - Verify error message: "Username already exists"
   - Verify save button disabled

6. **Credentials-Based Login (Dev Only)**
   - Set `AUTH_ENABLE_CREDENTIALS=true` in environment
   - Navigate to `/login`
   - Verify email/password form visible
   - Sign in with test credentials
   - Verify successful login and redirect

7. **Profile View with Stats**
   - Sign in with account that has library items
   - Navigate to `/profile`
   - Verify status breakdown displays (e.g., "Curious About: 3")
   - Verify recent games list shows last played games
   - Verify join date formatted correctly ("Joined January 2025")

**Coverage Target:**
- **Unit tests:** ≥80% for service layer, validation logic, storage utilities
- **Integration tests:** 100% of repository functions
- **Component tests:** ≥80% for interactive components (forms, inputs)
- **E2E tests:** All critical user journeys pass

---

## 5. Implementation Checklist

### Phase 1: Database & Infrastructure Setup
- [ ] Create Prisma migration for User model changes
- [ ] Add LocalStack service to `docker-compose.yml`
- [ ] Create LocalStack initialization script
- [ ] Add S3 environment variables to `.env.example`
- [ ] Update Terraform S3 module for production
- [ ] Test migration on staging database

### Phase 2: Repository Layer
- [ ] Implement `findUserById` in user repository
- [ ] Implement `updateUserProfile` in user repository
- [ ] Implement `findUserByNormalizedUsername` in user repository
- [ ] Implement `getLibraryStatsByUserId` in library repository
- [ ] Write integration tests for all repository functions

### Phase 3: Service Layer
- [ ] Create ProfileService class
- [ ] Implement all ProfileService methods
- [ ] Add comprehensive unit tests (≥80% coverage)
- [ ] Implement username validation logic
- [ ] Add profanity filter integration

### Phase 4: Storage Layer
- [ ] Implement S3 client wrapper
- [ ] Implement AvatarStorageService
- [ ] Write unit tests for storage operations
- [ ] Write LocalStack integration tests

### Phase 5: Server Actions
- [ ] Implement `completeProfileSetup` action
- [ ] Implement `updateProfile` action
- [ ] Implement `checkUsernameAvailability` action
- [ ] Implement `uploadAvatar` action
- [ ] Add Zod schemas for all actions

### Phase 6: UI Components
- [ ] Create ProfileSetupForm component
- [ ] Create ProfileSettingsForm component
- [ ] Create ProfileView component
- [ ] Create AvatarUpload component
- [ ] Create UsernameInput component with validation
- [ ] Write component tests (≥80% coverage)

### Phase 7: App Routes
- [ ] Create `/profile` page (view)
- [ ] Create `/profile/setup` page
- [ ] Create `/profile/settings` page
- [ ] Create `/profile/layout.tsx`
- [ ] Update `auth.ts` redirect callback
- [ ] Update session duration to 30 days

### Phase 8: Testing
- [ ] Run all unit tests
- [ ] Run all integration tests
- [ ] Run all component tests
- [ ] Write and run E2E tests for critical journeys
- [ ] Verify ≥80% code coverage

### Phase 9: Documentation & Deployment
- [ ] Update README with profile feature documentation
- [ ] Document LocalStack setup steps
- [ ] Update environment variable documentation
- [ ] Create deployment runbook
- [ ] Deploy to staging environment
- [ ] Conduct UAT (User Acceptance Testing)
- [ ] Deploy to production

---

**Document Metadata:**
- **Version:** 1.0
- **Last Updated:** 2025-01-20
- **Status:** Draft (Pending Approval)
- **Review Required By:** Development Team
