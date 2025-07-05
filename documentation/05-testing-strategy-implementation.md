# 05 - Testing Strategy Implementation

## Problem Statement

The codebase has **critically low test coverage** (<5%) with only one test file for the entire application. This creates significant risks for refactoring, feature development, and maintaining code quality as the application scales.

### Current Testing Issues

#### ❌ Minimal Test Coverage

```typescript
// Only test in entire codebase:
// features/manage-backlog-item/edit-backlog-item/server-actions/action.test.ts

describe("editBacklogItem", () => {
  // Only 4 basic test cases for one server action
  // No domain service tests
  // No component tests
  // No integration tests
  // No error handling tests
});
```

#### ❌ Testing Infrastructure Gaps

- **No test data factories**: Each test manually creates test data
- **No domain service testing**: Core business logic untested
- **No component testing**: UI behavior untested
- **No integration testing**: End-to-end workflows untested
- **No error scenario testing**: Error handling paths untested

#### ❌ Development Workflow Issues

- **No CI/CD testing**: Changes deployed without automated validation
- **Manual testing only**: Relies on human testing for all scenarios
- **Regression risks**: No safety net for refactoring
- **Slow development**: Developers afraid to change code

## Comprehensive Testing Strategy

### 1. Testing Pyramid Architecture

```
                 🔺 E2E Tests (5%)
                /   \
               /     \
              /       \
             /         \
        🔶 Integration (15%)
           /           \
          /             \
         /               \
        /                 \
   🟢 Unit Tests (80%)
```

### Target Coverage Goals

- **Unit Tests**: 80% of codebase (Domain services, Server actions, Utilities)
- **Integration Tests**: 15% of codebase (API routes, Database operations, External services)
- **E2E Tests**: 5% of codebase (Critical user journeys)

### 2. Enhanced Testing Infrastructure

#### Vitest Configuration (Enhanced)

```typescript
// vitest.config.ts (Enhanced)
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup/global.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '.next/',
        'coverage/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/migrations/**',
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
        // Specific thresholds for critical modules
        'domain/**': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
      },
    },
    // Test isolation
    isolate: true,
    // Parallel execution
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
      },
    },
    // Test timeout
    testTimeout: 10000,
    // Watch mode exclusions
    watchExclude: [
      'node_modules/**',
      '.next/**',
      'coverage/**',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

#### Database Testing Setup

```typescript
// test/setup/database.ts
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { randomUUID } from 'crypto';

let prisma: PrismaClient;

export const setupTestDatabase = async () => {
  // Create unique test database
  const testDbName = `test_db_${randomUUID().replace(/-/g, '')}`;
  const databaseUrl = `postgresql://test:test@localhost:5432/${testDbName}`;

  // Set environment variable
  process.env.DATABASE_URL = databaseUrl;

  // Create test database
  execSync(`createdb ${testDbName}`, { stdio: 'ignore' });

  // Run migrations
  execSync('npx prisma migrate deploy', {
    stdio: 'ignore',
    env: { ...process.env, DATABASE_URL: databaseUrl }
  });

  // Create Prisma client
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  return prisma;
};

export const cleanupTestDatabase = async () => {
  if (prisma) {
    await prisma.$disconnect();

    // Extract database name from URL
    const dbName = process.env.DATABASE_URL?.split('/').pop();
    if (dbName) {
      execSync(`dropdb ${dbName}`, { stdio: 'ignore' });
    }
  }
};

export const resetTestDatabase = async () => {
  if (prisma) {
    // Clear all tables while preserving schema
    const tableNames = await prisma.$queryRaw<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `;

    for (const { tablename } of tableNames) {
      if (tablename !== '_prisma_migrations') {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE`);
      }
    }
  }
};

// Export singleton instance
export { prisma as testDb };
```

#### Test Data Factories

```typescript
// test/factories/user.factory.ts
import { User } from '@prisma/client';
import { testDb } from '../setup/database';

export interface UserFactoryOptions {
  email?: string;
  name?: string;
  username?: string;
  steamId64?: string;
  steamUsername?: string;
}

