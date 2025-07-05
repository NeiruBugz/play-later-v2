"use client";

import { ChevronDown } from "lucide-react";
import React, { useState } from "react";

import { cn } from "@/shared/lib";

import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

interface AdaptiveTabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}

interface AdaptiveTabsListProps {
  className?: string;
  children: React.ReactNode;
}

interface AdaptiveTabsTriggerProps {
  value: string;
  className?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

const AdaptiveTabsContext = React.createContext<{
  currentValue: string;
  onValueChange: (value: string) => void;
  triggers: Array<{
    value: string;
    label: string;
    icon?: React.ReactNode;
    disabled?: boolean;
  }>;
  registerTrigger: (trigger: {
    value: string;
    label: string;
    icon?: React.ReactNode;
    disabled?: boolean;
  }) => void;
}>({
  currentValue: "",
  onValueChange: () => {},
  triggers: [],
  registerTrigger: () => {},
});

export function AdaptiveTabs({
  defaultValue,
  value,
  onValueChange,
  className,
  children,
}: AdaptiveTabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [triggers, setTriggers] = useState<
    Array<{
      value: string;
      label: string;
      icon?: React.ReactNode;
      disabled?: boolean;
    }>
  >([]);

  const currentValue = value ?? internalValue;
  const handleValueChange = (newValue: string) => {
    if (!value) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  const registerTrigger = React.useCallback(
    (trigger: {
      value: string;
      label: string;
      icon?: React.ReactNode;
      disabled?: boolean;
    }) => {
      setTriggers((prev) => {
        const existing = prev.find((t) => t.value === trigger.value);
        if (existing) return prev;
        return [...prev, trigger];
      });
    },
    []
  );

  const contextValue = React.useMemo(
    () => ({
      currentValue,
      onValueChange: handleValueChange,
      triggers,
      registerTrigger,
    }),
    [currentValue, handleValueChange, triggers, registerTrigger]
  );

  return (
    <AdaptiveTabsContext.Provider value={contextValue}>
      <Tabs
        value={currentValue}
        onValueChange={handleValueChange}
        className={className}
      >
        {children}
      </Tabs>
    </AdaptiveTabsContext.Provider>
  );
}

export function AdaptiveTabsList({
  className,
  children,
}: AdaptiveTabsListProps) {
  const { currentValue, onValueChange, triggers } =
    React.useContext(AdaptiveTabsContext);

  const currentTrigger = triggers.find((t) => t.value === currentValue);

  return (
    <>
      {/* Mobile: Dropdown */}
      <div className="mb-4 block md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-10 w-full justify-between">
              <div className="flex items-center gap-2">
                {currentTrigger?.icon && (
                  <span className="text-sm">{currentTrigger.icon}</span>
                )}
                <span>{currentTrigger?.label || "Select tab"}</span>
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            {triggers.map((trigger) => (
              <DropdownMenuItem
                key={trigger.value}
                onClick={() => onValueChange(trigger.value)}
                disabled={trigger.disabled}
                className="flex items-center gap-3"
              >
                {trigger.icon && (
                  <span className="text-sm">{trigger.icon}</span>
                )}
                <span>{trigger.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Desktop: Traditional Tabs */}
      <TabsList className={cn("mb-4 hidden md:flex", className)}>
        {children}
      </TabsList>
    </>
  );
}

export function AdaptiveTabsTrigger({
  value,
  className,
  children,
  icon,
  disabled = false,
}: AdaptiveTabsTriggerProps) {
  const { registerTrigger } = React.useContext(AdaptiveTabsContext);

  React.useEffect(() => {
    registerTrigger({
      value,
      label: typeof children === "string" ? children : value,
      icon,
      disabled,
    });
  }, [value, children, icon, disabled, registerTrigger]);

  return (
    <TabsTrigger
      value={value}
      className={cn("flex items-center gap-2", className)}
      disabled={disabled}
    >
      {icon && <span className="text-sm">{icon}</span>}
      {children}
    </TabsTrigger>
  );
}

export const AdaptiveTabsContent = TabsContent;
