import { logger } from '@/shared/lib/logger';

const IGDB_REQUEST_DELAY = 1000; // ms between requests
const IGDB_MAX_RETRIES = 3;
const IGDB_RATE_LIMIT_RETRY_DELAY = 1000; // ms between rate limit retries

async function makeIGDBRequest<T>(
  requestFn: () => Promise<T>,
  context: string,
  retryCount = 0,
): Promise<T | null> {
  try {
    // Add a delay before making the request to avoid overwhelming the API
    await new Promise((resolve) => setTimeout(resolve, IGDB_REQUEST_DELAY));

    return await requestFn();
  } catch (error) {
    // Check if this is a rate limit error
    const isRateLimit =
      error instanceof Error &&
      (error.message.includes('429') ||
        error.message.includes('rate limit') ||
        error.message.toLowerCase().includes('too many requests'));

    if (isRateLimit && retryCount < IGDB_MAX_RETRIES) {
      // Log the rate limit error
      logger.warn(
        `IGDB rate limit hit, retrying in ${IGDB_RATE_LIMIT_RETRY_DELAY}ms (attempt ${retryCount + 1}/${IGDB_MAX_RETRIES})`,
        {
          context,
        },
      );

      // Wait longer before retrying
      await new Promise((resolve) =>
        setTimeout(resolve, IGDB_RATE_LIMIT_RETRY_DELAY),
      );

      // Retry the request with an increased retry count
      return makeIGDBRequest(requestFn, context, retryCount + 1);
    }

    // If it's not a rate limit error or we've exceeded retries, log and return null
    logger.error(
      `Error making IGDB request: ${error instanceof Error ? error.message : String(error)}`,
      {
        context,
      },
    );

    return null;
  }
}

export { makeIGDBRequest };
