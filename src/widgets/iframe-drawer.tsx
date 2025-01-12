"use client";

import { env } from "@/env.mjs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/src/shared/ui/sheet";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { MouseEvent, useEffect, useRef, useState } from "react";
import { Button } from "../shared/ui/button";

type IframePostMessage = {
  type: string;
  payload: any;
};

export function IframeDrawer({ igdbId }: { igdbId: number }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const iframeSrc = `${env.NEXT_PUBLIC_IFRAME_HOST}/?igdbId=${igdbId}`;
  const [isOpen, setIsOpen] = useState(false);

  const sendMessageToIframe = (message: IframePostMessage) => {
    if (iframeRef.current) {
      iframeRef?.current?.contentWindow?.postMessage(
        message,
        env.NEXT_PUBLIC_IFRAME_HOST
      );
    }
  };

  useEffect(() => {
    const handleIframeLoad = () => {
      sendMessageToIframe({
        type: "INIT",
        payload: { igdbId },
      });
    };

    const iframeCurrent = iframeRef.current;
    iframeCurrent?.addEventListener("load", handleIframeLoad);

    return () => {
      iframeCurrent?.removeEventListener("load", handleIframeLoad);
    };
  }, [igdbId]);

  const onSheetOpen = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setIsOpen((prev) => !prev);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild onClick={onSheetOpen}>
        <Button variant="outline" className="h-8 w-8">
          <InfoCircledIcon className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-1/2 bg-white">
        <SheetHeader>
          <SheetTitle className="bg-white">
            {iframeRef?.current?.title}
          </SheetTitle>
        </SheetHeader>
        <div className="h-full">
          <iframe
            ref={iframeRef}
            src={iframeSrc}
            style={{ width: "100%", height: "100%", border: "none" }}
            title="IGDB Game data"
          ></iframe>
        </div>
      </SheetContent>
    </Sheet>
  );
}
