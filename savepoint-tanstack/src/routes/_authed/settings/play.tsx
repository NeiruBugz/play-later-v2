import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { invalidateCurrentUser, useEveningMinutes } from "@/entities/session";
import { setEveningLengthFn } from "@/features/set-evening-length";
import { EVENING_MINUTES_CHOICES, formatEvenings } from "@/shared/lib/evenings";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";

const EXAMPLE_GAME_HOURS = 14.5;
const SECONDS_PER_HOUR = 3600;
const MINUTES_PER_HOUR = 60;

export const Route = createFileRoute("/_authed/settings/play")({
  component: SettingsPlayPage,
});

function formatHours(minutes: number) {
  return `${minutes / MINUTES_PER_HOUR} h`;
}

function SettingsPlayPage() {
  const queryClient = useQueryClient();
  const eveningMinutes = useEveningMinutes();
  const saveEveningLength = useMutation({
    mutationFn: (minutes: number) =>
      setEveningLengthFn({ data: { eveningMinutes: minutes } }),
    onSuccess: () => invalidateCurrentUser(queryClient),
  });

  const exampleEvenings = formatEvenings(
    EXAMPLE_GAME_HOURS * SECONDS_PER_HOUR,
    eveningMinutes
  )?.replace(/^About/, "about");

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">How long is an evening for you?</h2>
      <RadioGroup
        aria-label="Evening length"
        value={eveningMinutes}
        onValueChange={(minutes) => saveEveningLength.mutate(Number(minutes))}
      >
        {EVENING_MINUTES_CHOICES.map((minutes) => (
          <RadioGroupItem key={minutes} value={minutes}>
            {formatHours(minutes)}
          </RadioGroupItem>
        ))}
      </RadioGroup>
      <p className="text-sm text-muted-foreground">
        A {EXAMPLE_GAME_HOURS}-hour game is {exampleEvenings}.
      </p>
    </div>
  );
}
