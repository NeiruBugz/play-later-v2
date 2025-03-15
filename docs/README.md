# PlayLater - Game Backlog Management System

## Overview

PlayLater is a web application designed to help gamers manage their game backlog. It allows users to track games they want to play, are currently playing, or have completed. The application integrates with external game databases to provide comprehensive game information.

## Table of Contents

1. [Architecture](#architecture)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Authentication](#authentication)
5. [Database Schema](#database-schema)
6. [Features](#features)
7. [External APIs](#external-apis)
8. [Development Workflow](#development-workflow)
9. [Deployment](#deployment)
10. [Maintenance and Troubleshooting](#maintenance-and-troubleshooting)

## Architecture

PlayLater follows a modern web application architecture:

- **Frontend**: Next.js with React 19 and Chakra UI for the user interface
- **Backend**: Next.js API routes for server-side logic
- **Database**: PostgreSQL with Prisma ORM for data persistence
- **Authentication**: NextAuth.js for user authentication
- **State Management**: React Query for server state management

The application uses a feature-based architecture, where each major feature has its own directory containing all related components, actions, and queries.

## Tech Stack

- **Framework**: Next.js 15
- **UI Library**: Chakra UI 3
- **Database ORM**: Prisma 6
- **Authentication**: NextAuth 5
- **Data Fetching**: React Query (TanStack Query) 5
- **Form Validation**: Zod
- **Styling**: Emotion
- **Development Tools**: TypeScript, ESLint, Prettier, Husky, Storybook

## Project Structure

```
play-later-v2/
├── app/                  # Next.js app directory
│   ├── api/              # API routes
│   ├── (app)/            # App routes
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── features/             # Feature modules
│   ├── add-game-to-library/ # Add game to library feature
│   │   ├── actions/      # Game server actions
│   │   ├── queries/      # Game database queries
│   │   └── types/        # Game type definitions
│   ├── backlog/          # Backlog management
│   │   ├── actions/      # Backlog server actions
│   │   ├── queries/      # Backlog database queries
│   │   └── types/        # Backlog type definitions
│   └── wishlist/         # Wishlist feature
│       ├── actions/      # Wishlist server actions
│       └── queries/      # Wishlist database queries
├── prisma/               # Database schema and migrations
│   ├── migrations/       # Database migrations
│   ├── client.ts         # Prisma client
│   └── schema.prisma     # Database schema
├── shared/               # Shared code
│   ├── components/       # Reusable components
│   ├── config/           # Configuration
│   ├── external-apis/    # External API integrations
│   ├── lib/              # Utility functions
│   └── types/            # TypeScript types
├── .storybook/           # Storybook configuration
├── auth.ts               # Authentication configuration
└── package.json          # Project dependencies
```

## Authentication

PlayLater uses NextAuth.js for authentication with Google OAuth provider. The authentication flow is configured in `auth.ts` at the root of the project.

Key features:

- JWT-based authentication
- Token refresh mechanism for Google OAuth
- Session management
- User profile information storage

## Database Schema

The database schema is defined in `prisma/schema.prisma` and includes the following main models:

- **User**: User account information
- **Game**: Game details including metadata from external sources
- **BacklogItem**: Represents a game in a user's collection with status
- **Review**: User reviews for games
- **Genre**: Game genres
- **Screenshot**: Game screenshots
- **Platform**: Gaming platforms

The schema includes relationships between these models and enums for status tracking.

## Features

### Backlog Management

The backlog feature allows users to:

- View their game collection
- Add games to their collection
- Update game status (To Play, Playing, Completed)
- Remove games from their collection
- Filter and sort their collection

Implementation files:

- `features/backlog/actions/backlog-actions.ts`
- `features/backlog/actions/create-backlog-item.ts`
- `features/backlog/actions/update-backlog-item.ts`
- `features/backlog/actions/delete-backlog-item.ts`
- `features/backlog/queries/backlog-queries.ts`
- `features/backlog/types/backlog-types.ts`

### Add Game to Library

The add-game-to-library feature allows users to:

- Create new games in the database
- Find existing games
- Add games with backlog items

Implementation files:

- `features/add-game-to-library/actions/create-game-with-backlog-item.ts`
- `features/add-game-to-library/queries/game-queries.ts`
- `features/add-game-to-library/types/game-types.ts`

### Wishlist

The wishlist feature allows users to:

- Add games to their wishlist
- Move games from wishlist to collection
- Remove games from wishlist

Implementation files:

- `features/wishlist/actions/wishlist-actions.ts`

## External APIs

### IGDB API

PlayLater integrates with the IGDB (Internet Game Database) API to fetch game information. The integration is implemented in `shared/external-apis/igdb/`.

Key files:

- `igdb-client.ts`: Client for making API requests
- `client.ts`: Typed API client
- `query-builder.ts`: Helper for building IGDB API queries

## Development Workflow

### Setup

1. Clone the repository
2. Install dependencies with `npm install` or `bun install`
3. Set up environment variables (see `.env.example`)
4. Start the development server with `npm run dev` or `bun dev`

### Environment Variables

Required environment variables:

- `POSTGRES_PRISMA_URL`: PostgreSQL connection string
- `POSTGRES_URL_NON_POOLING`: PostgreSQL direct connection string
- `AUTH_GOOGLE_ID`: Google OAuth client ID
- `AUTH_GOOGLE_SECRET`: Google OAuth client secret
- `AUTH_SECRET`: NextAuth secret
- `IGDB_CLIENT_ID`: IGDB API client ID
- `IGDB_CLIENT_SECRET`: IGDB API client secret

### Database Migrations

To create and apply database migrations:

```bash
# Generate a migration
npx prisma migrate dev --name <migration-name>

# Apply migrations
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### Storybook

The project uses Storybook for component development and documentation:

```bash
# Start Storybook
npm run storybook
```

## Deployment

The application is configured for deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy

## Maintenance and Troubleshooting

### Common Issues

- **Authentication Issues**: Check OAuth configuration and token refresh mechanism
- **Database Connection Issues**: Verify connection strings and database availability
- **API Rate Limiting**: IGDB API has rate limits, implement caching if necessary

### Performance Optimization

- Use React Query's caching capabilities
- Implement server-side rendering for data-heavy pages
- Optimize database queries with proper indexes

### Security Considerations

- Keep dependencies updated
- Use environment variables for sensitive information
- Implement proper input validation
- Follow OAuth best practices

## Extending the Application

### Adding a New Feature

1. Create a new directory in `features/`
2. Implement actions, queries, and components
3. Add routes in the `app/` directory
4. Update navigation components

### Integrating a New External API

1. Create a new directory in `shared/external-apis/`
2. Implement API client and utility functions
3. Create actions for interacting with the API
4. Add necessary environment variables

### Adding New Database Models

1. Update `prisma/schema.prisma`
2. Generate and apply migrations
3. Update TypeScript types in `shared/types/`
4. Implement queries and actions for the new models
