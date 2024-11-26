export const sessionErrorHandler = () => {
  console.error("No authorization");
  throw new Error("No authorization");
};
