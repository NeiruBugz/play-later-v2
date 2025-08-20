import { Suspense } from "react";

import {
  AccordionContent,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";

import { type FranchiseProps } from "../types";
import { FranchiseGamesGrid } from "./franchise-games-grid";
import { FranchiseGamesSkeleton } from "./franchise-games-skeleton";

export function Franchise({ name, games }: FranchiseProps) {
  return (
    <>
      <AccordionTrigger>
        <h3 className="mb-2 font-medium">{name}</h3>
      </AccordionTrigger>
      <AccordionContent>
        <Suspense
          fallback={<FranchiseGamesSkeleton gameCount={games?.length || 6} />}
        >
          <FranchiseGamesGrid games={games} />
        </Suspense>
      </AccordionContent>
    </>
  );
}
