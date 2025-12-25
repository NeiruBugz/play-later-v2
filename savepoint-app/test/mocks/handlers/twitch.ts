import { http, HttpResponse } from "msw";

export const twitchHandlers = [
  http.post("https://id.twitch.tv/oauth2/token", () => {
    return HttpResponse.json({
      access_token: "mock-token",
      expires_in: 5000000,
      token_type: "bearer",
    });
  }),
];
