export type ErrorBoundaryProps = {
  error: unknown;
};

export type ErrorView = {
  title: string;
  description: string;
  showLoginLink?: boolean;
};
