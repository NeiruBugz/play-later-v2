# External API Integration

This document provides details about the external APIs integrated with the PlayLater application and how to work with them.

## IGDB (Internet Game Database)

PlayLater integrates with the IGDB API to fetch comprehensive game information, including metadata, cover images, screenshots, and more.

### Configuration

The IGDB API integration is configured in the following files:

- `shared/external-apis/igdb/igdb-client.ts`: Main client for IGDB API
- `shared/external-apis/igdb/client.ts`: Typed API client with specific endpoints
- `shared/external-apis/igdb/query-builder.ts`: Helper for building IGDB API queries
- `shared/external-apis/igdb/utils.ts`: Utility functions for working with IGDB data
- `shared/external-apis/igdb/igdb-actions.ts`: Server actions for IGDB API

### Authentication

IGDB API uses Twitch OAuth for authentication. The application needs to obtain an access token before making API requests.

Required environment variables:

- `IGDB_CLIENT_ID`: Your Twitch application client ID
- `IGDB_CLIENT_SECRET`: Your Twitch application client secret

### API Endpoints

The IGDB client supports the following endpoints:

- Games: Search and retrieve game information
- Covers: Get game cover images
- Screenshots: Get game screenshots
- Genres: Get game genres
- Platforms: Get gaming platforms
- Companies: Get game developers and publishers

### Usage Examples

#### Searching for Games

```typescript
import { searchGames } from 'shared/external-apis/igdb/igdb-actions';

// Search for games with "zelda" in the title
const games = await searchGames('zelda');
```

#### Fetching Game Details

```typescript
import { getGameById } from 'shared/external-apis/igdb/client';

// Get detailed information for a specific game by IGDB ID
const gameDetails = await getGameById(1234);
```

### Rate Limiting

IGDB API has rate limits that need to be respected:

- 4 requests per second
- 8,000 requests per day (for authenticated requests)

The application should implement caching strategies to minimize API calls.

### Data Mapping

When integrating IGDB data with the PlayLater database, the following mappings are used:

| IGDB Field             | PlayLater Field     |
| ---------------------- | ------------------- |
| id                     | igdbId              |
| name                   | title               |
| summary                | description         |
| first_release_date     | releaseDate         |
| aggregated_rating      | aggregatedRating    |
| cover.image_id         | coverImage          |
| screenshots[].image_id | screenshots.imageId |
| genres[].id            | genres.genreId      |

### Error Handling

The IGDB client includes error handling for common issues:

- Authentication failures
- Rate limiting
- Network errors
- Invalid responses

Errors are logged and can be handled by the calling code.

## Future API Integrations

### HowLongToBeat

The database schema includes a `hltbId` field in the Game model, indicating plans to integrate with the HowLongToBeat API for game completion time data.

Implementation steps:

1. Create a new directory in `shared/external-apis/hltb/`
2. Implement API client and utility functions
3. Create server actions for the API
4. Update game creation/update logic to fetch and store HLTB data

### Steam

The database schema includes a `steamAppId` field in the Game model and a `steamProfileURL` field in the User model, indicating plans to integrate with the Steam API.

Potential features:

- Import user's Steam library
- Match Steam games with IGDB data
- Track Steam playtime

Implementation steps:

1. Create a new directory in `shared/external-apis/steam/`
2. Implement API client for Steam Web API
3. Create server actions for user library import
4. Implement matching logic between Steam and IGDB games

## Best Practices

When working with external APIs:

1. **Caching**: Implement caching to reduce API calls and improve performance
2. **Rate Limiting**: Respect API rate limits to avoid being blocked
3. **Error Handling**: Implement robust error handling for API failures
4. **Fallbacks**: Provide fallback mechanisms when APIs are unavailable
5. **Data Validation**: Validate API responses before storing in the database
6. **Typing**: Use TypeScript interfaces to ensure type safety for API responses
7. **Environment Variables**: Store API keys and secrets in environment variables
8. **Logging**: Log API calls and errors for debugging and monitoring
