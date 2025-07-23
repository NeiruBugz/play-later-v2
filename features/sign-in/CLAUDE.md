# Sign-in Feature - CLAUDE.md

This file provides guidance to Claude Code when working with the sign-in feature module in this repository.

## Feature Overview

The Sign-in feature provides secure user authentication through Google OAuth using NextAuth.js v5. It enables seamless user registration and login without password management complexity, serving as the primary entry point for user access to the PlayLater platform.

### Primary Purpose

- **Single Sign-On**: Google OAuth 2.0 integration for frictionless authentication
- **User Registration**: Automatic account creation for first-time users
- **Session Management**: Secure JWT-based session handling with 7-day persistence
- **UI Flexibility**: Multiple component variants for different page contexts

### Business Value

- Reduces authentication friction through trusted OAuth provider
- Eliminates password management complexity
- Increases user conversion rates with streamlined onboarding
- Provides secure, industry-standard authentication flow

## Architecture and Component Breakdown

### Directory Structure

```
features/sign-in/
├── components/
│   ├── index.ts           # Component exports
│   └── sign-in.tsx        # Main SignIn component (lines 1-27)
├── index.ts               # Feature exports
├── PRD.md                 # Product requirements document
└── CLAUDE.md              # This documentation file
```

### Component Architecture

#### SignIn Component (`/features/sign-in/components/sign-in.tsx`)

**Purpose**: Renders Google OAuth sign-in button with server action integration

**Key Features**:

- **Server Action Integration**: Inline server action using NextAuth.js `signIn` function (lines 10-13)
- **Variant Support**: Conditional styling based on `variant` prop (`default` | `start`) (lines 7, 18-20)
- **Accessibility**: Proper form structure with type="submit" button (lines 9, 16)
- **UI Integration**: Uses shadcn/ui Button component with Tailwind CSS classes (lines 4, 15-23)

**Props Interface**:

```typescript
interface SignInProps {
  variant: "default" | "start"; // Controls button styling and appearance
}
```

**Server Action Flow**:

```typescript
// Inline server action (lines 10-13)
action={async () => {
  "use server";
  await signIn("google");
}}
```

## Data Flow

### Authentication Flow

```
1. User clicks SignIn button → 2. Server action executes → 3. NextAuth.js OAuth flow → 4. Google authentication → 5. User redirect to dashboard
```

**Detailed Flow**:

1. **Client Interaction**: User interacts with SignIn component button
2. **Server Action**: Form submission triggers inline server action (line 10-13)
3. **NextAuth Integration**: Calls `signIn("google")` from `/auth.ts` (line 1, 12)
4. **OAuth Redirect**: NextAuth.js handles Google OAuth 2.0 flow
5. **Session Creation**: JWT token generated with user data (auth.ts lines 11-25)
6. **Database Persistence**: User record created/updated via PrismaAdapter (auth.ts line 9)
7. **Route Protection**: `getServerUserId` utility validates sessions (auth.ts lines 35-48)

### Integration Points

#### NextAuth.js Configuration (`/auth.ts`)

- **Adapter**: PrismaAdapter for database integration (line 9)
- **Provider**: Google OAuth provider (line 27)
- **Session Strategy**: JWT with 7-day expiration (lines 28-32)
- **Callbacks**: Custom JWT and session handling (lines 10-25)

#### API Routes (`/app/api/auth/[...nextauth]/route.ts`)

- **Handlers**: Exports NextAuth.js GET/POST handlers (lines 1-3)
- **Route Pattern**: Handles all authentication endpoints under `/api/auth/`

## TypeScript Patterns and Type Definitions

### Component Props

```typescript
// Explicit variant typing for design system consistency
{ variant }: { variant: "default" | "start" }
```

### Authentication Utilities

```typescript
// Server-side session validation with error handling
export const getServerUserId = async (): Promise<string | undefined> => {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      sessionErrorHandler();
      return;
    }
    return session.user.id;
  } catch (error) {
    console.error(error);
  }
};
```

### Session Type Extensions

NextAuth.js session extended with user ID (auth.ts lines 17-24):

```typescript
session: async ({ session, token }) => {
  return {
    ...session,
    user: {
      ...session.user,
      id: token.id as string,
    },
  };
};
```

## Key Files and Responsibilities

### Core Implementation Files

#### `/features/sign-in/components/sign-in.tsx` (27 lines)

**Primary Responsibilities**:

- Render Google OAuth sign-in button
- Handle variant-based styling (`default` vs `start`)
- Execute server-side authentication action
- Integrate with shadcn/ui design system

**Key Dependencies**:

- `@/auth` - NextAuth.js signIn function (line 1)
- `@/shared/components/ui/button` - UI component (line 4)
- `@/shared/lib` - Utility functions (line 5)

#### `/auth.ts` (49 lines)

**Primary Responsibilities**:

- NextAuth.js configuration and setup
- Google OAuth provider configuration
- JWT and session callback handling
- Server-side session validation utility

**Key Dependencies**:

