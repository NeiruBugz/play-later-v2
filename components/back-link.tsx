"use client";

import { PropsWithChildren } from "react";
import { useRouter } from "next/navigation";

export function BackLink({ children }: PropsWithChildren) {
  const router = useRouter();

  const onClick = () => {
    router.back();
  };

  return <div onClick={onClick}>{children}</div>;
}
