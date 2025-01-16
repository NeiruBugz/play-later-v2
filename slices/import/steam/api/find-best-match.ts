import Fuse from "fuse.js";

export function findBestMatch(target: string, candidates: string[]) {
  const fuse = new Fuse(candidates, {
    includeScore: true,
    threshold: 0.4, // Adjust for stricter or looser matching
  });

  const result = fuse.search(target);
  return result.length > 0 ? result[0] : null;
}
