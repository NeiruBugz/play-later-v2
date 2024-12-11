import { Header } from "@/src/widgets/header";
import { UpcomingReleases } from "@/src/widgets/upcoming-releases";

export default function DashboardPage() {
  return (
    <>
      <Header />
      <section className="container mt-2 pt-[60px]">
        <h1 className="font-bold md:text-xl xl:text-2xl">Stats</h1>
        <section className="mt-2 flex max-w-[100vw] flex-col gap-3 md:flex-row">
          <UpcomingReleases />
        </section>
      </section>
    </>
  );
}
