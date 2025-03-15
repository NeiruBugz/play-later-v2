'use server';

import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/prisma/client';
import { nextSafeActionClient } from '@/shared/lib/next-safe-action-client';
import { getPaginatedGames } from '@/shared/external-apis/steam';
import type { SteamGame } from '@/shared/external-apis/steam';

// Schema for validating the fetch games input
const fetchGamesSchema = z.object({
  steamId: z.string().min(1, 'Steam ID is required'),
  page: z.number().int().min(0).default(1),
  pageSize: z.number().int().min(1).max(10000).default(20),
  sortField: z.enum(['name', 'playtime_forever']).default('playtime_forever'),
  sortDirection: z.enum(['asc', 'desc']).default('desc'),
});

// Type for the fetch games response
type FetchSteamGamesResponse = {
  games: Array<
    SteamGame & { alreadyInBacklog: boolean; relatedGames?: SteamGame[] }
  >;
  totalGames: number;
  currentPage: number;
  totalPages: number;
  error?: string;
};

// Helper function to normalize game titles for comparison
function normalizeGameTitle(title: string): string {
  return (
    title
      .toLowerCase()
      // Remove special editions, etc.
      .replace(
        /(deluxe|gold|complete|definitive|enhanced|remastered|goty|game of the year|collection|edition|remaster|remake|hd|extended|ultimate|premium|standard|special|digital|directors cut|classic|legacy)/gi,
        '',
      )
      // Remove years in various formats
      .replace(/\b(19|20)\d{2}\b/g, '')
      // Remove roman numerals
      .replace(/\b[ivxlcdm]+\b/gi, '')
      // Remove common punctuation and separators
      .replace(/[-:®™&_.,;'"!?()[\]{}]/g, ' ')
      // Remove common articles and prepositions
      .replace(
        /\b(a|an|the|of|for|to|in|on|by|with|from|and|or|but|is|are|was|were|be|been|being|at|since|during|until|while|about|against|between|into|through|after|before|above|below|under|over)\b/gi,
        '',
      )
      // Collapse multiple spaces
      .replace(/\s+/g, ' ')
      .trim()
  );
}

// Generate alternative names for a game title to improve matching
function generateAlternativeNames(normalizedTitle: string): string[] {
  const alternatives: string[] = [];

  // Add the original normalized title
  alternatives.push(normalizedTitle);

  // Remove numbers
  const withoutNumbers = normalizedTitle.replace(/\d+/g, '').trim();
  if (withoutNumbers !== normalizedTitle) {
    alternatives.push(withoutNumbers);
  }

  // Remove content in parentheses
  const withoutParentheses = normalizedTitle.replace(/\(.*?\)/g, '').trim();
  if (withoutParentheses !== normalizedTitle) {
    alternatives.push(withoutParentheses);
  }

  // Handle common abbreviations and full names
  const abbreviationMap: Record<string, string> = {
    'call of duty': 'cod',
    cod: 'call of duty',
    'counter strike': 'cs',
    cs: 'counter strike',
    'grand theft auto': 'gta',
    gta: 'grand theft auto',
    'assassins creed': 'ac',
    ac: 'assassins creed',
    battlefield: 'bf',
    bf: 'battlefield',
  };

  // Check for abbreviations and add alternatives
  for (const [full, abbr] of Object.entries(abbreviationMap)) {
    if (normalizedTitle.includes(full)) {
      alternatives.push(normalizedTitle.replace(full, abbr));
    } else if (normalizedTitle.includes(abbr)) {
      alternatives.push(normalizedTitle.replace(abbr, full));
    }
  }

  return [...new Set(alternatives)]; // Remove duplicates
}

// Function to check if two titles are similar
function areTitlesSimilar(title1: string, title2: string): boolean {
  const normalized1 = normalizeGameTitle(title1);
  const normalized2 = normalizeGameTitle(title2);

  // Direct match
  if (normalized1 === normalized2) return true;

  // Generate alternative names for both titles
  const alternatives1 = generateAlternativeNames(normalized1);
  const alternatives2 = generateAlternativeNames(normalized2);

  // Check if any alternative names match
  for (const alt1 of alternatives1) {
    for (const alt2 of alternatives2) {
      if (alt1 === alt2) return true;
    }
  }

  return false;
}

// Check if a game is already in the user's backlog
async function isGameInBacklog(
  userId: string,
  appid: number,
  gameName: string,
): Promise<boolean> {
  // First, check if we have a direct Steam app ID match
  const steamMatch = await prisma.backlogItem.findFirst({
    where: {
      userId,
      game: {
        steamAppId: appid,
      },
    },
  });

  if (steamMatch) return true;

  // If no direct match, check by game title similarity
  const backlogItems = await prisma.backlogItem.findMany({
    where: {
      userId,
    },
    include: {
      game: {
        select: {
          title: true,
        },
      },
    },
  });

  return backlogItems.some((item) => {
    // Check by title similarity
    return areTitlesSimilar(item.game.title, gameName);
  });
}

// Action to fetch paginated Steam games
export const fetchSteamGames = nextSafeActionClient
  .schema(fetchGamesSchema)
  .action(async ({ parsedInput }): Promise<FetchSteamGamesResponse> => {
    const { steamId, page, pageSize, sortField, sortDirection } = parsedInput;
    try {
      // Get the current user
      const session = await auth();
      if (!session?.user?.id) {
        return {
          games: [],
          totalGames: 0,
          currentPage: page,
          totalPages: 0,
          error: 'Authentication required',
        };
      }

      const userId = session.user.id;

      // Fetch Steam games using the Steam client
      const {
        games: paginatedGames,
        totalGames,
        totalPages,
        currentPage,
      } = await getPaginatedGames(
        steamId,
        page,
        pageSize,
        sortField,
        sortDirection,
      );

      // Process games to check if they're already in the backlog
      const processedGamesPromises = paginatedGames.map(async (game) => {
        // Check if the game is already in the user's backlog
        const alreadyInBacklog = await isGameInBacklog(
          userId,
          game.appid,
          game.name,
        );

        return {
          ...game,
          alreadyInBacklog,
        };
      });

      const processedGames = await Promise.all(processedGamesPromises);

      return {
        games: processedGames,
        totalGames,
        currentPage,
        totalPages,
      };
    } catch (error) {
      console.error('Error fetching Steam games:', error);
      return {
        games: [],
        totalGames: 0,
        currentPage: page,
        totalPages: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
