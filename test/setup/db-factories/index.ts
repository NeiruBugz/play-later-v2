// Export all factories for easy importing
export * from "./user";
export * from "./game";
export * from "./journal";

// Re-export the database instance for convenience
export { testDataBase as testDb } from "../database";
