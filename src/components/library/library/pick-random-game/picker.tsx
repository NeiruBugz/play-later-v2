"use client";

import type { PickerItem } from "@/src/types/library/actions";
import type { PickerProps } from "@/src/types/library/components";

import { PickerChoice } from "@/src/components/library/library/pick-random-game/choice";
import { PickerControls } from "@/src/components/library/library/pick-random-game/controls";
import { getRandomItem } from "@/src/packages/utils";
import { useCallback, useEffect, useRef, useState } from "react";

function Picker({ closeDialog, items }: PickerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentChoice, setCurrentChoice] = useState<PickerItem>(
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
      <PickerChoice
        afterClick={closeDialog}
        choice={currentChoice}
        isRunning={isRunning}
      />
      <PickerControls
        hasChoice={currentChoice !== undefined}
        isRunning={isRunning}
        start={start}
        stop={stop}
      />
    </div>
  );
}

export { Picker };
