import { format } from "date-fns";
import { unstable_noStore } from "next/cache";
import Markdown from "react-markdown";

import { Header } from "@/shared/components/header";
import {
  Body,
  Heading,
  ResponsiveHeading,
} from "@/shared/components/typography";

type ChangeLog = {
  id: string;
  date: string;
  title: string;
  post: string;
};

export default async function ChangelogPage() {
  unstable_noStore();

  const changelogs = await fetch(
    `https://projectplannerai.com/api/changelog?projectId=j5784wxtg8a8n6hn71mhcr3sq96vdjh7`
  ).then(async (res) => res.json() as Promise<ChangeLog[]>);

  return (
    <>
      <Header />
      <div className="container overflow-hidden px-4 py-8 pt-[60px]">
        <div className="mb-8 mt-4 flex flex-col gap-4">
          <ResponsiveHeading level={1}>Changelog</ResponsiveHeading>
          <Body variant="muted">View the changelog for the project</Body>
        </div>

        {changelogs.length === 0 && (
          <div className="text-lg font-semibold">No changelogs found</div>
        )}

        <ul className="flex list-disc flex-col text-foreground">
          {changelogs.map((changelog) => (
            <li
              key={changelog.id}
              className="relative flex w-full flex-col sm:flex-row"
            >
              <div className="flex w-full pb-4 sm:w-[200px] sm:pb-0">
                <p className="sans text-slate-11 text-sm font-normal leading-[1.6]">
                  <time className="sticky top-24 text-xl" dateTime="2024-03-06">
                    {format(changelog.date, "PP")}
                  </time>
                </p>
              </div>

              <div className="relative hidden sm:flex sm:w-[100px]">
                <div className="absolute left-0.5 top-0.5 h-full w-0.5"></div>
                <div className="sticky left-0 top-[102px] mt-1.5 h-1.5 w-1.5 rounded-full bg-white"></div>
              </div>

              <div className="w-full pb-16">
                <div className="space-y-4">
                  <div className="flex flex-col gap-4">
                    <Heading size="xl" level={2}>
                      {changelog.title}
                    </Heading>

                    <Markdown className="prose">{changelog.post}</Markdown>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
