"use client";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/src/shared/ui/chart";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { Bar, BarChart, BarProps, XAxis } from "recharts";

const chartConfig = {
  games: {
    label: "Games",
    color: "hsl(var(--chart-1))",
  },
  backlog: {
    label: "Backlogged",
  },
  playing: {
    label: "Playing",
  },
  completed: {
    label: "Completed",
  },
} satisfies ChartConfig;

export function Chart({
  data,
}: {
  data: Array<{ type: string; games: number }>;
}) {
  const router = useRouter();

  const onBarClick: BarProps["onClick"] = useCallback(
    (data: { [x: string]: any }) => {
      if (data["status"] === "WISHLIST") {
        router.replace("/wishlist");
        return;
      }

      router.replace(`/collection?status=${data["status"]}`);
    },
    [router]
  );

  return (
    <ChartContainer config={chartConfig} className="h-fit min-h-[290px] w-full">
      <BarChart
        accessibilityLayer
        data={data}
        margin={{
          top: 20,
        }}
      >
        <XAxis
          dataKey="type"
          tickLine={false}
          tickMargin={3}
          axisLine={false}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Bar dataKey="games" radius={2} width={40} onClick={onBarClick}></Bar>
      </BarChart>
    </ChartContainer>
  );
}
