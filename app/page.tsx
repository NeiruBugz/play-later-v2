export default function Page() {
  return (
    <div className="min-h-screen flex-1">
      <section className="container flex columns-2 flex-col items-center md:h-[calc(100vh-64px-48px)] md:flex-row md:justify-center">
        <div className="md:max-w-[50%]">
          <h1 className="text-3xl font-bold tracking-tighter lg:text-5xl">
            Play Later
          </h1>
          <h2 className="text-3xl font-bold tracking-tighter lg:text-5xl">
            Remake is Coming
          </h2>
        </div>
      </section>
    </div>
  );
}
