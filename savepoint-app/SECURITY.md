# Security Architecture

## Authentication & Authorization

### Three-Layer Security Model

SavePoint implements **defense in depth** with authorization checks at multiple layers:

#### 1. Server Action Layer (Authentication)
- **Location**: `features/*/server-actions/`
- **Responsibility**: Authenticate the user and obtain `userId`
- **Method**: `getServerUserId()` from NextAuth v5

```typescript
const userId = await getServerUserId();
if (!userId) {
  return { success: false, error: "Unauthorized" };
}
```

#### 2. Service Layer (Business Logic)
- **Location**: `data-access-layer/services/`
- **Responsibility**: Business logic validation and userId propagation
- **Pattern**: Always require `userId` as a parameter

```typescript
async updateLibraryItem(params: {
  userId: string;
  libraryItem: { id: number; status: LibraryItemStatus };
}) {
  // Service validates business rules
  // Passes userId to repository layer
}
```

#### 3. Repository Layer (Data Access Authorization)
- **Location**: `data-access-layer/repository/`
- **Responsibility**: **Enforce ownership** through database queries
- **Pattern**: Include `userId` in `where` clauses

```typescript
export async function deleteLibraryItem({
  libraryItemId,
  userId,
}: DeleteLibraryItemInput) {
  // Check ownership before delete
  const item = await prisma.libraryItem.findFirst({
    where: { id: libraryItemId, userId },
  });

  if (!item) {
    return repositoryError(
      RepositoryErrorCode.NOT_FOUND,
      "Library item not found"
    );
  }

  await prisma.libraryItem.delete({ where: { id: libraryItemId } });
}
```

### Why This Pattern is Secure

1. **Prevents Horizontal Privilege Escalation**: Users cannot modify other users' data
2. **Database-Level Enforcement**: Even if service layer has bugs, repository prevents unauthorized access
3. **Type Safety**: TypeScript ensures `userId` parameters are not accidentally omitted
4. **Testability**: Each layer can be tested independently with mock userId values

### Security Checklist for New Features

When adding new mutations (create, update, delete):

- [ ] Server action calls `getServerUserId()` and checks for authentication
- [ ] Service method accepts `userId` parameter
- [ ] Repository function includes `userId` in `where` clause for ownership check
- [ ] Integration tests verify users cannot access other users' resources

## Rate Limiting

### Production: Redis-based (Distributed)
- **Provider**: Upstash Redis
- **Algorithm**: Sliding window
- **Limit**: 20 requests per hour per IP
- **Required**: `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` env vars

### Development: In-Memory (Local)
- Falls back to Map-based rate limiting when Redis env vars not provided
- Same limits as production for consistency

## Security Headers

Implemented via Next.js middleware (`middleware.ts`):

- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-XSS-Protection: 1; mode=block` - Browser XSS protection
- `Content-Security-Policy` - Restricts resource loading
- `Strict-Transport-Security` - Forces HTTPS (production)
- `Referrer-Policy: strict-origin-when-cross-origin` - Limits referrer leakage
- `Permissions-Policy` - Disables unused browser features

## Input Validation

### Zod Schemas
All external input is validated with Zod schemas:
- Server actions validate input before calling services
- Services may add additional business rule validation
- Repository layer trusts validated input from services

### Example Pattern
```typescript
// 1. Define schema
const UpdateProfileSchema = z.object({
  username: z.string().min(3).max(20),
  avatarUrl: z.string().url().optional(),
});

// 2. Validate in server action
const parsed = UpdateProfileSchema.safeParse(input);
if (!parsed.success) {
  return { success: false, error: "Invalid input" };
}

// 3. Pass validated data to service
const result = await profileService.updateProfile({
  userId,
  ...parsed.data,
});
```

## Password Security

- **Algorithm**: bcrypt
- **Rounds**: 12 (as of 2025, recommended for modern hardware)
- **Location**: `shared/lib/app/password.ts`

## File Upload Security

### Avatar Uploads
- **Max Size**: 4MB (enforced in `next.config.mjs`)
- **Storage**: Vercel Blob Storage
- **Validation**: MIME type checking (images only)
- **Sanitization**: Filename sanitization to prevent path traversal

### File Size Limits
```javascript
// next.config.mjs
experimental: {
  serverActions: {
    bodySizeLimit: "4mb",
  },
}
```

## CSRF Protection

**Status**: Planned (not yet implemented)
- See task: "Add CSRF protection and auth endpoint rate limiting"
- Will use double-submit cookie pattern or synchronizer tokens

## OAuth Security

### Primary Provider: AWS Cognito
- Managed via Terraform in `infra/`
- User pools for dev and prod environments
- OAuth 2.0 / OpenID Connect

### Development Provider: Credentials
- Email/password for local development and E2E tests
- Controlled by `AUTH_ENABLE_CREDENTIALS` environment variable
- **Never enabled in production**

## Security Audit Logging

**Status**: Planned (not yet implemented)
- See task: "Add security audit logging"
- Will log authentication events, authorization failures, and sensitive operations

## Reporting Security Issues

If you discover a security vulnerability, please email the maintainer directly rather than opening a public issue.