export const createUser = async (options: UserFactoryOptions = {}): Promise<User> => {
  const defaultData = {
    email: `user-${Date.now()}@example.com`,
    name: `Test User ${Date.now()}`,
    username: `testuser${Date.now()}`,
    ...options,
  };

  return await testDb.user.create({
    data: defaultData,
  });
};

export const createUsers = async (count: number, options: UserFactoryOptions = {}): Promise<User[]> => {
  const users = [];
  for (let i = 0; i < count; i++) {
    users.push(await createUser({
      ...options,
      email: `user-${Date.now()}-${i}@example.com`,
      username: `testuser${Date.now()}${i}`,
    }));
  }
  return users;
};
```

```typescript
// test/factories/game.factory.ts
import { Game, BacklogItem, Review } from '@prisma/client';
import { testDb } from '../setup/database';

export interface GameFactoryOptions {
  title?: string;
  igdbId?: number;
  description?: string;
  coverImage?: string;
}

export const createGame = async (options: GameFactoryOptions = {}): Promise<Game> => {
  const defaultData = {
    title: `Test Game ${Date.now()}`,
    igdbId: Math.floor(Math.random() * 1000000),
    description: 'A test game for testing purposes',
    ...options,
  };

  return await testDb.game.create({
    data: defaultData,
  });
};

export interface BacklogItemFactoryOptions {
  userId: string;
  gameId: string;
  status?: 'TO_PLAY' | 'PLAYING' | 'COMPLETED' | 'WISHLIST';
  platform?: string;
  acquisitionType?: 'DIGITAL' | 'PHYSICAL' | 'SUBSCRIPTION';
}

export const createBacklogItem = async (options: BacklogItemFactoryOptions): Promise<BacklogItem> => {
  const defaultData = {
    status: 'TO_PLAY' as const,
    platform: 'PC',
    acquisitionType: 'DIGITAL' as const,
    ...options,
  };

  return await testDb.backlogItem.create({
    data: defaultData,
  });
};

export interface ReviewFactoryOptions {
  userId: string;
  gameId: string;
  rating?: number;
  content?: string;
}

export const createReview = async (options: ReviewFactoryOptions): Promise<Review> => {
  const defaultData = {
    rating: 8,
    content: 'A great game for testing!',
    ...options,
  };

  return await testDb.review.create({
    data: defaultData,
  });
};
```

### 3. Domain Service Testing Templates

#### Example: BacklogItemService Tests

```typescript
// domain/backlog-item/service.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BacklogItemService } from './service';
import { setupTestDatabase, cleanupTestDatabase, resetTestDatabase, testDb } from '../../test/setup/database';
import { createUser, createGame, createBacklogItem } from '../../test/factories';
import { ValidationError, NotFoundError, AuthenticationError } from '../shared/errors';

