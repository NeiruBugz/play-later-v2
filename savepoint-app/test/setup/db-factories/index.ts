// Export all factories for easy importing
export * from "./user";
export * from "./game";
export * from "./journal";

// Re-export commonly used factory functions explicitly
export { createUser } from "./user";
export { createGame, createLibraryItem, createReview } from "./game";
export { createJournalEntry } from "./journal";

// Re-export the database instance for convenience
export { testDataBase as testDb } from "../database";
