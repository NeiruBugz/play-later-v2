export const sessionErrorHandler = (error?: Error) => {
  throw new Error("No authorization", {
    cause: error,
  });
};
