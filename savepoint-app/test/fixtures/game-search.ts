import { http, HttpResponse } from "msw";

export const gameSearchHandlers = [
  http.get("*/api/games/search", ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get("q");

    if (!query || query.length < 3) {
      return HttpResponse.json(
        { error: "Invalid search parameters" },
        { status: 400 }
      );
    }

    if (query === "zelda") {
      return HttpResponse.json({
        games: [
          {
            id: 1,
            name: "The Legend of Zelda: Breath of the Wild",
            game_type: 0,
            cover: { image_id: "co3p2d" },
            platforms: [{ name: "Nintendo Switch" }],
            first_release_date: 1488326400,
          },
          {
            id: 2,
            name: "The Legend of Zelda: Ocarina of Time",
            game_type: 0,
            cover: { image_id: "co1234" },
            platforms: [{ name: "Nintendo 64" }],
            first_release_date: 911606400,
          },
        ],
        count: 2,
      });
    }

    if (query === "mario") {
      return HttpResponse.json({
        games: [
          {
            id: 3,
            name: "Super Mario Odyssey",
            game_type: 0,
            cover: { image_id: "co5678" },
            platforms: [{ name: "Nintendo Switch" }],
            first_release_date: 1509062400,
          },
        ],
        count: 1,
      });
    }

    return HttpResponse.json({ games: [], count: 0 });
  }),
];
