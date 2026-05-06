// Temporary dev route — spec 021 Slice 8 verification. Remove at cutover.
import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

import { searchGamesFn } from "@/features/search-games/api/search-games";
import type { SearchGamesResult } from "@/shared/api/igdb";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

export const Route = createFileRoute("/dev/igdb-search")({
  component: DevIgdbSearch,
});

type Status = "idle" | "pending" | "success" | "error";

function DevIgdbSearch() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<SearchGamesResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!query.trim()) return;
    setStatus("pending");
    setError(null);
    try {
      const data = await searchGamesFn({ data: { name: query.trim() } });
      setResult(data);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }

  return (
    <main className="page-wrap px-4 py-12">
      <Card className="mx-auto max-w-2xl space-y-4 p-6">
        <h1 className="text-2xl font-bold">Dev: IGDB search</h1>
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="flex-1">
            <Label htmlFor="igdb-query">Query</Label>
            <Input
              id="igdb-query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="celeste"
            />
          </div>
          <Button type="submit" disabled={status === "pending"}>
            Submit
          </Button>
        </form>
        {status === "pending" && <p>Loading…</p>}
        {status === "error" && error && (
          <div role="alert" className="text-red-600">
            {error}
          </div>
        )}
        {status === "success" && result && (
          <ul className="space-y-2">
            {result.games.map((g) => (
              <li key={g.id} className="rounded border p-2 text-sm">
                <div>
                  <strong>{g.name}</strong> (id: {g.id}, slug: {g.slug})
                </div>
                {g.cover?.image_id && <div>cover: {g.cover.image_id}</div>}
                {g.first_release_date && (
                  <div>
                    released:{" "}
                    {new Date(g.first_release_date * 1000)
                      .toISOString()
                      .slice(0, 10)}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        <small className="text-muted-foreground block">
          Temporary dev route — see spec 021 Slice 8. Will be removed at
          cutover.
        </small>
      </Card>
    </main>
  );
}
