import { useMutation } from "@tanstack/react-query";

type IgdbPlatform = {
  id: number;
  name: string;
};

type IgdbSearchResponse = {
  id: number;
  name: string;
  platforms: Array<IgdbPlatform>;
  cover: {
    id: number;
    image_id: string;
  };
  first_release_date: number;
};

export function useSearch() {
  return useMutation({
    mutationFn: async (searchTerm: string) => {
      const request = await fetch(`api/search?q=${searchTerm}`);
      const { response } = await request.json();
      return response as IgdbSearchResponse[];
    },
  });
}
