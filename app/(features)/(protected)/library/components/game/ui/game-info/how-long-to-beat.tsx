import { Clock } from "lucide-react";

export const HowLongToBeat = ({
  main,
}: {
  main: number;
  mainExtra: number;
  completionist: number;
}) => (
  <section>
    <h3 className="my-2 scroll-m-20 text-2xl font-semibold tracking-tight">
      Beating times
    </h3>
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <p>Main story</p>
        <div className="flex items-center gap-1">
          <Clock /> <span>{main} h.</span>
        </div>
      </div>
    </section>
  </section>
);
