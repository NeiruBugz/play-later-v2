import { SiteHeader } from "@/src/components/shared/page-header";
import { Badge } from "@/src/components/ui/badge";
import { getMyIssues } from "@/src/packages/linear";

export default async function RoadmapPage() {
  const roadmap = await getMyIssues();
  return (
    <div>
      <SiteHeader />
      <header className="container  bg-background">
        <div className="flex flex-wrap justify-between">
          <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl">
            Roadmap
          </h1>
        </div>
      </header>
      <div className="container mx-auto mt-4 flex h-full w-full flex-col gap-3">
        {roadmap.map((issue) => (
          <div
            className="flex flex-col gap-3 rounded border p-4"
            key={issue.id}
          >
            <p className="font-medium">{issue.title}</p>{" "}
            {issue.state ? (
              <Badge className="w-fit">{issue.state}</Badge>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
