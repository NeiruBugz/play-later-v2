import { CalendarClock } from "lucide-react";
import { Suspense } from "react";

import igdbApi from "@/src/shared/api/igdb";

import { DashboardItemLayout } from "./dashboard-item-layout";
import { EventWidget } from "./event-modal";

export async function UpcomingEvents() {
  const events = await igdbApi.getEvents();

  if (!events) return null;

  return (
    <DashboardItemLayout
      heading={
        <>
          <CalendarClock className="size-4" />
          Upcoming Events
        </>
      }
    >
      <Suspense fallback="Loading...">
        <div className="flex w-full flex-col flex-wrap gap-2 overflow-auto md:flex-row">
          {events.map((event) => (
            <EventWidget event={event} key={event.id} />
          ))}
        </div>
      </Suspense>
    </DashboardItemLayout>
  );
}
