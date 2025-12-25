import { http, HttpResponse } from "msw";

export const igdbHandlers = [
  http.post("https://api.igdb.com/v4/games", async ({ request }) => {
    const body = await request.text();

    const searchMatch = body.match(/search\s+"([^"]+)"/);

    if (searchMatch && searchMatch[1]) {
      return HttpResponse.json([
        {
          id: 1,
          name: "The Legend of Zelda: Breath of the Wild",
          slug: "the-legend-of-zelda-breath-of-the-wild",
          cover: { id: 1, image_id: "co3p2d" },
          platforms: [{ id: 130, name: "Nintendo Switch" }],
          first_release_date: 1488326400,
          game_type: 0,
        },
        {
          id: 2,
          name: "The Legend of Zelda: Ocarina of Time",
          slug: "the-legend-of-zelda-ocarina-of-time",
          cover: { id: 2, image_id: "co1234" },
          platforms: [{ id: 4, name: "Nintendo 64" }],
          first_release_date: 911606400,
          game_type: 0,
        },
      ]);
    }

    return HttpResponse.json([]);
  }),

  http.post("https://api.igdb.com/v4/platforms", () => {
    return HttpResponse.json([
      { id: 130, name: "Nintendo Switch" },
      { id: 4, name: "Nintendo 64" },
      { id: 6, name: "PC (Microsoft Windows)" },
      { id: 48, name: "PlayStation 4" },
      { id: 49, name: "Xbox One" },
    ]);
  }),
];
