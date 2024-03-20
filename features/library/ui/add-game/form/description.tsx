import React from "react";
import { GameStatus, PurchaseType } from "@prisma/client";

import {
  DescriptionPurchaseTypeMapping,
  DescriptionStatusMapping,
  mapPlatformToSelectOption,
  uppercaseToNormal,
} from "@/lib/utils";

export function FormDescription() {
  return (
    <legend>
      <h2 className="font-bold">Description</h2>
      <h3 className="font-bold">Statuses</h3>
      <ul>
        {Object.entries(GameStatus).map(([key, value]) => (
          <li
            key={key}
            className="border-b py-1 text-xs leading-7 last-of-type:border-none md:text-[14px]"
          >
            {mapPlatformToSelectOption(value)} -{" "}
            {DescriptionStatusMapping[value]}
          </li>
        ))}
      </ul>
      <h3 className="font-bold">Purchase types</h3>
      <ul>
        {Object.entries(PurchaseType).map(([key, value]) => (
          <li
            key={key}
            className="border-b py-1 text-xs leading-7 last-of-type:border-none md:text-[14px]"
          >
            {uppercaseToNormal(value)} - {DescriptionPurchaseTypeMapping[value]}
          </li>
        ))}
      </ul>
    </legend>
  );
}
