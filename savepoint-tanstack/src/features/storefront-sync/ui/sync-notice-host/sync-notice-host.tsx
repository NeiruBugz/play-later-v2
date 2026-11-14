import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { markSyncNoticeSeenFn } from "../../api/mark-sync-notice-seen";
import { formatSyncSummary } from "../../lib";
import type { SteamSyncStatus } from "../../model/types";
import {
  STEAM_SYNC_STATUS_QUERY_KEY,
  steamSyncStatusQueryOptions,
} from "../steam-sync-status";
import {
  NOTICE_POLL_INTERVAL_MS,
  NOTICE_STALE_TIME_MS,
  noticeToastId,
  shouldPollNotice,
} from "./sync-notice-host.utility";

export function SyncNoticeHost() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: status } = useQuery({
    ...steamSyncStatusQueryOptions,
    staleTime: NOTICE_STALE_TIME_MS,
    refetchInterval: (query) =>
      shouldPollNotice(query.state.data) ? NOTICE_POLL_INTERVAL_MS : false,
  });
  const announcedJobIds = useRef(new Set<string>());
  const markedSeenJobIds = useRef(new Set<string>());

  useEffect(() => {
    if (status?.status !== "FINISHED") return;
    const { jobId } = status;

    if (status.noticeSeen) {
      if (announcedJobIds.current.has(jobId))
        toast.dismiss(noticeToastId(jobId));
      return;
    }
    if (announcedJobIds.current.has(jobId)) return;
    announcedJobIds.current.add(jobId);

    const markSeen = async () => {
      if (markedSeenJobIds.current.has(jobId)) return;
      markedSeenJobIds.current.add(jobId);
      queryClient.setQueryData<SteamSyncStatus | null>(
        STEAM_SYNC_STATUS_QUERY_KEY,
        (current) =>
          current?.jobId === jobId ? { ...current, noticeSeen: true } : current
      );
      try {
        await markSyncNoticeSeenFn({ data: { jobId } });
      } catch {
        markedSeenJobIds.current.delete(jobId);
      }
    };

    toast.success("Steam sync finished", {
      description: formatSyncSummary(status),
      duration: Infinity,
      id: noticeToastId(jobId),
      action: {
        label: "Review games",
        onClick: async () => {
          await markSeen();
          await navigate({ to: "/steam/games" });
        },
      },
      onDismiss: () => {
        void markSeen();
      },
    });
  }, [status, queryClient, navigate]);

  return null;
}
