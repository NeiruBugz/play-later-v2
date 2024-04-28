"use client";

import { MemoizedChoice } from "@/app/(protected)/library/components/library/pick-random-game/choice";
import { MemoizedControls } from "@/app/(protected)/library/components/library/pick-random-game/controls";
import type { PickerProps } from "@/app/(protected)/library/lib/types/components";
import { getRandomItem } from "@/lib/utils";
import { type Game } from "@prisma/client";
import { useCallback, useEffect, useRef, useState } from "react";

function Picker({ closeDialog, items }: PickerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentChoice, setCurrentChoice] = useState<Game>(
    getRandomItem(items) ?? items[0]
  );

  const intervalRef = useRef<null | number>(null);
  const intervalDuration = useRef(75);
  const duration = useRef(1000);

  const start = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = window.setInterval(
      setChoice,
      intervalDuration.current
    );
    setIsRunning(true);

    setTimeout(() => {
      if (isRunning) {
        stop();
      }
    }, duration.current);
  };

  const stop = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
    }
    setIsRunning(false);
  }, []);

  const pickChoice = useCallback(() => {
    return getRandomItem(items) ?? items[0];
  }, [items]);

  const setChoice = useCallback(() => {
    setCurrentChoice(pickChoice());
  }, [pickChoice]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center">
      <MemoizedChoice
        afterClick={closeDialog}
        choice={currentChoice}
        isRunning={isRunning}
      />
      <MemoizedControls
        hasChoice={currentChoice !== undefined}
        isRunning={isRunning}
        start={start}
        stop={stop}
      />
    </div>
  );
}

export { Picker };
