export const Summary = ({ summary }: { summary: string }) => (
  <article>
    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
      Description
    </h3>
    <p className="leading-7 [&:not(:first-child)]:mt-3">{summary}</p>
  </article>
);
