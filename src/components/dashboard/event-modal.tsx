import { Button } from "@/src/components/ui/button";
import { IMAGE_API, IMAGE_SIZES } from "@/src/packages/config/site";
import igdbApi from "@/src/packages/igdb-api";
import { Event } from "@/src/packages/types/igdb";
import { formatISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const GOOGLE_CALENDAR_LINK =
  "https://calendar.google.com/calendar/u/0/r/eventedit";

const buildGoogleCalendarUrl = ({
  details,
  endTime,
  name,
  startTime,
}: {
  details: Event["description"];
  endTime: Event["end_time"];
  name: Event["name"];
  startTime: Event["start_time"];
}) => {
  const startToISO = formatISO(new Date(startTime * 1000), { format: "basic" });
  const endToISO = endTime
    ? formatISO(new Date(endTime * 1000), { format: "basic" })
    : "";
  const datesParam = endToISO ? `${startToISO}/${endToISO}` : startToISO;
  const googleCalendarUrl = new URL(GOOGLE_CALENDAR_LINK);
  googleCalendarUrl.searchParams.set("text", name);
  googleCalendarUrl.searchParams.set("details", details || "");
  if (startToISO) {
    googleCalendarUrl.searchParams.set("dates", datesParam);
  }

  return googleCalendarUrl.toString();
};

const getEventImage = async (eventLogoId: Event["event_logo"]) => {
  const imageData = await igdbApi.getEventLogo(eventLogoId);

  if (imageData?.length) {
    return imageData[0];
  }
  return undefined;
};

export async function EventWidget({ event }: { event: Event }) {
  const imageData = await getEventImage(event.event_logo);

  const calendarUrl = buildGoogleCalendarUrl({
    details: event.description,
    endTime: event.end_time,
    name: event.name,
    startTime: event.start_time,
  });

  return (
    <div className="mx-auto max-w-[360px]">
      <div className="relative aspect-video min-w-[320px] max-w-[360px] overflow-hidden rounded-lg">
        {imageData?.image_id ? (
          <Image
            alt={`${event.name} logo`}
            height={200}
            src={`${IMAGE_API}/${IMAGE_SIZES["hd"]}/${imageData.image_id}.png`}
            style={{
              objectFit: "contain",
            }}
            width={350}
          />
        ) : null}
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-gray-900/80 to-transparent p-4 md:p-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white md:text-3xl">
              {event.name}
            </h2>
            <div className="flex items-center gap-2">
              <Button
                className="w-full"
                disabled={!event.live_stream_url}
                variant={event.live_stream_url ? "default" : "secondary"}
              >
                {event.live_stream_url ? (
                  <Link href={event.live_stream_url} target="_blank">
                    Join Live Stream
                  </Link>
                ) : (
                  "Soon"
                )}
              </Button>
              <Button
                size="icon"
                variant={!event.live_stream_url ? "default" : "secondary"}
              >
                <Link
                  className="flex items-center px-2"
                  href={calendarUrl}
                  target="_blank"
                >
                  <CalendarIcon className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
