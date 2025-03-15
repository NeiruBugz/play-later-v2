'use client';

import { useState, useEffect } from 'react';
import { Button, Spinner } from '@chakra-ui/react';
import { FiPlus, FiCheck, FiAlertTriangle } from 'react-icons/fi';
import { useSingleGameImport } from '../hooks/use-bulk-import';
import { toaster } from '@/shared/components/ui/toaster';
import { Tooltip } from '@/shared/components/ui/tooltip';
import { SteamGame } from '../types';

interface SingleImportButtonProps {
  /** The Steam ID to import the game from */
  steamId: string;
  /** The game object to import */
  game: SteamGame;
  /** Whether the button should be disabled */
  disabled?: boolean;
  /** Optional callback function called when an import is completed */
  onImportCompleted?: () => void;
  /** Whether to show as an icon button (default) or a text button */
  variant?: 'icon' | 'text';
}

/**
 * SingleImportButton Component
 *
 * Provides a button for importing a single game from Steam
 *
 * @param props Component props
 * @returns React component
 */
export function SingleImportButton({
  steamId,
  game,
  disabled = false,
  onImportCompleted,
  variant = 'icon',
}: SingleImportButtonProps) {
  const { importGame, isImporting, error, clearError } = useSingleGameImport();
  const [isLoading, setIsLoading] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importError, setImportError] = useState(false);

  // Reset error state when component unmounts or when error changes
  useEffect(() => {
    if (error) {
      setImportError(true);

      // Reset error state after 3 seconds
      const timer = setTimeout(() => {
        setImportError(false);
        clearError();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // If the game is already in the backlog, don't show the button
  if (game.alreadyInBacklog) {
    return null;
  }

  /**
   * Handles the import process when the button is clicked
   */
  const handleImport = async () => {
    if (!steamId.trim()) {
      toaster.create({
        title: 'Steam ID required',
        description: 'Please enter your Steam ID to import games',
        type: 'error',
        duration: 5000,
      });
      return;
    }

    setIsLoading(true);
    setImportSuccess(false);
    setImportError(false);

    try {
      const result = await importGame(steamId, game.appid);

      if (result.action === 'imported') {
        setImportSuccess(true);
        toaster.create({
          title: 'Game imported',
          description: `"${game.name}" has been added to your backlog`,
          type: 'success',
          duration: 5000,
        });
      } else if (result.action === 'skipped') {
        toaster.create({
          title: 'Game skipped',
          description: `"${game.name}" was skipped: ${result.game?.reason || 'Already in backlog'}`,
          type: 'info',
          duration: 5000,
        });
      }

      if (onImportCompleted) {
        onImportCompleted();
      }

      // Reset success state after 2 seconds
      if (result.action === 'imported') {
        setTimeout(() => {
          setImportSuccess(false);
        }, 2000);
      }
    } catch (error) {
      setImportError(true);
      toaster.create({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        type: 'error',
        duration: 5000,
      });

      // Reset error state after 3 seconds
      setTimeout(() => {
        setImportError(false);
      }, 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const isButtonDisabled =
    disabled || isLoading || isImporting || !steamId.trim();

  // Determine tooltip content based on state
  const getTooltipContent = () => {
    if (importError || error) {
      return 'Error importing game. Click to try again.';
    }

    if (importSuccess) {
      return 'Game successfully added to your backlog!';
    }

    return 'Add this game to your backlog';
  };

  // Determine button content based on state
  const getButtonContent = () => {
    if (isLoading || isImporting) {
      return <Spinner size="sm" />;
    }

    if (importSuccess) {
      return <FiCheck />;
    }

    if (importError || error) {
      return <FiAlertTriangle />;
    }

    return variant === 'icon' ? (
      <FiPlus />
    ) : (
      <>
        <FiPlus style={{ marginRight: '8px' }} />
        Import Game
      </>
    );
  };

  // Determine button color based on state
  const getButtonColor = () => {
    if (importSuccess) {
      return 'green';
    }

    if (importError || error) {
      return 'red';
    }

    return 'blue';
  };

  if (variant === 'icon') {
    return (
      <Tooltip
        content={getTooltipContent()}
        positioning={{ placement: 'top' }}
        showArrow
      >
        <Button
          aria-label="Import game"
          colorPalette={getButtonColor()}
          variant="ghost"
          size="sm"
          p={1}
          minW={8}
          onClick={handleImport}
          disabled={isButtonDisabled}
        >
          {getButtonContent()}
        </Button>
      </Tooltip>
    );
  }

  return (
    <Tooltip
      content={getTooltipContent()}
      positioning={{ placement: 'top' }}
      showArrow
    >
      <Button
        colorPalette={getButtonColor()}
        variant="outline"
        size="sm"
        onClick={handleImport}
        disabled={isButtonDisabled}
      >
        {getButtonContent()}
      </Button>
    </Tooltip>
  );
}
