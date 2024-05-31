export const DefaultSortState = {
  order: "desc",
  sortBy: "updatedAt",
};

export const sortingFields = [
  "updatedAt",
  "gameplayTime",
  "createdAt",
  "title",
];
export const filterParameters = ["search", "sortBy", "order", "purchaseType"];

export const mapper = {
  createdAt: "Creation date",
  gameplayTime: "Time to beat the story",
  purchaseType: "Purchase type",
  title: "Game Title",
  updatedAt: "Updated",
};
