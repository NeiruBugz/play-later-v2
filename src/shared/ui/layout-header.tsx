export const LayoutHeader = ({ heading }: { heading: string }) => (
  <header className="container sticky top-0 z-40 bg-background">
    <div className="flex flex-wrap justify-between">
      <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl">
        {heading}
      </h1>
    </div>
  </header>
);
