## Prisma schema reference

A concise reference of the Prisma data model used by Play Later v2. This mirrors `prisma/schema.prisma` and summarizes models, fields, relations, and indexes.

Updated alongside `prisma/schema.prisma`. Validate with:

```bash
npx prisma validate --schema prisma/schema.prisma
```

### Overview

- Database: PostgreSQL
- Auth: NextAuth models (`Account`, `Session`, `VerificationToken`, `User`)
- App models: `Game`, `BacklogItem`, `Review`, `ImportedGame`, `IgnoredImportedGames`
- Enums: `Storefront`, `BacklogItemStatus`, `AcquisitionType`

### Entity-Relationship diagram

```mermaid
erDiagram
  User ||--o{ Account : has
  User ||--o{ Session : has
  User ||--o{ BacklogItem : has
  User ||--o{ Review : has
  User ||--o{ ImportedGame : has
  User ||--o{ IgnoredImportedGames : has
  Game ||--o{ BacklogItem : has
  Game ||--o{ Review : has

  User {
    String id PK
    String? email
    String? username
  }
  Game {
    String id PK
    Int igdbId UNIQUE
  }
  BacklogItem {
    Int id PK
    String userId FK
    String gameId FK
  }
```

### Enums

- **Storefront**: `STEAM`, `PLAYSTATION`, `XBOX`
- **BacklogItemStatus**: `TO_PLAY`, `PLAYED`, `PLAYING`, `COMPLETED`, `WISHLIST`
- **AcquisitionType**: `PHYSICAL`, `DIGITAL`, `SUBSCRIPTION`

### Models (Auth)

#### Account

Linked OAuth/OIDC account for a `User` (managed by NextAuth).

| Field             | Type    | Attributes            | Notes                         |
| ----------------- | ------- | --------------------- | ----------------------------- |
| id                | String  | @id, @default(cuid()) | Primary key                   |
| userId            | String  |                       | FK to `User.id`               |
| type              | String  |                       | Provider account type         |
| provider          | String  |                       | Provider id (e.g. google)     |
| providerAccountId | String  |                       | Provider-side user identifier |
| refresh_token     | String? | @db.Text              | Optional refresh token        |
| access_token      | String? | @db.Text              | Optional access token         |
| expires_at        | Int?    |                       | Token expiry (epoch seconds)  |
| token_type        | String? |                       | Token type                    |
| scope             | String? |                       | Scope list                    |
| id_token          | String? | @db.Text              | Optional id token             |
| session_state     | String? |                       | Provider session state        |

Relations and indexes:

- `user` → `User` (onDelete: Cascade)
- Unique: `(provider, providerAccountId)`

#### Session

Active session for a `User` (managed by NextAuth).

| Field        | Type     | Attributes            | Notes           |
| ------------ | -------- | --------------------- | --------------- |
| id           | String   | @id, @default(cuid()) | Primary key     |
| sessionToken | String   | @unique               | Opaque token    |
| userId       | String   |                       | FK to `User.id` |
| expires      | DateTime |                       | Expiration      |

Relations:

- `user` → `User` (onDelete: Cascade)

#### VerificationToken

Email verification / magic link token (managed by NextAuth).

| Field      | Type     | Attributes |
| ---------- | -------- | ---------- |
| identifier | String   |            |
| token      | String   | @unique    |
| expires    | DateTime |            |

Indexes:

- Unique composite `(identifier, token)`

#### User

Application user record enriched with optional Steam fields.

| Field            | Type      | Attributes            | Notes                   |
| ---------------- | --------- | --------------------- | ----------------------- |
| id               | String    | @id, @default(cuid()) | Primary key             |
| name             | String?   |                       | Display name            |
| email            | String?   | @unique               | Optional email          |
| emailVerified    | DateTime? |                       | When email was verified |
| image            | String?   |                       | Avatar URL              |
| username         | String?   |                       | Public handle           |
| steamProfileURL  | String?   |                       | Steam profile URL       |
| steamId64        | String?   |                       | SteamID64               |
| steamUsername    | String?   |                       | Steam username          |
| steamAvatar      | String?   |                       | Steam avatar URL        |
| steamConnectedAt | DateTime? |                       | When Steam was linked   |

Relations:

- `Account[]`, `Session[]`, `BacklogItem[]`, `Review[]`, `ImportedGame[]`, `IgnoredImportedGames[]`

### Models (Application)

#### Game

Canonical game entity sourced primarily from IGDB and optionally HLTB/Steam.

