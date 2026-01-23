# Xbox Profile Integration Research

_Research document covering Xbox Live integration options for SavePoint, focusing on game library and achievement import via unofficial APIs._

---

## Overview

Unlike PlayStation, Xbox has a more accessible ecosystem for third-party integrations through services like OpenXBL. While Microsoft doesn't offer a public consumer OAuth API for game library access, unofficial services provide reliable access to Xbox Live data including full game libraries (not just achievements).


## How Xbox Integration Works

Xbox integration has two viable approaches:

### Option A: OpenXBL OAuth (Recommended)
```
1. User clicks "Link Xbox Account"
2. Redirect to OpenXBL OAuth (Login with Xbox Live)
3. User authenticates with Microsoft account
4. App receives access token and XUID
5. Account linked → can import game/achievement data
```

This approach:
- Uses familiar OAuth flow (similar to Google/Steam)
- No manual verification required
- Provides access to XUID (Xbox User ID) for API calls
- Is cleaner UX than PSN's "About Me" verification

### Option B: Gamertag + Code Verification (Fallback)
```
1. User enters Gamertag
2. App generates verification code
3. User adds code to Xbox bio/motto
4. App verifies via API
5. Account verified
```

This fallback mirrors the PlayStation approach but is less necessary given OpenXBL's OAuth support.


## Recommended Implementation: OpenXBL REST API

### Service Details
---
- **Service**: [OpenXBL](https://xbl.io/) - Unofficial Xbox Live API
- **Cost**: Free tier (150 requests/hour), paid plans available
- **Auth**: API key (X-Authorization header) or OAuth flow
- **Language**: REST API (no official TypeScript wrapper - use fetch/axios)
- **Documentation**: [xbl.io/docs](https://xbl.io/docs)

### Available Data
---
| Endpoint | Data | Use Case |
|----------|------|----------|
| `/account/{xuid}` | Profile, gamertag, avatar | Account linking |
| `/achievements/player/{xuid}` | All achievements across games | Achievement import |
| `/achievements/player/{xuid}/title/{titleId}` | Per-game achievements | Detailed enrichment |
| `/player/titleHistory/{xuid}` | Full game library history | Game import |

### What We Can Import
---
- **Full game library**: All games ever played (not just achievements)
- **Achievements**: Unlocked achievements with timestamps
- **Gamerscore**: Per game and total
- **Playtime**: Partial support (some titles report time played)
- **Platform**: Xbox One, Xbox Series X|S, Windows
- **Friends list**: Available for social features

### Advantages Over PlayStation
---
- **Full library access**: Can see all owned/played games, not just trophy games
- **OAuth authentication**: Standard OAuth flow, no manual "About Me" verification
- **Better documentation**: OpenXBL has comprehensive API docs
- **Gamerscore data**: Provides scoring metrics not available on PSN


## Technical Implementation Details

### Authentication Flow
---
**Option 1: API Key (Server-to-Server)**
```typescript
const response = await fetch("https://xbl.io/api/v2/player/titleHistory/me", {
  headers: {
    "X-Authorization": process.env.OPENXBL_API_KEY,
    "Accept": "application/json"
  }
});
```

**Option 2: OAuth Flow (User Authentication)**
```typescript
// 1. Redirect user to OpenXBL OAuth
const authUrl = `https://xbl.io/app/auth?app_key=${APP_KEY}&redirect=${CALLBACK_URL}`;

// 2. Handle callback with access token
// 3. Use token for user-specific API calls
```

### Rate Limiting
---
| Tier | Requests/Hour | Cost |
|------|---------------|------|
| Free | 150 | $0 |
| Starter | 1,500 | $5/month |
| Pro | 15,000 | $20/month |
| Enterprise | Custom | Contact |

**Additional Considerations:**
- Microsoft may also rate limit on their backend
- Implement exponential backoff for 429 responses
- Queue requests for bulk imports


## Comparison with Other Platforms

| Aspect | Steam | PlayStation | Xbox |
|--------|-------|-------------|------|
| Auth method | OpenID (official) | About Me verification | OAuth (OpenXBL) |
| Library access | Full | Trophy games only | Full |
| Playtime data | Yes (hours) | No | Partial |
| Achievement data | Yes | Trophies with % | Yes with Gamerscore |
| API stability | Official | Unofficial | Unofficial |
| Rate limits | Published | Community-estimated | 150/hour free |
| Risk level | Low | Medium | Medium |
| UX complexity | Low | High (manual verify) | Low (OAuth) |


## Alternative Approaches Considered

### XAPI.us
---
- **Service**: [xapi.us](https://xapi.us/) - Alternative Xbox Live API
- **Pros**: Simple API, established service
- **Cons**: Less comprehensive than OpenXBL, smaller community
- **Decision**: OpenXBL preferred due to OAuth support and better docs

### Microsoft Graph API
---
- **Approach**: Use official Microsoft Graph API
- **Pros**: Official, stable
- **Cons**: Doesn't expose Xbox gaming data, requires AAD app registration
- **Decision**: Rejected - Graph API doesn't provide gaming endpoints

### Web Scraping Xbox Profiles
---
- **Approach**: Scrape TrueAchievements or Xbox.com
- **Pros**: No API limits
- **Cons**: ToS violations, brittle, legal risk
- **Decision**: Rejected due to legal/ethical concerns


## Risk Assessment

### Technical Risks
---
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| OpenXBL service changes | Low | High | Abstract API client, version pinning |
| Rate limit exceeded | Medium | Low | Request queuing, paid tier upgrade |
| Microsoft blocks OpenXBL | Low | High | Feature flag to disable |
| Data format changes | Medium | Medium | Schema validation, monitoring |

### Business Risks
---
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| OpenXBL pricing changes | Medium | Low | Budget for paid tier |
| Service discontinuation | Low | High | Fallback to manual entry |
| Microsoft legal action | Very Low | High | Clear ToS disclaimer |


## Implementation Recommendation

### Recommended Approach
---
1. Use OpenXBL REST API with API key authentication
2. Implement OAuth flow for user account linking
3. Store XUID in user profile after authentication
4. Fetch title history for full game library
5. Import to `ImportedGame` staging table (reuse existing schema)
6. Match games to IGDB (similar to Steam import)
7. Reuse platform import curation UI

### API Client Strategy
---
Since no official TypeScript wrapper exists:
1. Create thin wrapper around fetch with typed responses
2. Define TypeScript interfaces for OpenXBL responses
3. Implement retry logic with exponential backoff
4. Add request queuing to respect rate limits

### Not Recommended
---
- Storing user Microsoft credentials
- Excessive API polling
- Importing without user curation
- Relying on single API provider without abstraction


## References

- [OpenXBL](https://xbl.io/) - Unofficial Xbox Live API
- [OpenXBL Documentation](https://xbl.io/docs) - API reference
- [OpenXBL Getting Started](https://xbl.io/getting-started) - Authentication guide
- [XAPI](https://xapi.us/) - Alternative Xbox Live API
- [Microsoft XR-013](https://learn.microsoft.com/en-us/gaming/gdk/_content/gc/policies/xr/xr013) - Account linking guidelines

---

_Last updated: January 2025_
