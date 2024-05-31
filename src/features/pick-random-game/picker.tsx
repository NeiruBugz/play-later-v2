"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getRandomItem } from "@/src/shared/lib/array-functions";

import { PickerChoice } from "./choice";
import { PickerControls } from "./controls";
import type { PickerItem, PickerProps } from "./types";

function Picker({ closeDialog, items }: PickerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentChoice, setCurrentChoice] = useState<PickerItem>(
    getRandomItem<PickerItem>(items) ?? items[0]
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
    return getRandomItem<PickerItem>(items) ?? items[0];
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
