import "@testing-library/jest-dom/vitest";

import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";

import type { LibraryItemWithGame } from "@/entities/library-item/model";
import type { DashboardPageData } from "@/features/dashboard";
import type { UpcomingReleasesData } from "@/features/upcoming-releases";
import { DashboardPage } from "@/widgets/dashboard-page";
import { AboutPanel } from "@/widgets/game-detail/ui/about-panel/about-panel";
import { LibraryItemCard } from "@/widgets/library-item-card";
import { UpcomingReleasesPage } from "@/widgets/upcoming-releases-page";

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  useRouter: () => ({ invalidate: vi.fn() }),
  Link: ({
    to,
    href,
    params,
    search,
    children,
    ...rest
  }: {
    to?: string;
    href?: string;
    params?: Record<string, string>;
    search?: Record<string, string>;
    children: ReactNode;
  } & Record<string, unknown>) => {
    let resolvedHref = to ?? href ?? "";
    for (const [key, value] of Object.entries(params ?? {})) {
      resolvedHref = resolvedHref.replace(`$${key}`, value);
    }
    const query = search ? `?${new URLSearchParams(search).toString()}` : "";
    return (
      <a href={`${resolvedHref}${query}`} {...rest}>
        {children}
      </a>
    );
  },
}));
vi.mock("@/shared/lib/use-media-query", () => ({
  useIsDesktop: () => false,
  useMediaQuery: () => false,
}));
vi.mock("@/entities/session/model", () => ({ useEveningMinutes: () => 105 }));
vi.mock("@/features/command-palette", () => ({ openCommandPalette: vi.fn() }));
vi.mock("@/features/manage-library-entry/api/set-status-fn", () => ({
  setStatusFn: vi.fn(),
}));
vi.mock("@/features/manage-library-entry/api/undo-status-fn", () => ({
  undoStatusFn: vi.fn(),
}));
vi.mock("@/features/manage-library-entry/api/set-ownership-fn", () => ({
  setOwnershipFn: vi.fn(),
}));
vi.mock("@/features/manage-library-entry/api/delete-library-item-fn", () => ({
  deleteLibraryItemFn: vi.fn(),
}));
vi.mock("@/features/up-next/api/add-to-up-next-fn", () => ({
  addToUpNextFn: vi.fn(),
}));
vi.mock("@/features/up-next/api/remove-from-up-next-fn", () => ({
  removeFromUpNextFn: vi.fn(),
}));
vi.mock("@/shared/lib/igdb-image", () => ({
  buildCoverImageUrl: () => "https://images.igdb.com/cover.jpg",
  buildCoverImageProps: () => ({
    src: "https://images.igdb.com/cover.jpg",
    srcSet: undefined,
  }),
}));

export function renderHome(data: DashboardPageData) {
  return render(<DashboardPage data={data} />);
}

export function renderUpcomingReleases(data: UpcomingReleasesData) {
  return render(<UpcomingReleasesPage entries={data.entries} />);
}

export function renderLibraryCards(items: LibraryItemWithGame[]) {
  return render(
    <div>
      {items.map((item) => (
        <section key={item.id} aria-label={`${item.game.title} on grid`}>
          <LibraryItemCard item={item} />
        </section>
      ))}
      {items.map((item) => (
        <section key={item.id} aria-label={`${item.game.title} in list`}>
          <LibraryItemCard item={item} layout="row" />
        </section>
      ))}
    </div>
  );
}

export function renderGamePageAbout(game: LibraryItemWithGame["game"]) {
  return render(
    <AboutPanel
      summary={null}
      developer={null}
      releaseDate={game.releaseDate}
      releaseDatePrecision={game.releaseDatePrecision}
      timeToCreditsSeconds={null}
      timeToCompleteSeconds={null}
      themes={[]}
      genres={[]}
    />
  );
}
