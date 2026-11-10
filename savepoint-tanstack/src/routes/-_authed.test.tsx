import { describe, expect, it } from "vitest";

import { Route } from "./_authed";

const beforeLoadWith = (user: unknown) =>
  Route.options.beforeLoad?.({
    context: { user },
    location: {} as never,
    params: {},
    search: {},
    cause: "enter",
  } as never);

describe("_authed route guard", () => {
  describe("given the root context has no user", () => {
    it("redirects to /login", () => {
      let thrown: unknown;
      try {
        beforeLoadWith(null);
      } catch (error) {
        thrown = error;
      }
      expect(thrown).toMatchObject({ options: { to: "/login" } });
    });
  });

  describe("given the root context has a user", () => {
    it("lets the navigation through without a server call", () => {
      expect(() =>
        beforeLoadWith({ id: "user-abc-123", username: "ada" })
      ).not.toThrow();
    });
  });
});
