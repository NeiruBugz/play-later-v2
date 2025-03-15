# Steam Import Feature

This feature allows users to import games from their Steam library into their Play Later backlog.

## Overview

The Steam Import feature provides a seamless way for users to:

1. View their Steam games by entering their Steam ID
2. Import all games or only new games (not already in their backlog)
3. Track the progress of ongoing imports
4. View import history and details about failed imports

## Components

### SteamImport

The main component that orchestrates the entire import flow. It includes:

- Steam ID input
- Game listing with search and sorting
- Import buttons
- Progress tracking

### SteamIdInput

Allows users to enter their Steam ID or vanity URL. Includes validation and a "View Games" button.

### BulkImportButton

Provides two import options:

- **Import New Only**: Imports only games that aren't already in the user's backlog
- **Import All**: Imports all games from the user's Steam library

### ImportProgress

Displays the progress of an ongoing import job, including:

- Current status (pending, processing, completed, failed)
- Progress bar for ongoing imports
- Statistics about imported, skipped, and failed games
- Timestamps for when the job started and completed
- Error messages if applicable
- Visual indicator for "New Games Only" imports

### ImportHistory

Shows a history of all import jobs for the current user, with:

- Accordion-based list of all import jobs
- Status badges and timestamps
- Detailed progress information when expanded
- Button to view failed imports for each job

### FailedImportsDialog

A modal dialog that displays details about failed imports for a specific job, including:

- Game name and Steam App ID
- Reason for failure
- Error message (if available)
- When the import was attempted

## Server Actions

### startBulkImport

Initiates a new import job with options:

- `steamId`: The Steam ID to import games from
- `newOnly`: Whether to import only games not already in the backlog

### getBulkImportStatus

Retrieves the current status of an import job.

### getImportJobs

Fetches all import jobs for the current user.

### getFailedImports

Retrieves all failed imports for a specific job.

### processBulkImport

Background process that handles the actual import of games:

1. Fetches games from Steam
2. Filters games if `newOnly` is true
3. Processes games in batches
4. Updates job status and statistics

### processGame

Processes a single game from Steam:

1. Checks if the game is already in the user's backlog
2. Checks if the game is on the user's ignored list
3. Searches for the game in IGDB
4. Creates a new game entry if needed
5. Adds the game to the user's backlog
6. Sets the appropriate status based on playtime

## Hooks

### useBulkImport

Provides functionality to start a new import job and track its status.

### useImportJobStatus

Tracks the status of a specific import job with automatic polling for updates.

### useImportJobs

Fetches all import jobs for the current user.

### useFailedImports

Retrieves all failed imports for a specific job.

### useGetSteamGames

Fetches games from the user's Steam library with pagination, sorting, and search.

## Database Models

### SteamImportJob

Tracks the status and progress of an import job:

- `userId`: The user who initiated the import
- `steamId`: The Steam ID being imported from
- `status`: Current status (PENDING, PROCESSING, COMPLETED, FAILED)
- `totalGames`: Total number of games to process
- `processedGames`: Number of games processed so far
- `importedGames`: Number of games successfully imported
- `skippedGames`: Number of games skipped (already in backlog)
- `failedGames`: Number of games that failed to import
- `error`: Error message if the job failed
- `startedAt`: When the job started processing
- `completedAt`: When the job finished processing
- `importNewOnly`: Whether to import only new games

### FailedImport

Records details about a failed import:

- `userId`: The user who initiated the import
- `steamImportJobId`: The associated import job
- `steamAppId`: The Steam App ID of the game
- `gameName`: The name of the game
- `reason`: Why the import failed
- `errorMessage`: Detailed error message
- `playtime`: Playtime in minutes
- `attemptedAt`: When the import was attempted

## Implementation Details

### Game Status Determination

The import process automatically sets the game status based on playtime:

- If playtime > 0: Status is set to `PLAYED`
- Otherwise: Status is set to `TO_PLAY`

### Filtering Logic

When importing only new games, the system:

1. Fetches all games from Steam
2. Queries the database for games already in the user's backlog
3. Filters out games that are already in the backlog
4. Processes only the remaining games

### Error Handling

The import process includes comprehensive error handling:

1. Each game is processed independently
2. Failed imports are recorded with detailed reasons
3. The overall job continues even if individual games fail
4. Users can view failed imports and their reasons

## Usage

1. Navigate to the Settings page
2. Go to the "Import Games" tab
3. Enter your Steam ID or vanity URL
4. Click "View Games" to see your Steam library
5. Click "Import New Only" or "Import All" to start importing
6. Monitor the progress in real-time
7. View import history and details in the "Import History" tab