- `@auth/prisma-adapter` - Database integration (line 1)
- `next-auth/providers/google` - OAuth provider (line 3)
- `@/shared/lib/db` - Prisma client (line 6)

#### `/app/api/auth/[...nextauth]/route.ts` (4 lines)

**Primary Responsibilities**:

- Export NextAuth.js API handlers
- Handle authentication API endpoints

### Support Files

#### `/test/setup/auth-mock.ts` (31 lines)

**Primary Responsibilities**:

- Provide authentication mocks for testing
- Mock authenticated and unauthenticated states
- Setup Vitest mocks for auth functions

**Mock Data**:

```typescript
export const mockAuthenticatedUser = {
  id: "test-user-id",
  email: "test@example.com",
  name: "Test User",
};
```

#### `/shared/lib/session-error-handler.ts` (5 lines)

**Primary Responsibilities**:

- Handle authentication failures
- Provide consistent error messaging
- Throw authorization errors

## Testing Strategy

### Current Testing Approach

- **Mock Framework**: Vitest with authentication mocks (`/test/setup/auth-mock.ts`)
- **Mock Patterns**: Authenticated and unauthenticated user states
- **Integration Testing**: Real NextAuth.js flow testing through API routes

### Testing Utilities Available

#### Authentication Mocks

```typescript
// Setup complete auth mocking for tests
export function setupAuthMocks() {
  vi.mock("@/auth", () => ({
    auth: mockAuth(),
    getServerUserId: vi.fn().mockResolvedValue(mockAuthenticatedUser.id),
  }));
}
```

#### Mock User States

```typescript
const mockAuthenticatedUser = {
  id: "test-user-id",
  email: "test@example.com",
  name: "Test User",
};

const mockUnauthenticatedUser = null;
```

### Recommended Test Coverage

**Unit Tests** (Missing - Should be implemented):

- SignIn component rendering with different variants
- Server action execution and error handling
- Props validation and styling application

**Integration Tests** (Missing - Should be implemented):

- Full OAuth flow with Google provider
- Session creation and persistence
- Database user record creation
- Error handling for failed authentications

## Integration Points with Other Features

### Usage Locations

1. **Landing Page** (`/app/page.tsx` lines 72, 153):

   - `<SignIn variant="start" />` - Hero section call-to-action
   - `<SignIn variant="default" />` - Secondary conversion point

2. **Feature Integration**:
   - **Dashboard**: Protected routes require authentication
   - **User Management**: Profile creation and management post-auth
   - **Steam Integration**: Links Steam accounts to authenticated users

### Authentication Dependencies

#### Protected Routes

All protected features depend on authentication state:

- Dashboard components check `getServerUserId()`
- Server actions validate user sessions
- Database operations require authenticated user context

#### Session Management

- **Session Duration**: 7 days with daily rotation (auth.ts lines 29, 31)
- **Session Validation**: `getServerUserId` utility provides server-side checks
- **Error Handling**: `sessionErrorHandler` for unauthorized access

## Configuration and Environment

### Required Environment Variables

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# NextAuth.js Configuration
NEXTAUTH_SECRET=your_secure_secret
NEXTAUTH_URL=http://localhost:6060  # Development URL
```

### Database Requirements

NextAuth.js requires specific database tables (handled by PrismaAdapter):

- `User` - User profiles and metadata
- `Account` - OAuth account linking
- `Session` - Session management
- `VerificationToken` - Security tokens

## Security Considerations

### OAuth Security Features

- **PKCE Flow**: Enhanced security for OAuth 2.0
- **State Validation**: CSRF protection during OAuth flow
- **Secure Cookies**: HttpOnly, Secure, SameSite attributes
- **JWT Signing**: Cryptographically signed session tokens

### Session Security

- **Token Rotation**: Sessions rotate every 24 hours (auth.ts line 31)
- **Expiration**: 7-day maximum session lifetime (auth.ts line 29)
- **Server Validation**: All protected routes validate server-side
- **Error Handling**: Secure error responses without data leakage

## Performance Considerations

### Optimization Features

- **Server Actions**: Eliminate client-side JavaScript for form submission
- **JWT Strategy**: Stateless session validation without database queries
- **Adapter Caching**: PrismaAdapter provides efficient database operations
- **Route Handlers**: Minimal API surface with NextAuth.js handlers

### Bundle Impact

- **Minimal Client Code**: Only UI components sent to client
- **Server-Side Processing**: Authentication logic runs server-side
- **Tree Shaking**: Only required NextAuth.js modules included

## Development Notes

### Code Quality Patterns

- **Server Actions**: Inline server actions for simple form handling
- **TypeScript**: Strict typing for component props and auth utilities
- **Error Boundaries**: Graceful error handling for auth failures
- **Accessibility**: Proper semantic HTML and ARIA attributes

### Future Enhancement Opportunities

1. **Multi-Provider Support**: Add GitHub, Discord, Apple Sign-In
2. **Two-Factor Authentication**: Enhanced security options
3. **Session Analytics**: User authentication tracking and insights
4. **Progressive Enhancement**: Graceful degradation without JavaScript
