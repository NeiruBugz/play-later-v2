export type RouteParams = {
  home: undefined;
  collection: undefined;
  wishlist: undefined;
  gamePage: { gameId: string };
};

export const routes = {
  home: "/",
  collection: "/collection",
  wishlist: "/wishlist",
  gamePage: (params: RouteParams["gamePage"]) => `/collection/${params.gameId}`,
};
