const BeatingTime = ({ label, time }: { label: string; time: number }) => (
  <div className="flex items-center justify-between">
    <p>{label}:&nbsp;</p>
    <div className="flex items-center gap-1">
      <span className="font-medium">{time} h.</span>
    </div>
  </div>
);

export const HowLongToBeat = ({
  completionist,
  main,
  mainExtra,
}: {
  completionist: number;
  main: number;
  mainExtra: number;
}) => (
  <section>
    <h3 className="my-2 scroll-m-20 text-2xl font-semibold tracking-tight">
      Time to beat
    </h3>
    <section className="flex flex-col gap-2">
      <BeatingTime label="Main Story" time={main} />
      <BeatingTime label="Main + Extra" time={mainExtra} />
      <BeatingTime label="100% Completion" time={completionist} />
    </section>
  </section>
);
