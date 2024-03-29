export const Summary = ({ summary }: { summary: string }) => (
  <article>
    <h3 className="my-2 scroll-m-20 text-2xl font-semibold tracking-tight">
      Description
    </h3>
    <p className="leading-7 [&:not(:first-child)]:mt-6">{summary}</p>
  </article>
);
