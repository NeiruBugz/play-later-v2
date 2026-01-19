# Steam Services

This directory contains services for interacting with Steam's Web API and OpenID authentication.

## Services

### SteamService
Handles Steam Web API operations including:
- Player profile retrieval
- Steam ID validation
- Vanity URL resolution

### SteamOpenIdService
Handles Steam OpenID 2.0 authentication flow:
- Generate Steam login URLs
- Validate OpenID callbacks
- Extract Steam ID64 from authentication response

## Usage

### Steam OpenID Authentication

The `SteamOpenIdService` implements the Steam OpenID 2.0 authentication flow (not OAuth).

#### Step 1: Generate Auth URL
```typescript
import { SteamOpenIdService } from "@/data-access-layer/services";

const service = new SteamOpenIdService();
const returnUrl = "https://savepoint.com/auth/steam/callback";
const authUrl = service.getAuthUrl(returnUrl);

// Redirect user to authUrl
```

#### Step 2: Validate Callback
```typescript
// In your callback handler (e.g., app/auth/steam/callback/route.ts)
const params = new URL(request.url).searchParams;
const result = await service.validateCallback(params);

if (result.success) {
  const steamId64 = result.data;
  // Use steamId64 to fetch user profile or create account
} else {
  console.error(result.error, result.code);
  // Handle authentication failure
}
```

## OpenID Flow Overview

1. **App → Steam**: User is redirected to Steam's OpenID login page
   - URL: `https://steamcommunity.com/openid/login`
   - Parameters include return URL and OpenID 2.0 namespace

2. **Steam → User**: User authenticates on Steam's website

3. **Steam → App**: Steam redirects back to app with signed parameters
   - Includes `openid.claimed_id` with Steam ID64
   - Includes signature for verification

4. **App → Steam**: App verifies signature with Steam API
   - POST request with `openid.mode=check_authentication`
   - Returns `is_valid:true` if authentic

5. **App**: Extract Steam ID64 from `openid.claimed_id`
   - Format: `https://steamcommunity.com/openid/id/76561198012345678`

## Error Handling

Both services return `ServiceResult<T>` types:

```typescript
type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: ServiceErrorCode };
```

### Error Codes

- `VALIDATION_ERROR`: Invalid input or malformed OpenID response
- `UNAUTHORIZED`: Invalid OpenID signature
- `NOT_FOUND`: Steam user not found
- `INTERNAL_ERROR`: Network errors or unexpected failures
- `EXTERNAL_SERVICE_ERROR`: Steam API errors

## Testing

Unit tests are located in:
- `steam-service.unit.test.ts`
- `steam-openid-service.unit.test.ts`

Run tests:
```bash
pnpm test data-access-layer/services/steam/
```

## Security Notes

1. **Always verify signatures**: Never trust `openid.claimed_id` without verification
2. **Use HTTPS**: Return URLs must use HTTPS in production
3. **Validate origin**: The `openid.realm` should match your application's origin
4. **No secrets required**: Steam OpenID doesn't use client secrets (unlike OAuth)

## References

- [Steam Web API Documentation](https://developer.valvesoftware.com/wiki/Steam_Web_API)
- [OpenID 2.0 Specification](https://openid.net/specs/openid-authentication-2_0.html)
- [Steam OpenID Example](https://steamcommunity.com/dev)
