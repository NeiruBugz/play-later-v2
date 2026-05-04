import { vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/env.mjs", () => ({
  env: {
    AUTH_COGNITO_ID: "test-cognito-id",
    AUTH_COGNITO_SECRET: "test-cognito-secret",
    AUTH_COGNITO_ISSUER:
      "https://cognito-idp.us-east-1.amazonaws.com/test-pool",
    AUTH_SECRET: "test-secret-key-must-be-at-least-32-chars-long",
    AUTH_URL: "http://localhost:3000",
    AUTH_ENABLE_CREDENTIALS: false,

    IGDB_CLIENT_ID: "test-igdb-client-id",
    IGDB_CLIENT_SECRET: "test-igdb-client-secret",

    POSTGRES_URL: "postgresql://postgres:postgres@localhost:6432/test",
    POSTGRES_PRISMA_URL: "postgresql://postgres:postgres@localhost:6432/test",
    POSTGRES_URL_NO_SSL: "postgresql://postgres:postgres@localhost:6432/test",
    POSTGRES_URL_NON_POOLING:
      "postgresql://postgres:postgres@localhost:6432/test",
    POSTGRES_HOST: "localhost",
    POSTGRES_USER: "postgres",
    POSTGRES_PASSWORD: "postgres",
    POSTGRES_DATABASE: "test",

    NODE_ENV: "test",
    STEAM_API_KEY: "test-steam-key",

    AWS_REGION: "us-east-1",
    AWS_ENDPOINT_URL: "http://localhost:4568",
    AWS_ACCESS_KEY_ID: "test-access-key",
    AWS_SECRET_ACCESS_KEY: "test-secret-key",
    S3_BUCKET_NAME: "savepoint-dev",
    S3_AVATAR_PATH_PREFIX: "user-avatars/",
  },
}));

vi.mock("@/shared/lib/library-status", () => {
  const MockIcon = ({ className }: { className?: string }) => null;
  const createStatusConfig = () => [
    {
      value: "UP_NEXT",
      label: "Up Next",
      description: "Want to play or replay",
      badgeVariant: "upNext",
      icon: MockIcon,
      ariaLabel: "Up Next",
    },
    {
      value: "PLAYING",
      label: "Playing",
      description: "Actively engaged",
      badgeVariant: "playing",
      icon: MockIcon,
      ariaLabel: "Playing",
    },
    {
      value: "SHELF",
      label: "Shelf",
      description: "Own it, sitting there",
      badgeVariant: "shelf",
      icon: MockIcon,
      ariaLabel: "On Shelf",
    },
    {
      value: "PLAYED",
      label: "Played",
      description: "Have experienced",
      badgeVariant: "played",
      icon: MockIcon,
      ariaLabel: "Played",
    },
    {
      value: "WISHLIST",
      label: "Wishlist",
      description: "Want it someday",
      badgeVariant: "wishlist",
      icon: MockIcon,
      ariaLabel: "Wishlisted",
    },
  ];

  const configArray = createStatusConfig();
  const configMap = new Map(configArray.map((c) => [c.value, c]));

  return {
    LIBRARY_STATUS_CONFIG: configArray,
    LIBRARY_STATUS_MAP: configMap,
    getStatusLabel: vi.fn((status: string) => {
      return configMap.get(status)?.label ?? status;
    }),
    getStatusVariant: vi.fn((status: string) => {
      return configMap.get(status)?.badgeVariant ?? "secondary";
    }),
    getStatusIcon: vi.fn(() => MockIcon),
    getStatusConfig: vi.fn((status: string) => {
      return configMap.get(status);
    }),
    shouldShowBadge: vi.fn((status: string) => {
      return status !== "SHELF" && status !== "WISHLIST";
    }),
    getUpNextLabel: vi.fn((hasBeenPlayed: boolean) => {
      return hasBeenPlayed ? "Replay" : "Up Next";
    }),
    getStatusActions: vi.fn(() => []),
  };
});

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    const redirectError = new Error("NEXT_REDIRECT");
    (redirectError as Error & { digest?: string }).digest = "NEXT_REDIRECT";
    throw redirectError;
  }),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));
