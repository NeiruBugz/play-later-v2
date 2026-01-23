# ImportStatusToast Usage Guide

This file demonstrates how to use the Steam import status toast notification utilities.

## Available Functions

```typescript
import {
  showSyncStartedToast,
  showSyncCompletedToast,
  showSyncFailedToast,
  showSyncAlreadyInProgressToast,
  showImportStatusToast,
} from "@/features/steam-import";
```

## Basic Usage

### Sync Started

```typescript
// Default message
showSyncStartedToast();
// Shows: "Steam library sync started"
// Description: "This may take a few minutes. We'll notify you when it's complete."

// Custom message
showSyncStartedToast({
  description: "Fetching your Steam games...",
  duration: 3000, // Optional: custom duration in milliseconds
});
```

### Sync Completed

```typescript
// Show success with game count
showSyncCompletedToast(25);
// Shows: "Steam library sync completed"
// Description: "25 games imported successfully."

// With custom options
showSyncCompletedToast(10, {
  description: "Your library has been updated!",
  duration: 6000,
});
```

### Sync Failed

```typescript
// Default error message
showSyncFailedToast();
// Shows: "Steam library sync failed"
// Description: "Please try again or contact support if the issue persists."

// With specific error message
showSyncFailedToast("Connection timeout while fetching games");

// With custom options
showSyncFailedToast(undefined, {
  description: "An unexpected error occurred. Please try again.",
  duration: 8000,
});
```

### Sync Already In Progress

```typescript
// Default message
showSyncAlreadyInProgressToast();
// Shows: "Sync already in progress"
// Description: "A Steam library sync is currently running. Please wait for it to complete."

// Custom message
showSyncAlreadyInProgressToast({
  description: "Please wait while we complete the current sync.",
});
```

### Generic Import Status

```typescript
// Info toast (default)
showImportStatusToast("Processing your Steam library...");

// Success toast
showImportStatusToast("Import queue created successfully", "success");

// Error toast
showImportStatusToast("Failed to connect to Steam API", "error");

// Warning toast
showImportStatusToast("Some games could not be imported", "warning", {
  description: "Check your Steam privacy settings.",
  duration: 7000,
});
```

## Integration Examples

### In a Server Action

```typescript
"use server";

import { authorizedActionClient } from "@/shared/lib/safe-action";
import { triggerBackgroundSyncSchema } from "../schemas";

export const triggerBackgroundSync = authorizedActionClient
  .schema(triggerBackgroundSyncSchema)
  .action(async ({ ctx: { userId } }) => {
    // Server action logic here
    const result = await steamSyncService.start(userId);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.data };
  });
```

### In a Component

```typescript
"use client";

import { useAction } from "next-safe-action/hooks";
import { triggerBackgroundSync } from "../server-actions";
import {
  showSyncStartedToast,
  showSyncCompletedToast,
  showSyncFailedToast,
} from "./import-status-toast";

export function SyncButton() {
  const { execute, isPending } = useAction(triggerBackgroundSync, {
    onSuccess: (result) => {
      if (result.data?.success) {
        showSyncCompletedToast(result.data.gameCount);
      }
    },
    onError: (error) => {
      showSyncFailedToast(error.serverError?.message);
    },
  });

  const handleSync = async () => {
    showSyncStartedToast();
    await execute();
  };

  return (
    <button onClick={handleSync} disabled={isPending}>
      {isPending ? "Syncing..." : "Sync Steam Library"}
    </button>
  );
}
```

### In ImportPathSelector (Future Integration)

```typescript
import {
  showSyncStartedToast,
  showSyncCompletedToast,
  showSyncFailedToast,
  showSyncAlreadyInProgressToast,
} from "./import-status-toast";

const handleBackgroundSync = async () => {
  if (isSyncing) {
    showSyncAlreadyInProgressToast();
    return;
  }

  showSyncStartedToast();

  try {
    const result = await fetch("/api/steam/background-sync", {
      method: "POST",
    });

    const data = await result.json();

    if (result.ok) {
      showSyncCompletedToast(data.imported);
    } else {
      showSyncFailedToast(data.error);
    }
  } catch (error) {
    showSyncFailedToast("Network error. Please try again.");
  }
};
```

## Notes

- All toast functions use the Sonner library under the hood
- The Toaster component is already configured in `app/(protected)/layout.tsx`
- Toast durations are set appropriately based on severity:
  - Info/Success: 5 seconds
  - Warning: 4 seconds
  - Error: 6 seconds
- You can override any duration using the `options` parameter
