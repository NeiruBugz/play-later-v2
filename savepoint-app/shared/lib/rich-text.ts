/**
 * Utility functions for working with rich text/HTML content.
 * These functions are pure and can be used on both server and client.
 */

/**
 * Strips HTML tags and returns plain text
 */
export function stripHtmlTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/&nbsp;/g, " ") // Replace &nbsp; with space
    .replace(/&[a-z]+;/gi, "") // Remove other HTML entities
    .trim();
}

/**
 * Checks if content is empty after stripping HTML tags
 */
export function isContentEmpty(html: string): boolean {
  return stripHtmlTags(html).length === 0;
}

/**
 * Maximum characters allowed for rich text content
 */
export const MAX_CHARACTERS = 1000;
