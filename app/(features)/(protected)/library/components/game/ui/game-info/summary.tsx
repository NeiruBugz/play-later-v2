export const Summary = ({ summary }: { summary: string }) => (
  <article>
    <p className="text-xl tracking-tighter text-gray-500 dark:text-gray-400 xl:text-2xl">
      {summary}
    </p>
  </article>
);
