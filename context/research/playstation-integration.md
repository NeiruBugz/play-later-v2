# PlayStation Profile Integration Research

_Research document covering PSN integration options for SavePoint, focusing on trophy-based game import without official Sony OAuth._

---

## Overview

PlayStation Network (PSN) does not offer a public OAuth API for third-party applications. This document explores unofficial methods used by community services like PSNProfiles and TrueTrophies to access PSN data.


## How PSN Verification Works (Without Sony OAuth)

Services like PSNProfiles use the "About Me" field as a verification mechanism:

```
1. User enters PSN username
2. App generates unique code (e.g., "SP-a8f3k2")
3. User adds code to PlayStation "About Me" section
4. App reads profile via unofficial API, verifies code exists
5. Account verified -> can import trophy data
```

This approach:
- Proves ownership without OAuth
- Requires no Sony partnership
- Is the de facto standard for PSN community sites


## Recommended Implementation: psn-api (TypeScript)

### Library Details
---
- **Repository**: [achievements-app/psn-api](https://github.com/achievements-app/psn-api)
- **Language**: TypeScript (native fit for SavePoint)
- **Cost**: Free (requires dedicated PSN account for API access)
- **Maintenance**: Actively maintained, 500+ GitHub stars

### Available Data
---
| Endpoint | Data | Use Case |
|----------|------|----------|
| `getProfileFromUserName` | Avatar, aboutMe, languages | Verification |
| `getUserTitles` | Games with trophies, completion % | Import candidates |
| `getTitleTrophies` | Individual trophy details | Optional enrichment |

### What We Can Import
---
- Games where user has earned at least one trophy
- Trophy completion percentage per game
- Last played timestamps (trophy-based)
- Platform (PS4/PS5) per game

### Limitations
---
- **No full library access**: Only games with earned trophies are visible
- **No purchase history**: Cannot see owned-but-unplayed games
- **No playtime data**: Sony doesn't expose hours played via any API


## Technical Implementation Details

### Authentication Flow
---
The psn-api library requires an NPSSO token (64-character code) obtained from Sony's SSO:

```typescript
import { exchangeNpssoForCode, exchangeCodeForAccessToken } from "psn-api";

// One-time setup: Get NPSSO from https://ca.account.sony.com/api/v1/ssocookie
const npsso = process.env.PSN_NPSSO;

// Exchange for access token
const accessCode = await exchangeNpssoForCode(npsso);
const authorization = await exchangeCodeForAccessToken(accessCode);

// Use authorization for API calls
const profile = await getProfileFromUserName(authorization, "username");
```

### Token Management
---
- Access tokens expire (typically 1 hour)
- Refresh tokens last longer but also expire
- Recommendation: Store tokens in database, refresh proactively

### Rate Limiting
---
- No official limits documented
- Community recommendation: 300 requests per 15 minutes
- Risk: Excessive API use may lead to account suspension
- Mitigation: Queue requests, implement exponential backoff


## UX Considerations

### "About Me" Field Access
---
The "About Me" field requires initial edit from a PlayStation console:
1. User must have accessed Profile settings at least once
2. Cannot be edited via web or mobile app initially

**Workaround for users without console access:**
- Borrow a friend's PlayStation briefly
- Use PlayStation Remote Play on PC/Mac
- Note: This is a one-time setup requirement

### Verification Flow UX
---
```
[Enter PSN Username] -> [Generate Verification Code]
                              |
                              v
              "Add 'SP-a8f3k2' to your About Me"
              [Link to PlayStation settings]
                              |
                              v
                    [Verify My Account]
                              |
                       Success/Retry
```


## Comparison with Steam Integration

| Aspect | Steam | PlayStation |
|--------|-------|-------------|
| Auth method | OpenID (official) | About Me verification |
| Library access | Full owned games | Trophy games only |
| Playtime data | Yes (hours) | No |
| API stability | Official, stable | Unofficial, may break |
| Rate limits | Published | Community-estimated |
| Risk level | Low | Medium (account suspension possible) |


## Alternative Approaches Considered

### PSNAWP (Python)
---
- **Repository**: [isFakeAccount/psnawp](https://github.com/isFakeAccount/psnawp)
- **Pros**: More comprehensive, well-documented
- **Cons**: Python (would require separate service or Lambda)
- **Decision**: Rejected in favor of native TypeScript solution

### Web Scraping
---
- **Approach**: Scrape PSNProfiles or TrueTrophies
- **Pros**: Richer data, already curated
- **Cons**: ToS violations, brittle, slow
- **Decision**: Rejected due to legal/ethical concerns


## Risk Assessment

### Technical Risks
---
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| API changes break integration | Medium | High | Version pinning, monitoring |
| Rate limit exceeded | Low | Medium | Request queuing, backoff |
| Token expiration issues | Medium | Low | Proactive refresh logic |

### Business Risks
---
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Sony blocks API access | Low | High | Feature flag to disable |
| User account suspension | Very Low | Medium | Conservative rate limits |
| Sony legal action | Very Low | High | Clear ToS disclaimer |


## Implementation Recommendation

### Recommended Approach
---
1. Use psn-api library for TypeScript integration
2. Create dedicated PSN account for API access (not user accounts)
3. Implement "About Me" verification flow
4. Store verified PSN username in user profile
5. Import trophy-bearing games to `ImportedGame` staging table
6. Reuse Steam import curation UI for game selection

### Not Recommended
---
- Storing user PSN credentials
- Excessive API polling
- Importing without user curation


## References

- [psn-api (npm)](https://github.com/achievements-app/psn-api) - TypeScript PSN API wrapper
- [PSNAWP Documentation](https://psnawp.readthedocs.io/) - aboutMe field confirmation
- [PSN Leaderboard API](https://www.psnleaderboard.com/api/) - psnAuthUser verification pattern
- [PSNProfiles Forum](https://forum.psnprofiles.com/topic/111175-about-me-code/) - User verification process

---

_Last updated: January 2025_