| Field         | Type      | Attributes            | Notes          |
| ------------- | --------- | --------------------- | -------------- |
| id            | String    | @id, @default(cuid()) | Primary key    |
| igdbId        | Int       | @unique               | IGDB id        |
| hltbId        | String?   | @unique               | HLTB id        |
| title         | String    |                       |                |
| description   | String?   |                       | Markdown/plain |
| coverImage    | String?   |                       | URL            |
| releaseDate   | DateTime? |                       |                |
| mainStory     | Int?      |                       | Minutes        |
| mainExtra     | Int?      |                       | Minutes        |
| completionist | Int?      |                       | Minutes        |
| createdAt     | DateTime  | @default(now())       |                |
| updatedAt     | DateTime  | @updatedAt            |                |
| steamAppId    | Int?      |                       | Steam app id   |

Data sourcing:

- IGDB: `igdbId`, `title`, `description`, `coverImage`, `releaseDate`
- HLTB: `hltbId`, `mainStory`, `mainExtra`, `completionist`
- Steam: `steamAppId`
- Internal: `id`, `createdAt`, `updatedAt`

Relations:

- `backlogItems` → `BacklogItem[]`
- `Review[]`

#### BacklogItem

A user's backlog entry for a specific `Game`.

| Field           | Type              | Attributes                     | Notes           |
| --------------- | ----------------- | ------------------------------ | --------------- |
| id              | Int               | @id, @default(autoincrement()) | Primary key     |
| status          | BacklogItemStatus | @default(TO_PLAY)              |                 |
| createdAt       | DateTime          | @default(now())                |                 |
| updatedAt       | DateTime          | @updatedAt                     |                 |
| platform        | String?           |                                | e.g., PC, PS5   |
| userId          | String            |                                | FK to `User.id` |
| acquisitionType | AcquisitionType   | @default(DIGITAL)              |                 |
| gameId          | String            |                                | FK to `Game.id` |
| startedAt       | DateTime?         |                                |                 |
| completedAt     | DateTime?         |                                |                 |

Relations and indexes:

- `game` → `Game` (onDelete: Cascade)
- `User` → `User`
- Indexes: `(userId, status)`, `(userId, platform)`, `(userId, createdAt)`, `(gameId)`

#### Review

A user-authored review for a `Game`.

| Field       | Type     | Attributes                     | Notes                            |
| ----------- | -------- | ------------------------------ | -------------------------------- |
| id          | Int      | @id, @default(autoincrement()) | Primary key                      |
| rating      | Int      | @default(0)                    | 0–10                             |
| content     | String?  |                                | Optional text                    |
| createdAt   | DateTime | @default(now())                |                                  |
| updatedAt   | DateTime | @updatedAt                     |                                  |
| completedOn | String?  |                                | Optional user-defined date label |
| userId      | String   |                                | FK to `User.id`                  |
| gameId      | String   |                                | FK to `Game.id`                  |

Relations:

- `User` → `User`
- `Game` → `Game`

#### IgnoredImportedGames

Names intentionally excluded from import for a `User`.

| Field  | Type   | Attributes            |
| ------ | ------ | --------------------- |
| id     | String | @id, @default(cuid()) |
| name   | String |                       |
| userId | String |                       |

Relations:

- `User` → `User`

#### ImportedGame

A game imported from an external storefront (e.g., Steam).

| Field            | Type       | Attributes            | Notes                |
| ---------------- | ---------- | --------------------- | -------------------- |
| id               | String     | @id, @default(cuid()) | Primary key          |
| name             | String     |                       | Storefront game name |
| storefront       | Storefront |                       | Source storefront    |
| storefrontGameId | String?    |                       | Storefront app id    |
| playtime         | Int?       | @default(0)           | Minutes              |
| img_icon_url     | String?    |                       | Storefront-specific  |
| img_logo_url     | String?    |                       | Storefront-specific  |
| createdAt        | DateTime   | @default(now())       |                      |
| updatedAt        | DateTime   | @updatedAt            |                      |
| deletedAt        | DateTime?  |                       | Soft delete          |
| userId           | String     |                       | FK to `User.id`      |

Relations and indexes:

- `User` → `User`
- Indexes: `(userId, deletedAt)`, `(storefrontGameId)`

### Relation summary

- `User` 1—\* `Account`, `Session`, `BacklogItem`, `Review`, `ImportedGame`, `IgnoredImportedGames`
- `Game` 1—\* `BacklogItem`, `Review`
- `BacklogItem` _—1 `User`, _—1 `Game`
- `Review` _—1 `User`, _—1 `Game`
- `ImportedGame` \*—1 `User`
- `IgnoredImportedGames` \*—1 `User`

### Notes

- Timestamps use `now()` and `@updatedAt` where appropriate.
- Cascade deletion is applied on `Account.user`, `Session.user`, and `BacklogItem.game` relations.
- Steam-related fields on `User` are optional to support multi-provider auth.