describe('BacklogItemService', () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('create', () => {
    it('should create a backlog item successfully', async () => {
      const user = await createUser();
      const game = await createGame();

      const result = await BacklogItemService.create({
        backlogItem: {
          backlogStatus: 'TO_PLAY',
          acquisitionType: 'DIGITAL',
          platform: 'PC',
        },
        userId: user.id,
        gameId: game.id,
      }, user.id);

      expect(result.isSuccess).toBe(true);

      const backlogItem = await testDb.backlogItem.findFirst({
        where: { userId: user.id, gameId: game.id },
      });

      expect(backlogItem).toBeTruthy();
      expect(backlogItem?.status).toBe('TO_PLAY');
      expect(backlogItem?.platform).toBe('PC');
    });

    it('should return validation error for invalid input', async () => {
      const user = await createUser();

      const result = await BacklogItemService.create({
        backlogItem: {
          backlogStatus: 'INVALID_STATUS' as any,
          acquisitionType: 'DIGITAL',
          platform: 'PC',
        },
        userId: user.id,
        gameId: '', // Invalid game ID
      }, user.id);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ValidationError);
    });

    it('should handle database constraints', async () => {
      const user = await createUser();
      const game = await createGame();

      // Create first backlog item
      await createBacklogItem({
        userId: user.id,
        gameId: game.id,
        status: 'TO_PLAY',
      });

      // Try to create duplicate
      const result = await BacklogItemService.create({
        backlogItem: {
          backlogStatus: 'PLAYING',
          acquisitionType: 'DIGITAL',
          platform: 'PC',
        },
        userId: user.id,
        gameId: game.id,
      }, user.id);

      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('already exists');
    });
  });

  describe('delete', () => {
    it('should delete backlog item successfully', async () => {
      const user = await createUser();
      const game = await createGame();
      const backlogItem = await createBacklogItem({
        userId: user.id,
        gameId: game.id,
      });

      const result = await BacklogItemService.delete(backlogItem.id, user.id);

      expect(result.isSuccess).toBe(true);

      const deletedItem = await testDb.backlogItem.findUnique({
        where: { id: backlogItem.id },
      });

      expect(deletedItem).toBeNull();
    });

    it('should return not found error for non-existent item', async () => {
      const user = await createUser();

      const result = await BacklogItemService.delete(999999, user.id);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(NotFoundError);
    });

    it('should return authorization error for wrong user', async () => {
      const user1 = await createUser();
      const user2 = await createUser();
      const game = await createGame();
      const backlogItem = await createBacklogItem({
        userId: user1.id,
        gameId: game.id,
      });

      const result = await BacklogItemService.delete(backlogItem.id, user2.id);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(AuthenticationError);
      expect(result.error.message).toContain("don't have permission");
    });
  });

  describe('update', () => {
    it('should update backlog item successfully', async () => {
      const user = await createUser();
      const game = await createGame();
      const backlogItem = await createBacklogItem({
        userId: user.id,
        gameId: game.id,
        status: 'TO_PLAY',
      });

      const result = await BacklogItemService.update({
        id: backlogItem.id,
        status: 'COMPLETED',
        platform: 'PlayStation 5',
        completedAt: new Date(),
      }, user.id);

      expect(result.isSuccess).toBe(true);

      const updatedItem = await testDb.backlogItem.findUnique({
        where: { id: backlogItem.id },
      });

      expect(updatedItem?.status).toBe('COMPLETED');
      expect(updatedItem?.platform).toBe('PlayStation 5');
      expect(updatedItem?.completedAt).toBeTruthy();
    });

    it('should validate ownership before update', async () => {
      const user1 = await createUser();
      const user2 = await createUser();
      const game = await createGame();
      const backlogItem = await createBacklogItem({
        userId: user1.id,
        gameId: game.id,
      });

      const result = await BacklogItemService.update({
        id: backlogItem.id,
        status: 'COMPLETED',
        platform: 'PC',
      }, user2.id);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(AuthenticationError);
    });
  });
});
```

### 4. Server Action Testing Templates

#### Example: Server Action Tests with next-safe-action

```typescript
// features/manage-backlog-item/edit-backlog-item/server-actions/action.test.ts (Enhanced)
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { editBacklogItem } from './action';
import { setupTestDatabase, cleanupTestDatabase, resetTestDatabase } from '../../../../test/setup/database';
import { createUser, createGame, createBacklogItem } from '../../../../test/factories';
import { BacklogItemService } from '@/domain/backlog-item/service';

// Mock auth
vi.mock('@/auth', () => ({
  getServerUserId: vi.fn(),
}));

// Mock revalidation
vi.mock('@/shared/ui/revalidation', () => ({
  RevalidationService: {
    revalidateCollection: vi.fn(),
  },
}));

