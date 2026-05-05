import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/journal")({
  component: JournalPage,
});

function JournalPage() {
  return (
    <main className="container mx-auto px-4 py-6">
      <h1 className="text-h1 mb-4">Journal</h1>
      <p>Coming soon.</p>
    </main>
  );
}
