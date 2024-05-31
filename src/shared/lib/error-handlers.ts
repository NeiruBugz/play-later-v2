export const sessionErrorHandler = () => {
  console.error("No authorization");
  throw new Error("No authorization");
};

export const commonErrorHandler = (errorMessage: string) => {
  console.error(errorMessage);
  throw new Error(errorMessage);
};
