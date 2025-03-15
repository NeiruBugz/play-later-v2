# Database Schema Documentation

This document provides a detailed overview of the database schema used in the PlayLater application. The schema is defined using Prisma ORM and is located in `prisma/schema.prisma`.

## Overview

PlayLater uses a PostgreSQL database with the following main models:

- User
- Game
- BacklogItem
- Review
- Genre
- GameGenre
- Screenshot
- Platform

Additionally, there are authentication-related models managed by NextAuth:

- Account
- Session
- VerificationToken

## Entity Relationship Diagram

```
User 1--* BacklogItem *--1 Game
User 1--* Review *--1 Game
Game 1--* Screenshot
Game *--* Genre (through GameGenre)
```

## Models

### User

Represents a user of the application.

| Field           | Type      | Description                    |
| --------------- | --------- | ------------------------------ |
| id              | String    | Primary key (cuid)             |
| name            | String?   | User's display name            |
| email           | String?   | User's email address (unique)  |
| emailVerified   | DateTime? | When the email was verified    |
| image           | String?   | User's profile image URL       |
| username        | String?   | User's username                |
| steamProfileURL | String?   | User's Steam profile URL       |
| createdAt       | DateTime  | When the user was created      |
| updatedAt       | DateTime  | When the user was last updated |
| deleted         | Boolean   | Soft delete flag               |

Relations:

- One-to-many with Account
- One-to-many with Session
- One-to-many with BacklogItem
- One-to-many with Review
- One-to-many with IgnoredImportedGames

### Game

Represents a video game.

| Field            | Type      | Description                        |
| ---------------- | --------- | ---------------------------------- |
| id               | String    | Primary key (cuid)                 |
| igdbId           | Int       | IGDB database ID (unique)          |
| hltbId           | String?   | HowLongToBeat database ID (unique) |
| title            | String    | Game title                         |
| description      | String?   | Game description                   |
| coverImage       | String?   | Cover image URL                    |
| releaseDate      | DateTime? | Game release date                  |
| mainStory        | Int?      | Hours to complete main story       |
| mainExtra        | Int?      | Hours to complete main + extras    |
| completionist    | Int?      | Hours to complete 100%             |
| steamAppId       | Int?      | Steam application ID               |
| aggregatedRating | Float?    | Aggregated rating score            |
| createdAt        | DateTime  | When the record was created        |
| updatedAt        | DateTime  | When the record was last updated   |
| deleted          | Boolean   | Soft delete flag                   |

Relations:

- One-to-many with BacklogItem
- One-to-many with Review
- One-to-many with Screenshot
- Many-to-many with Genre (through GameGenre)

### BacklogItem

Represents a game in a user's collection.

| Field           | Type              | Description                      |
| --------------- | ----------------- | -------------------------------- |
| id              | String            | Primary key (cuid)               |
| status          | BacklogItemStatus | Current status of the game       |
| platform        | String?           | Platform the game is on          |
| acquisitionType | AcquisitionType   | How the game was acquired        |
| startedAt       | DateTime?         | When the user started playing    |
| completedAt     | DateTime?         | When the user completed the game |
| createdAt       | DateTime          | When the record was created      |
| updatedAt       | DateTime          | When the record was last updated |
| userId          | String            | Foreign key to User              |
| gameId          | String            | Foreign key to Game              |

Relations:

- Many-to-one with User
- Many-to-one with Game

### Review

Represents a user's review of a game.

| Field       | Type     | Description                      |
| ----------- | -------- | -------------------------------- |
| id          | String   | Primary key (cuid)               |
| rating      | Int      | Rating score (0-10)              |
| content     | String?  | Review text content              |
| completedOn | String?  | Platform completed on            |
| createdAt   | DateTime | When the review was created      |
| updatedAt   | DateTime | When the review was last updated |
| userId      | String   | Foreign key to User              |
| gameId      | String   | Foreign key to Game              |

Relations:

- Many-to-one with User
- Many-to-one with Game

### Genre

Represents a game genre.

| Field     | Type     | Description                 |
| --------- | -------- | --------------------------- |
| id        | Int      | Primary key                 |
| name      | String   | Genre name                  |
| createdAt | DateTime | When the record was created |

Relations:

- Many-to-many with Game (through GameGenre)

### GameGenre

Junction table for the many-to-many relationship between Game and Genre.

| Field     | Type     | Description                 |
| --------- | -------- | --------------------------- |
| gameId    | String   | Foreign key to Game         |
| genreId   | Int      | Foreign key to Genre        |
| createdAt | DateTime | When the record was created |

Relations:

- Many-to-one with Game
- Many-to-one with Genre

### Screenshot

Represents a screenshot of a game.

| Field     | Type     | Description                 |
| --------- | -------- | --------------------------- |
| id        | String   | Primary key (cuid)          |
| imageId   | String   | Image identifier            |
| gameId    | String   | Foreign key to Game         |
| createdAt | DateTime | When the record was created |

Relations:

- Many-to-one with Game

### Platform

Represents a gaming platform.

| Field     | Type     | Description                      |
| --------- | -------- | -------------------------------- |
| id        | String   | Primary key (cuid)               |
| name      | String   | Platform name (unique)           |
| createdAt | DateTime | When the record was created      |
| updatedAt | DateTime | When the record was last updated |

### IgnoredImportedGames

Represents games that the user has chosen to ignore during import.

| Field     | Type     | Description                 |
| --------- | -------- | --------------------------- |
| id        | String   | Primary key (cuid)          |
| name      | String   | Game name                   |
| userId    | String   | Foreign key to User         |
| createdAt | DateTime | When the record was created |

Relations:

- Many-to-one with User

## Enums

### BacklogItemStatus

Represents the status of a game in a user's collection.

| Value     | Description                            |
| --------- | -------------------------------------- |
| TO_PLAY   | Game is in backlog, not yet played     |
| PLAYED    | Game has been played but not completed |
| PLAYING   | Game is currently being played         |
| COMPLETED | Game has been completed                |
| WISHLIST  | Game is on the user's wishlist         |

### AcquisitionType

Represents how a game was acquired.

| Value        | Description                             |
| ------------ | --------------------------------------- |
| PHYSICAL     | Physical copy (disc, cartridge, etc.)   |
| DIGITAL      | Digital purchase                        |
| SUBSCRIPTION | Obtained through a subscription service |

## Indexes

The schema includes several indexes to optimize query performance:

- BacklogItem: Indexes on userId, gameId, and status
- Review: Indexes on userId and gameId
- GameGenre: Indexes on gameId and genreId
- Screenshot: Index on gameId
- IgnoredImportedGames: Index on userId

## Authentication Models

These models are used by NextAuth.js for authentication:

### Account

Stores OAuth account information.

### Session

Stores user session information.

### VerificationToken

Stores tokens for email verification.

## Database Migrations

Database migrations are managed using Prisma Migrate. Migration files are stored in the `prisma/migrations` directory.

To create a new migration:

```bash
npx prisma migrate dev --name <migration-name>
```

To apply migrations in production:

```bash
npx prisma migrate deploy
```

## Best Practices

When working with the database schema:

1. Always create migrations for schema changes
2. Add appropriate indexes for frequently queried fields
3. Use transactions for operations that modify multiple records
4. Implement soft deletes where appropriate (using the `deleted` flag)
5. Keep the schema in sync with TypeScript types in `shared/types/`