describe('editBacklogItem Server Action', () => {
  beforeEach(async () => {
    await setupTestDatabase();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('Authentication', () => {
    it('should reject unauthenticated requests', async () => {
      const { getServerUserId } = await import('@/auth');
      vi.mocked(getServerUserId).mockResolvedValue(undefined);

      const formData = new FormData();
      formData.append('id', '1');
      formData.append('status', 'TO_PLAY');
      formData.append('platform', 'PC');

      const result = await editBacklogItem(formData);

      expect(result.serverError).toBe('Authentication required. Please sign in to continue.');
    });
  });

  describe('Input Validation', () => {
    it('should validate required fields', async () => {
      const user = await createUser();
      const { getServerUserId } = await import('@/auth');
      vi.mocked(getServerUserId).mockResolvedValue(user.id);

      const formData = new FormData();
      formData.append('id', '1');
      formData.append('status', 'TO_PLAY');
      // Missing platform field

      const result = await editBacklogItem(formData);

      expect(result.validationErrors).toBeDefined();
      expect(result.validationErrors?.fieldErrors?.platform).toContain(
        'Invalid input: expected string, received undefined'
      );
    });

    it('should validate enum values', async () => {
      const user = await createUser();
      const { getServerUserId } = await import('@/auth');
      vi.mocked(getServerUserId).mockResolvedValue(user.id);

      const formData = new FormData();
      formData.append('id', '1');
      formData.append('status', 'INVALID_STATUS');
      formData.append('platform', 'PC');

      const result = await editBacklogItem(formData);

      expect(result.validationErrors).toBeDefined();
      expect(result.validationErrors?.fieldErrors?.status).toBeDefined();
    });

    it('should validate date formats', async () => {
      const user = await createUser();
      const { getServerUserId } = await import('@/auth');
      vi.mocked(getServerUserId).mockResolvedValue(user.id);

      const formData = new FormData();
      formData.append('id', '1');
      formData.append('status', 'TO_PLAY');
      formData.append('platform', 'PC');
      formData.append('startedAt', 'invalid-date');

      const result = await editBacklogItem(formData);

      expect(result.validationErrors).toBeDefined();
      expect(result.validationErrors?.fieldErrors?.startedAt).toBeDefined();
    });
  });

  describe('Business Logic', () => {
    it('should update backlog item successfully', async () => {
      const user = await createUser();
      const game = await createGame();
      const backlogItem = await createBacklogItem({
        userId: user.id,
        gameId: game.id,
        status: 'TO_PLAY',
      });

      const { getServerUserId } = await import('@/auth');
      vi.mocked(getServerUserId).mockResolvedValue(user.id);

      const formData = new FormData();
      formData.append('id', backlogItem.id.toString());
      formData.append('status', 'COMPLETED');
      formData.append('platform', 'PlayStation 5');
      formData.append('completedAt', '2024-01-15');

      const result = await editBacklogItem(formData);

      expect(result.data?.message).toBe('Success');
      expect(result.serverError).toBeUndefined();

      // Verify revalidation was called
      const { RevalidationService } = await import('@/shared/ui/revalidation');
      expect(RevalidationService.revalidateCollection).toHaveBeenCalled();
    });

    it('should handle non-existent backlog item', async () => {
      const user = await createUser();
      const { getServerUserId } = await import('@/auth');
      vi.mocked(getServerUserId).mockResolvedValue(user.id);

      const formData = new FormData();
      formData.append('id', '999999');
      formData.append('status', 'TO_PLAY');
      formData.append('platform', 'PC');

      const result = await editBacklogItem(formData);

      expect(result.data?.message).toContain('not found');
    });

    it('should handle unauthorized access', async () => {
      const user1 = await createUser();
      const user2 = await createUser();
      const game = await createGame();
      const backlogItem = await createBacklogItem({
        userId: user1.id,
        gameId: game.id,
      });

      const { getServerUserId } = await import('@/auth');
      vi.mocked(getServerUserId).mockResolvedValue(user2.id);

      const formData = new FormData();
      formData.append('id', backlogItem.id.toString());
      formData.append('status', 'COMPLETED');
      formData.append('platform', 'PC');

      const result = await editBacklogItem(formData);

      expect(result.data?.message).toContain("don't have permission");
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const user = await createUser();
      const { getServerUserId } = await import('@/auth');
      vi.mocked(getServerUserId).mockResolvedValue(user.id);

      // Mock database error
      vi.spyOn(BacklogItemService, 'update').mockResolvedValue({
        isFailure: true,
        error: new Error('Database connection failed'),
      } as any);

      const formData = new FormData();
      formData.append('id', '1');
      formData.append('status', 'TO_PLAY');
      formData.append('platform', 'PC');

      const result = await editBacklogItem(formData);

      expect(result.data?.message).toContain('Failed to update backlog item');
    });
  });
});
```

### 5. Component Testing Templates

#### Example: Component with Server Action Integration

```typescript
// features/manage-backlog-item/edit-backlog-item/components/edit-game-entry-modal.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditGameEntryModal } from './edit-game-entry-modal';
import { editBacklogItem } from '../server-actions/action';

// Mock server action
vi.mock('../server-actions/action', () => ({
  editBacklogItem: vi.fn(),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockBacklogItem = {
  id: 1,
  status: 'TO_PLAY' as const,
  platform: 'PC',
  startedAt: null,
  completedAt: null,
  acquisitionType: 'DIGITAL' as const,
  userId: 'user-1',
  gameId: 'game-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockGame = {
  id: 'game-1',
  title: 'Test Game',
  igdbId: 12345,
  coverImage: null,
  description: null,
  releaseDate: null,
  mainStory: null,
  mainExtra: null,
  completionist: null,
  hltbId: null,
  steamAppId: null,
};

describe('EditGameEntryModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render modal with game information', () => {
    render(
      <EditGameEntryModal
        game={mockGame}
        backlogItems={[mockBacklogItem]}
        isOpen={true}
        onClose={() => {}}
      />
    );

    expect(screen.getByText('Test Game')).toBeInTheDocument();
    expect(screen.getByDisplayValue('PC')).toBeInTheDocument();
    expect(screen.getByDisplayValue('TO_PLAY')).toBeInTheDocument();
  });

  it('should handle form submission successfully', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    vi.mocked(editBacklogItem).mockResolvedValue({
      data: { message: 'Success' },
    } as any);

    render(
      <EditGameEntryModal
        game={mockGame}
        backlogItems={[mockBacklogItem]}
        isOpen={true}
        onClose={onClose}
      />
    );

    // Change status to COMPLETED
    const statusSelect = screen.getByRole('combobox', { name: /status/i });
    await user.click(statusSelect);
    await user.click(screen.getByText('COMPLETED'));

    // Submit form
    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(editBacklogItem).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          status: 'COMPLETED',
          platform: 'PC',
        })
      );
    });

    // Verify success feedback
    const { toast } = await import('sonner');
    expect(toast.success).toHaveBeenCalledWith('Entry updated successfully');
    expect(onClose).toHaveBeenCalled();
  });

  it('should handle validation errors', async () => {
    const user = userEvent.setup();

    vi.mocked(editBacklogItem).mockResolvedValue({
      validationErrors: {
        fieldErrors: {
          platform: ['Platform is required'],
        },
      },
    } as any);

    render(
      <EditGameEntryModal
        game={mockGame}
        backlogItems={[mockBacklogItem]}
        isOpen={true}
        onClose={() => {}}
      />
    );

    // Clear platform field
    const platformInput = screen.getByDisplayValue('PC');
    await user.clear(platformInput);

    // Submit form
    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Platform is required')).toBeInTheDocument();
    });
  });

  it('should handle server errors', async () => {
    const user = userEvent.setup();

    vi.mocked(editBacklogItem).mockResolvedValue({
      serverError: 'Failed to update backlog item',
    } as any);

    render(
      <EditGameEntryModal
        game={mockGame}
        backlogItems={[mockBacklogItem]}
        isOpen={true}
        onClose={() => {}}
      />
    );

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      const { toast } = require('sonner');
      expect(toast.error).toHaveBeenCalledWith('Failed to update backlog item');
    });
  });

  it('should disable form during submission', async () => {
    const user = userEvent.setup();

    // Mock a slow server action
    vi.mocked(editBacklogItem).mockImplementation(() =>
      new Promise(resolve =>
        setTimeout(() => resolve({ data: { message: 'Success' } } as any), 1000)
      )
    );

    render(
      <EditGameEntryModal
        game={mockGame}
        backlogItems={[mockBacklogItem]}
        isOpen={true}
        onClose={() => {}}
      />
    );

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    // Button should be disabled during submission
    expect(saveButton).toBeDisabled();
    expect(screen.getByText(/saving/i)).toBeInTheDocument();
  });

  it('should validate date inputs', async () => {
    const user = userEvent.setup();

    render(
      <EditGameEntryModal
        game={mockGame}
        backlogItems={[mockBacklogItem]}
        isOpen={true}
        onClose={() => {}}
      />
    );

    // Set invalid date (completed before started)
    const startedAtInput = screen.getByLabelText(/started at/i);
    const completedAtInput = screen.getByLabelText(/completed at/i);

    await user.type(startedAtInput, '2024-01-15');
    await user.type(completedAtInput, '2024-01-10');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/completed date cannot be before started date/i)).toBeInTheDocument();
    });
  });
});
```

### 6. Integration Testing Templates

#### Example: API Route Integration Tests

```typescript
// app/api/steam/callback/route.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';
import { setupTestDatabase, cleanupTestDatabase, resetTestDatabase } from '../../../../test/setup/database';
import { createUser } from '../../../../test/factories';

