import { makeIGDBRequest } from '@/features/import-steam-games/actions/make-igdb-request';
import { prisma } from '@/prisma/client';
import { getBaseGameName } from '@/shared/external-apis/steam/utils';
import { normalizeGameName } from '@/shared/external-apis/steam/utils';
import { logger } from '@/shared/lib/logger';
import { IGDBClient } from '@/shared/external-apis/igdb/client';
const igdbClient = new IGDBClient();

async function processGame(
  game: { appid: number; name: string; playtime_forever: number },
  userId: string,
  jobId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<{ action: 'imported' | 'skipped'; game: any }> {
  const context = 'processGame';

  try {
    logger.debug(`Processing game: ${game.name} (${game.appid})`, {
      context,
      data: {
        appId: game.appid,
        playtime: game.playtime_forever,
      },
    });

    // Check if the item is software (not a game)
    const softwareKeywords = [
      'Source Filmmaker',
      'SDK',
      'Editor',
      'Creator',
      'Toolkit',
      'Tool',
      'Software',
      'Engine',
      'Maker',
      'Modding',
      'Development Kit',
    ];

    const isSoftware = softwareKeywords.some((keyword) =>
      game.name.toLowerCase().includes(keyword.toLowerCase()),
    );

    if (isSoftware) {
      logger.debug(`Skipping software: ${game.name} (${game.appid})`, {
        context,
      });

      // Record skipped software
      await prisma.failedImport.create({
        data: {
          userId,
          steamImportJobId: jobId,
          steamAppId: game.appid,
          gameName: game.name,
          reason: 'Software item skipped (not a game)',
          playtime: game.playtime_forever,
        },
      });

      return {
        action: 'skipped',
        game: { name: game.name, appid: game.appid },
      };
    }

    // Check if the item is a demo
    const isDemoOrBeta =
      game.name.toLowerCase().includes('demo') ||
      game.name.toLowerCase().includes('beta') ||
      game.name.toLowerCase().includes('trial') ||
      game.name.toLowerCase().includes('playtest');

    if (isDemoOrBeta) {
      logger.debug(`Skipping demo/beta: ${game.name} (${game.appid})`, {
        context,
      });

      // Record skipped demo
      await prisma.failedImport.create({
        data: {
          userId,
          steamImportJobId: jobId,
          steamAppId: game.appid,
          gameName: game.name,
          reason: 'Demo/Beta skipped',
          playtime: game.playtime_forever,
        },
      });

      return {
        action: 'skipped',
        game: { name: game.name, appid: game.appid },
      };
    }

    // Determine the status based on playtime
    const status =
      game.playtime_forever && game.playtime_forever > 0 ? 'PLAYED' : 'TO_PLAY';

    logger.debug(`Game status determined: ${status}`, {
      context,
      data: {
        appId: game.appid,
        playtime: game.playtime_forever,
        status,
      },
    });

    // Check if game is already in the user's backlog by Steam app ID
    const existingByAppId = await prisma.game.findFirst({
      where: {
        steamAppId: game.appid,
        backlogItems: {
          some: {
            userId,
          },
        },
      },
      include: {
        backlogItems: {
          where: {
            userId,
          },
        },
      },
    });

    if (existingByAppId) {
      logger.debug(`Game already in backlog: ${game.name} (${game.appid})`, {
        context,
      });

      // Record skipped game
      await prisma.failedImport.create({
        data: {
          userId,
          steamImportJobId: jobId,
          steamAppId: game.appid,
          gameName: game.name,
          reason: 'Game already in backlog',
          playtime: game.playtime_forever,
        },
      });

      return { action: 'skipped', game: existingByAppId };
    }

    // Check if game is in the ignored list
    const isIgnored = await prisma.ignoredImportedGames.findFirst({
      where: {
        userId,
        id: String(game.appid),
      },
    });

    if (isIgnored) {
      logger.debug(`Game is in ignored list: ${game.name} (${game.appid})`, {
        context,
      });

      // Record skipped game
      await prisma.failedImport.create({
        data: {
          userId,
          steamImportJobId: jobId,
          steamAppId: game.appid,
          gameName: game.name,
          reason: 'Game is in ignored list',
          playtime: game.playtime_forever,
        },
      });

      return {
        action: 'skipped',
        game: { name: game.name, appid: game.appid },
      };
    }

    // Check if game exists in database by title similarity
    const allGames = await prisma.game.findMany({
      where: {
        deleted: false,
      },
      select: {
        id: true,
        title: true,
        steamAppId: true,
      },
    });

    // Enhanced normalization for better matching
    const normalizedGameName = normalizeGameName(game.name)
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    const baseGameName = getBaseGameName(game.name)
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Common words to remove for better matching (articles, etc.)
    const wordsToRemove = [
      'the',
      'a',
      'an',
      'of',
      'and',
      'for',
      'in',
      'on',
      'at',
    ];
    const cleanedGameName = normalizedGameName
      .split(' ')
      .filter((word) => !wordsToRemove.includes(word))
      .join(' ');

    const cleanedBaseName = baseGameName
      .split(' ')
      .filter((word) => !wordsToRemove.includes(word))
      .join(' ');

    // Detect special game types
    const isRemakeOrRemaster =
      /remake|remaster|rebirth|reunion|intergrade|definitive|enhanced|remastered|directors cut/i.test(
        game.name,
      );
    const isSequelOrPrequel =
      /\b(II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV|XVI|XVII|XVIII|XIX|XX)\b|\b\d+\b/i.test(
        game.name,
      );

    // Find a game with similar title using improved matching algorithm
    const similarGame = allGames.find((dbGame) => {
      // Skip if the Steam App IDs are different but both exist
      if (dbGame.steamAppId && game.appid && dbGame.steamAppId !== game.appid) {
        return false;
      }

      const normalizedDbTitle = normalizeGameName(dbGame.title)
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      const baseDbTitle = getBaseGameName(dbGame.title)
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      const cleanedDbTitle = normalizedDbTitle
        .split(' ')
        .filter((word) => !wordsToRemove.includes(word))
        .join(' ');

      const cleanedBaseDbTitle = baseDbTitle
        .split(' ')
        .filter((word) => !wordsToRemove.includes(word))
        .join(' ');

      // Check if the DB game is also a remake/remaster
      const isDbGameRemakeOrRemaster =
        /remake|remaster|rebirth|reunion|intergrade|definitive|enhanced|remastered|directors cut/i.test(
          dbGame.title,
        );

      // Check if the DB game is also a sequel/prequel
      const isDbGameSequelOrPrequel =
        /\b(II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV|XVI|XVII|XVIII|XIX|XX)\b|\b\d+\b/i.test(
          dbGame.title,
        );

      // For remakes/remasters, we need exact matches
      if (isRemakeOrRemaster || isDbGameRemakeOrRemaster) {
        // If one is a remake and the other isn't, they're different games
        if (isRemakeOrRemaster !== isDbGameRemakeOrRemaster) {
          return false;
        }

        // For remakes, require exact match
        return normalizedDbTitle === normalizedGameName;
      }

      // For sequels/prequels, we need to be careful with matching
      if (isSequelOrPrequel || isDbGameSequelOrPrequel) {
        // If one is a sequel and the other isn't, they're different games
        if (isSequelOrPrequel !== isDbGameSequelOrPrequel) {
          return false;
        }

        // For sequels, require exact match or very close match
        if (normalizedDbTitle === normalizedGameName) {
          return true;
        }

        // Extract numbers/roman numerals to check if they're the same sequel number
        const extractSequelNumber = (title: string) => {
          const romanMatch = title.match(
            /\b(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV|XVI|XVII|XVIII|XIX|XX)\b/i,
          );
          if (romanMatch) return romanMatch[0];

          const numberMatch = title.match(/\b\d+\b/);
          if (numberMatch) return numberMatch[0];

          return null;
        };

        const gameSequelNum = extractSequelNumber(game.name);
        const dbGameSequelNum = extractSequelNumber(dbGame.title);

        // If they have different sequel numbers, they're different games
        if (
          gameSequelNum &&
          dbGameSequelNum &&
          gameSequelNum !== dbGameSequelNum
        ) {
          return false;
        }
      }

      // Check for exact matches
      if (
        normalizedDbTitle === normalizedGameName ||
        baseDbTitle === baseGameName
      ) {
        return true;
      }

      // Check for cleaned matches (without common words)
      if (
        cleanedDbTitle === cleanedGameName ||
        cleanedBaseDbTitle === cleanedBaseName
      ) {
        return true;
      }

      // For non-remake/non-sequel games, we can be a bit more lenient
      // Check for substring matches, but only if the titles are substantial
      if (normalizedGameName.length > 5 && normalizedDbTitle.length > 5) {
        // Only consider substring matches if one title fully contains the other
        // and they share at least 80% of characters
        if (
          normalizedDbTitle.includes(normalizedGameName) ||
          normalizedGameName.includes(normalizedDbTitle)
        ) {
          const longerTitle =
            normalizedDbTitle.length > normalizedGameName.length
              ? normalizedDbTitle
              : normalizedGameName;
          const shorterTitle =
            normalizedDbTitle.length > normalizedGameName.length
              ? normalizedGameName
              : normalizedDbTitle;

          // If the shorter title is at least 80% of the longer title's length, consider it a match
          if (shorterTitle.length / longerTitle.length > 0.8) {
            return true;
          }
        }
      }

      // Check for word-by-word similarity for non-remake/non-sequel games
      if (
        !isRemakeOrRemaster &&
        !isSequelOrPrequel &&
        !isDbGameRemakeOrRemaster &&
        !isDbGameSequelOrPrequel
      ) {
        const dbTitleWords = cleanedDbTitle.split(' ');
        const gameNameWords = cleanedGameName.split(' ');

        // If the game name has at least 2 words and more than 80% of words match
        if (gameNameWords.length >= 2 && dbTitleWords.length >= 2) {
          const matchingWords = gameNameWords.filter((word) =>
            dbTitleWords.some(
              (dbWord) =>
                dbWord === word ||
                dbWord.includes(word) ||
                word.includes(dbWord),
            ),
          );

          if (
            matchingWords.length / gameNameWords.length > 0.8 &&
            matchingWords.length / dbTitleWords.length > 0.8
          ) {
            return true;
          }
        }
      }

      return false;
    });

    if (similarGame) {
      logger.debug(`Found similar game in database: ${similarGame.title}`, {
        context,
        data: {
          originalName: game.name,
          similarGameId: similarGame.id,
          similarGameTitle: similarGame.title,
        },
      });

      // Check if user already has this game in backlog
      const existingBacklogItem = await prisma.backlogItem.findFirst({
        where: {
          userId,
          gameId: similarGame.id,
        },
      });

      if (existingBacklogItem) {
        logger.debug(`Similar game already in backlog: ${similarGame.title}`, {
          context,
        });

        // Record skipped game
        await prisma.failedImport.create({
          data: {
            userId,
            steamImportJobId: jobId,
            steamAppId: game.appid,
            gameName: game.name,
            reason: `Similar game "${similarGame.title}" already in backlog`,
            playtime: game.playtime_forever,
          },
        });

        return { action: 'skipped', game: similarGame };
      }

      // Add to backlog
      const backlogItem = await prisma.backlogItem.create({
        data: {
          userId,
          gameId: similarGame.id,
          status,
          platform: 'pc',
        },
        include: {
          game: true,
        },
      });

      logger.info(
        `Added similar game to backlog: ${similarGame.title} with status ${status}`,
        {
          context,
          data: {
            gameId: similarGame.id,
            backlogItemId: backlogItem.id,
            status,
          },
        },
      );

      // Update the game with Steam app ID if it doesn't have one
      if (!similarGame.steamAppId) {
        await prisma.game.update({
          where: { id: similarGame.id },
          data: {
            steamAppId: game.appid,
          },
        });

        logger.debug(`Updated similar game with Steam app ID: ${game.appid}`, {
          context,
        });
      }

      return { action: 'imported', game: backlogItem.game };
    }

    // Game not found in database, search in IGDB
    logger.debug(`Searching for game in IGDB: ${game.name}`, { context });

    // Try with different name variations for better IGDB matching
    const searchVariations = [
      game.name, // Original name
      normalizedGameName, // Normalized name
      baseGameName, // Base name (without edition info)
      cleanedGameName, // Cleaned name (without common words)
      cleanedBaseName, // Cleaned base name
    ];

    // Remove duplicates
    const uniqueSearchTerms = [...new Set(searchVariations)];

    // Try each variation until we find a match
    let igdbGame = null;
    for (const searchTerm of uniqueSearchTerms) {
      if (!searchTerm || searchTerm.length < 3) continue; // Skip too short terms

      logger.debug(`Trying IGDB search with term: ${searchTerm}`, { context });

      // Use the rate limit helper function
      igdbGame = await makeIGDBRequest(
        () => igdbClient.getGameForSteamImport(searchTerm),
        context,
      );

      if (igdbGame) {
        logger.debug(`Found match in IGDB with term: ${searchTerm}`, {
          context,
        });
        break;
      }
    }

    // If standard search failed, try the alternative search approach
    if (!igdbGame) {
      logger.debug(
        `Standard IGDB search failed, trying alternative search approach`,
        { context },
      );

      // Try each variation with a different search approach
      for (const searchTerm of uniqueSearchTerms) {
        if (!searchTerm || searchTerm.length < 3) continue; // Skip too short terms

        try {
          // Try a different search approach - use the base name without any modifiers
          const baseSearchTerm = searchTerm
            .replace(
              /remake|remaster|rebirth|reunion|intergrade|definitive|enhanced|remastered|directors cut/gi,
              '',
            )
            .trim();

          if (baseSearchTerm.length < 3) continue; // Skip if too short after removing modifiers

          logger.debug(
            `Trying alternative IGDB search with base term: ${baseSearchTerm}`,
            { context },
          );

          // Use the rate limit helper function
          const alternativeResults = await makeIGDBRequest(
            () => igdbClient.getGameForSteamImport(baseSearchTerm),
            context,
          );

          if (alternativeResults) {
            logger.debug(
              `Found alternative match in IGDB: ${alternativeResults.name}`,
              {
                context,
                data: {
                  originalName: game.name,
                  matchedName: alternativeResults.name,
                  searchTerm: baseSearchTerm,
                },
              },
            );
            igdbGame = alternativeResults;
            break;
          }
        } catch (error) {
          // Check if this is a rate limit error
          const isRateLimit =
            error instanceof Error &&
            (error.message.includes('429') ||
              error.message.includes('rate limit') ||
              error.message.toLowerCase().includes('too many requests'));

          if (isRateLimit) {
            logger.warn(
              `IGDB rate limit hit during alternative search, skipping remaining variations`,
              {
                context,
              },
            );
            // Break out of the loop to avoid more rate limit errors
            break;
          }

          logger.warn(
            `Error in alternative IGDB search: ${error instanceof Error ? error.message : String(error)}`,
            {
              context,
            },
          );
          // Continue to next search term for non-rate-limit errors
        }
      }
    }

    // If still no match, try one more approach for remakes/remasters
    if (!igdbGame && isRemakeOrRemaster) {
      logger.debug(
        `Trying core name extraction for remake/remaster: ${game.name}`,
        { context },
      );

      try {
        // Extract the core game name by removing common remake/remaster indicators
        const extractCoreGameName = (name: string): string => {
          // Remove common remake/remaster suffixes and prefixes
          let coreName = name
            .replace(/\s*remake\s*/gi, ' ')
            .replace(/\s*remaster(ed)?\s*/gi, ' ')
            .replace(/\s*definitive\s*edition\s*/gi, ' ')
            .replace(/\s*enhanced\s*edition\s*/gi, ' ')
            .replace(/\s*directors\s*cut\s*/gi, ' ')
            .replace(/\s*rebirth\s*/gi, ' ')
            .replace(/\s*reunion\s*/gi, ' ')
            .replace(/\s*intergrade\s*/gi, ' ')
            .trim();

          // Remove anything in parentheses or brackets
          coreName = coreName.replace(/\s*[\(\[\{].*?[\)\]\}]\s*/g, ' ').trim();

          // Remove special characters and extra spaces
          coreName = coreName
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

          return coreName;
        };

        const coreGameName = extractCoreGameName(game.name);

        if (coreGameName.length >= 3) {
          logger.debug(
            `Extracted core game name: "${coreGameName}" from "${game.name}"`,
            { context },
          );

          // Try to find the game with the core name, using rate limit helper
          const coreNameResults = await makeIGDBRequest(
            () => igdbClient.getGameForSteamImport(coreGameName),
            context,
          );

          if (coreNameResults) {
            logger.debug(
              `Found match using core game name: ${coreNameResults.name}`,
              {
                context,
                data: {
                  originalName: game.name,
                  coreName: coreGameName,
                  matchedName: coreNameResults.name,
                },
              },
            );
            igdbGame = coreNameResults;
          }
        }
      } catch (error) {
        // Check if this is a rate limit error
        const isRateLimit =
          error instanceof Error &&
          (error.message.includes('429') ||
            error.message.includes('rate limit') ||
            error.message.toLowerCase().includes('too many requests'));

        if (isRateLimit) {
          logger.warn(
            `IGDB rate limit hit during core name extraction, skipping`,
            {
              context,
            },
          );
        } else {
          logger.warn(
            `Error in core name extraction search: ${error instanceof Error ? error.message : String(error)}`,
            {
              context,
            },
          );
        }
      }
    }

    if (!igdbGame) {
      logger.warn(`Game not found in IGDB: ${game.name}`, {
        context,
        data: { appId: game.appid },
      });

      // Record failed import with specific reason if it was a rate limit issue
      await prisma.failedImport.create({
        data: {
          userId,
          steamImportJobId: jobId,
          steamAppId: game.appid,
          gameName: game.name,
          reason: 'Game not found in IGDB',
          playtime: game.playtime_forever,
        },
      });

      throw new Error(`Game not found in IGDB: ${game.name}`);
    }

    logger.debug(`Found game in IGDB: ${igdbGame.name} (ID: ${igdbGame.id})`, {
      context,
    });

    // Create new game in database
    const newGame = await prisma.game.create({
      data: {
        title: igdbGame.name,
        description: igdbGame.summary,
        coverImage: igdbGame.cover?.image_id,
        releaseDate: igdbGame.first_release_date
          ? new Date(igdbGame.first_release_date * 1000)
          : null,
        igdbId: igdbGame.id,
        steamAppId: game.appid,
        // Add genres if available
        genres: igdbGame.genres
          ? {
              create: igdbGame.genres.map((genre) => ({
                genre: {
                  connectOrCreate: {
                    where: { id: genre.id },
                    create: { id: genre.id, name: genre.name },
                  },
                },
              })),
            }
          : undefined,
      },
    });

    logger.info(`Created new game in database: ${newGame.title}`, {
      context,
      data: {
        gameId: newGame.id,
        igdbId: igdbGame.id,
        steamAppId: game.appid,
      },
    });

    // Add to user's backlog
    const backlogItem = await prisma.backlogItem.create({
      data: {
        userId,
        gameId: newGame.id,
        status,
        platform: 'pc',
      },
      include: {
        game: true,
      },
    });

    logger.info(
      `Added new game to backlog: ${newGame.title} with status ${status}`,
      {
        context,
        data: {
          gameId: newGame.id,
          backlogItemId: backlogItem.id,
          status,
        },
      },
    );

    return { action: 'imported', game: backlogItem.game };
  } catch (error) {
    // Check if this is a rate limit error
    const isRateLimit =
      error instanceof Error &&
      (error.message.includes('429') ||
        error.message.includes('rate limit') ||
        error.message.toLowerCase().includes('too many requests'));

    const errorReason = isRateLimit
      ? 'IGDB rate limit exceeded'
      : 'Error processing game';

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    logger.error(
      `${errorReason}: ${game.name} (${game.appid}) - ${errorMessage}`,
      {
        context,
        data: {
          appId: game.appid,
          name: game.name,
          isRateLimit,
        },
      },
    );

    // Record failed import with specific rate limit reason if applicable
    await prisma.failedImport.create({
      data: {
        userId,
        steamImportJobId: jobId,
        steamAppId: game.appid,
        gameName: game.name,
        reason: errorReason,
        errorMessage: errorMessage,
        playtime: game.playtime_forever,
      },
    });

    throw error;
  }
}

export { processGame };
