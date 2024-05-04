export type SharedWishlistPageProps = {
  params: {
    id: string;
  };
  searchParams: URLSearchParams;
};

export type SharedWishlistGame = {
  gameplayTime: null | number;
  id: string;
  imageUrl: string;
  title: string;
};