// Mock auth
vi.mock('@/auth', () => ({
  getServerUserId: vi.fn(),
}));

// Mock Steam API
vi.mock('@/features/steam-integration/lib/steam-auth', () => ({
  SteamAuthService: {
    handleCallback: vi.fn(),
  },
}));

describe('/api/steam/callback', () => {
  beforeEach(async () => {
    await setupTestDatabase();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  it('should handle successful Steam authentication', async () => {
    const user = await createUser();
    const { getServerUserId } = await import('@/auth');
    const { SteamAuthService } = await import('@/features/steam-integration/lib/steam-auth');

    vi.mocked(getServerUserId).mockResolvedValue(user.id);
    vi.mocked(SteamAuthService.handleCallback).mockResolvedValue({
      isSuccess: true,
      value: { steamId: '12345', username: 'testuser' },
    } as any);

    const request = new NextRequest('http://localhost:3000/api/steam/callback?code=auth_code');
    const response = await GET(request);

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toContain('/user/settings?success=connected');
  });

  it('should handle authentication errors', async () => {
    const { getServerUserId } = await import('@/auth');
    vi.mocked(getServerUserId).mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost:3000/api/steam/callback?code=auth_code');
    const response = await GET(request);

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toContain('/auth/signin?error=session_required');
  });

  it('should handle Steam API errors', async () => {
    const user = await createUser();
    const { getServerUserId } = await import('@/auth');
    const { SteamAuthService } = await import('@/features/steam-integration/lib/steam-auth');

    vi.mocked(getServerUserId).mockResolvedValue(user.id);
    vi.mocked(SteamAuthService.handleCallback).mockResolvedValue({
      isFailure: true,
      error: new Error('Steam API error'),
    } as any);

    const request = new NextRequest('http://localhost:3000/api/steam/callback?code=auth_code');
    const response = await GET(request);

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toContain('/user/settings?error=connection_failed');
  });
});
```

### 7. E2E Testing with Playwright

#### Setup Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

#### Example: Critical User Journey Test

```typescript
// e2e/game-management.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Game Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/');
    await page.click('text=Sign In with Google');
    // Assume mock auth redirects to authenticated state
  });

  test('should add game to collection and manage status', async ({ page }) => {
    // Navigate to collection page
    await page.goto('/collection');
    await expect(page.locator('h1')).toContainText('Your Collection');

    // Add a new game
    await page.click('text=Add Game');

    // Search for a game
    await page.fill('[placeholder*="Search"]', 'The Witcher 3');
    await page.waitForSelector('text=The Witcher 3: Wild Hunt');
    await page.click('text=The Witcher 3: Wild Hunt');

    // Set game details
    await page.selectOption('[name="status"]', 'TO_PLAY');
    await page.selectOption('[name="platform"]', 'PC');
    await page.selectOption('[name="acquisitionType"]', 'DIGITAL');

    await page.click('text=Add to Collection');

    // Verify game was added
    await expect(page.locator('text=The Witcher 3')).toBeVisible();

    // Update game status
    await page.hover('text=The Witcher 3');
    await page.click('[aria-label="Edit game entry"]');

    await page.selectOption('[name="status"]', 'PLAYING');
    await page.fill('[name="startedAt"]', '2024-01-15');
    await page.click('text=Save');

    // Verify status was updated
    await expect(page.locator('text=Playing')).toBeVisible();

    // Complete the game
    await page.hover('text=The Witcher 3');
    await page.click('[aria-label="Mark as completed"]');
    await page.fill('[name="completedAt"]', '2024-01-30');
    await page.click('text=Mark Complete');

    // Verify completion
    await expect(page.locator('text=Completed')).toBeVisible();

    // Filter by completed games
    await page.click('[aria-label="Filter by status"]');
    await page.click('text=Completed');

    await expect(page.locator('text=The Witcher 3')).toBeVisible();
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/**', route => route.abort());

    await page.goto('/collection');
    await page.click('text=Add Game');
    await page.fill('[placeholder*="Search"]', 'Test Game');

    // Should show error message
    await expect(page.locator('text=Unable to search games')).toBeVisible();
    await expect(page.locator('text=Try again')).toBeVisible();
  });
});
```

## Testing Coverage Implementation Plan

### Phase 1: Foundation (Week 1)

#### Infrastructure Setup

- [ ] Configure enhanced Vitest setup
- [ ] Implement test database management
- [ ] Create test data factories
- [ ] Set up global test utilities

#### Core Domain Testing

- [ ] Write comprehensive tests for `BacklogItemService`
- [ ] Write comprehensive tests for `ReviewService`
- [ ] Write comprehensive tests for `GameService`
- [ ] Achieve 85% coverage for domain layer

### Phase 2: Server Actions (Week 2)

#### High-Priority Server Actions

- [ ] Test all authentication-related server actions
- [ ] Test all data modification server actions
- [ ] Test error handling scenarios
- [ ] Test authorization boundaries

#### Target Coverage: 70% for server actions

### Phase 3: Component Testing (Week 3)

#### UI Component Tests

- [ ] Test form components with server action integration
- [ ] Test error states and loading states
- [ ] Test user interactions and validation
- [ ] Test accessibility requirements

#### Target Coverage: 60% for components

### Phase 4: Integration & E2E (Week 4)

#### Integration Tests

- [ ] Test API routes
- [ ] Test database operations
- [ ] Test external service integrations

#### E2E Tests

- [ ] Test critical user journeys
- [ ] Test error scenarios
- [ ] Test across different browsers

## Testing Best Practices

### Test Structure (AAA Pattern)

```typescript
describe('Feature', () => {
  it('should do something when condition is met', async () => {
    // Arrange - Set up test data and dependencies
    const user = await createUser();
    const expectedResult = { success: true };

    // Act - Execute the functionality being tested
    const result = await serviceMethod(user.id);

    // Assert - Verify the expected outcome
    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual(expectedResult);
  });
});
```

### Test Naming Convention

- **Descriptive test names**: `should return validation error when email is invalid`
- **Grouped by feature**: Organize tests by the feature they're testing
- **Consistent structure**: Use consistent describe/it blocks

### Mock Strategy

- **Mock external dependencies**: APIs, databases, authentication
- **Don't mock what you're testing**: Test the actual implementation
- **Use factory functions**: For consistent test data creation
- **Reset mocks**: Between tests to avoid interference

### Coverage Targets

- **Domain Layer**: 85% coverage (business logic is critical)
- **Server Actions**: 70% coverage (user-facing functionality)
- **Components**: 60% coverage (UI behavior)
- **Integration**: Key workflows and API routes
- **E2E**: Critical user journeys only

## Benefits After Implementation

### Development Confidence

- ✅ **Safe refactoring**: Comprehensive tests catch regressions
- ✅ **Feature development**: TDD approach improves code quality
- ✅ **Code review**: Automated validation reduces manual testing

### Production Reliability

- ✅ **Bug prevention**: Tests catch issues before deployment
- ✅ **Performance monitoring**: Tests can include performance assertions
- ✅ **User experience**: E2E tests validate actual user workflows

### Team Productivity

- ✅ **Faster development**: Less manual testing required
- ✅ **Better debugging**: Tests help isolate issues quickly
- ✅ **Documentation**: Tests serve as executable documentation

---

**Next Document**: [06-type-safety-improvements.md](./06-type-safety-improvements.md)
