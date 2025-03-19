import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockGetServerUserId = vi.fn();
const mockRedirect = vi.fn();
const mockFindMany = vi.fn();
const mockCount = vi.fn();

vi.mock('@/shared/lib/auth-service', () => ({
  getServerUserId: mockGetServerUserId,
}));

vi.mock('@/prisma/client', () => ({
  prisma: {
    game: {
      findMany: mockFindMany,
      count: mockCount,
    },
  },
}));

vi.mock('next/navigation', () => ({
  redirect: mockRedirect,
}));

import { getUserWishlistedGamesGroupedBacklog } from '@/features/wishlist/actions/wishlist-actions';

describe('Wishlist Actions', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('redirects to home if user is not authenticated', async () => {
    mockGetServerUserId.mockResolvedValue(null);

    await getUserWishlistedGamesGroupedBacklog({ page: '1' });

    expect(mockRedirect).toHaveBeenCalledWith('/');
  });

  it('returns wishlisted games for authenticated user', async () => {
    const mockUserId = 'user123';
    mockGetServerUserId.mockResolvedValue(mockUserId);

    const mockGames = [
      {
        id: 'game1',
        title: 'Game 1',
        createdAt: new Date(),
        backlogItems: [{ id: 'item1', userId: mockUserId, status: 'WISHLIST' }],
      },
      {
        id: 'game2',
        title: 'Game 2',
        createdAt: new Date(),
        backlogItems: [{ id: 'item2', userId: mockUserId, status: 'WISHLIST' }],
      },
    ];

    mockFindMany.mockResolvedValue(mockGames);
    mockCount.mockResolvedValue(2);

    const result = await getUserWishlistedGamesGroupedBacklog({ page: '1' });

    expect(mockFindMany).toHaveBeenCalledWith({
      where: {
        backlogItems: { some: { userId: mockUserId, status: 'WISHLIST' } },
      },
      orderBy: { createdAt: 'desc' },
      take: 21,
      skip: 0,
      include: {
        backlogItems: {
          where: {
            userId: mockUserId,
            status: 'WISHLIST',
          },
        },
      },
    });

    expect(result?.data).toEqual({
      wishlistedGames: mockGames.map((game) => ({
        game,
        backlogItems: game.backlogItems,
      })),
      count: 2,
    });
  });

  it('handles pagination correctly', async () => {
    const mockUserId = 'user123';
    mockGetServerUserId.mockResolvedValue(mockUserId);

    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    await getUserWishlistedGamesGroupedBacklog({ page: '2' });

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 21,
        take: 21,
      }),
    );
  });
});
