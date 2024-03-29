export const HowLongToBeat = ({
  main,
  mainExtra,
  completionist,
}: {
  main: number;
  mainExtra: number;
  completionist: number;
}) => (
  <section>
    <h3 className="my-2 scroll-m-20 text-2xl font-semibold tracking-tight">
      Beating times
    </h3>
    <section className="flex max-w-fit items-center gap-4 border-y-2">
      <div className="p-2">
        <p className="font-medium leading-7">Main </p>
        <p className="leading-7">{main} h</p>
      </div>
      <div className="border-x-2 p-2">
        <p className="font-medium leading-7">Main + Extra</p>
        <p className="leading-7">{mainExtra} h</p>
      </div>
      <div className="p-2">
        <p className="font-medium leading-7">Completionist</p>
        <p className="leading-7">{completionist} h</p>
      </div>
    </section>
  </section>
);
