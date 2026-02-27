"use client";

import { BookOpen, Dices, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useJournalEntryDialog } from "@/features/journal/hooks/use-journal-entry-dialog";
import { JournalQuickEntrySheet } from "@/features/journal/ui/journal-quick-entry-sheet";
import { useCommandPaletteContext } from "@/shared/components/command-palette/command-palette-provider";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/shared/lib/ui/utils";

import { getRandomWantToPlayAction } from "../server-actions";

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  isLoading?: boolean;
}

function QuickActionCard({
  title,
  description,
  icon,
  onClick,
  href,
  disabled = false,
  isLoading = false,
}: QuickActionCardProps) {
  const content = (
    <Card
      variant={href || onClick ? "interactive" : "default"}
      className={cn(
        "p-lg group relative overflow-hidden",
        "duration-normal ease-out-expo transition-all",
        (href || onClick) &&
          !disabled &&
          "hover:shadow-paper-md hover:scale-[1.02]",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <div className="gap-md flex items-start">
        <div className="text-primary duration-normal flex-shrink-0 transition-transform group-hover:scale-110">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold">{title}</p>
          <div className="body-sm text-muted-foreground line-clamp-2 block">
            {isLoading ? <Skeleton className="h-4 w-full" /> : description}
          </div>
        </div>
      </div>
    </Card>
  );

  if (href && !disabled) {
    return <Link href={href}>{content}</Link>;
  }

  if (onClick && !disabled) {
    return (
      <button type="button" onClick={onClick} className="w-full text-left">
        {content}
      </button>
    );
  }

  return content;
}

export function DashboardQuickActions() {
  const { open: openCommandPalette } = useCommandPaletteContext();
  const {
    isOpen: isJournalSheetOpen,
    open: openJournalSheet,
    close: closeJournalSheet,
  } = useJournalEntryDialog();

  const [randomGame, setRandomGame] = useState<{
    id: string;
    title: string;
    slug: string;
  } | null>(null);
  const [isLoadingGame, setIsLoadingGame] = useState(true);
  const [hasWantToPlayGames, setHasWantToPlayGames] = useState(true);

  useEffect(() => {
    async function fetchRandomGame() {
      setIsLoadingGame(true);
      const minDelay = new Promise((resolve) => setTimeout(resolve, 400));
      try {
        const [result] = await Promise.all([
          getRandomWantToPlayAction({}),
          minDelay,
        ]);
        if (result.success && result.data) {
          setRandomGame(result.data);
          setHasWantToPlayGames(true);
        } else {
          setRandomGame(null);
          setHasWantToPlayGames(false);
        }
      } catch (error) {
        console.error("Failed to fetch random game:", error);
        setRandomGame(null);
        setHasWantToPlayGames(false);
      } finally {
        setIsLoadingGame(false);
      }
    }

    void fetchRandomGame();
  }, []);

  const refreshRandomGame = async () => {
    setIsLoadingGame(true);
    const minDelay = new Promise((resolve) => setTimeout(resolve, 400));
    try {
      const [result] = await Promise.all([
        getRandomWantToPlayAction({}),
        minDelay,
      ]);
      if (result.success) {
        if (result.data) {
          setRandomGame(result.data);
          setHasWantToPlayGames(true);
        } else {
          setRandomGame(null);
          setHasWantToPlayGames(false);
        }
      }
    } catch (error) {
      console.error("Failed to refresh random game:", error);
    } finally {
      setIsLoadingGame(false);
    }
  };

  return (
    <>
      <div className="gap-lg grid md:grid-cols-3">
        <QuickActionCard
          title="Search for games"
          description="Find and add games to your library"
          icon={<Search className="h-5 w-5" />}
          onClick={openCommandPalette}
        />

        <QuickActionCard
          title="Write a thought"
          description="Quick journal entry about your current game"
          icon={<BookOpen className="h-5 w-5" />}
          onClick={openJournalSheet}
        />

        <div className="relative">
          <QuickActionCard
            title="What's next?"
            description={
              hasWantToPlayGames && randomGame
                ? randomGame.title
                : "No games in your Want to Play list"
            }
            icon={<Dices className="h-5 w-5" />}
            href={randomGame ? `/games/${randomGame.slug}` : undefined}
            disabled={!hasWantToPlayGames || !randomGame}
            isLoading={isLoadingGame}
          />
          {hasWantToPlayGames && randomGame && !isLoadingGame && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                void refreshRandomGame();
              }}
              className="absolute right-2 bottom-2"
              title="Get another suggestion"
            >
              <Dices className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <JournalQuickEntrySheet
        isOpen={isJournalSheetOpen}
        onClose={closeJournalSheet}
      />
    </>
  );
}
