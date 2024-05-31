import { GameStatus, PurchaseType } from "@prisma/client";
import React from "react";

import {
  mapPlatformToSelectOption,
  DescriptionStatusMapping,
  DescriptionPurchaseTypeMapping,
} from "@/src/shared/lib/enum-to-ui-mappers";
import { uppercaseToNormal } from "@/src/shared/lib/string-functions";

export function FormDescription({
  className,
}: {
  className: string | undefined;
}) {
  return (
    <legend className={className}>
      <h2 className="font-bold">Description</h2>
      <h3 className="font-bold">Statuses</h3>
      <ul>
        {Object.entries(GameStatus).map(([key, value]) => (
          <li
            className="border-b py-1 text-xs leading-7 last-of-type:border-none md:text-[14px]"
            key={key}
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
            className="border-b py-1 text-xs leading-7 last-of-type:border-none md:text-[14px]"
            key={key}
          >
            {uppercaseToNormal(value)} - {DescriptionPurchaseTypeMapping[value]}
          </li>
        ))}
      </ul>
    </legend>
  );
}
