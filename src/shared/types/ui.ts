export type GenericPageProps = {
  params: Promise<Record<string, string>>;
  searchParams: Promise<URLSearchParams>;
};
