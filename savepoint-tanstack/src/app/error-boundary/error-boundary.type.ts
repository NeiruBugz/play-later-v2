export type ErrorBoundaryProps = {
  error: Error;
};

export type ErrorView = {
  title: string;
  description: string;
  showLoginLink?: boolean;
};
