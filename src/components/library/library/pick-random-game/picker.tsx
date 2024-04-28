"use client";

import { MemoizedChoice } from "@/src/components/library/library/pick-random-game/choice";
import { MemoizedControls } from "@/src/components/library/library/pick-random-game/controls";
import { getRandomItem } from "@/src/lib/utils";
import type { PickerProps } from "@/src/types/library/components";
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
