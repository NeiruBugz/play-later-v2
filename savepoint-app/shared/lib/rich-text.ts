export function stripHtmlTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-z]+;/gi, "")
    .trim();
}

export const MAX_CHARACTERS = 1000;
