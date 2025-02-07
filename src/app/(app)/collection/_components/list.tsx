import { getUserGamesWithGroupedBacklogAction } from "@/server/actions/gameActions";

export async function List(props: { params: Record<string, string | number> }) {
  const { params } = props;

  const { collection, count } = await getUserGamesWithGroupedBacklogAction({
    platform: params.platform,
    status: params.status,
    search: params.search,
    page: Number(params.page) || 1,
  });

  console.log({ collection, count });

  return <>List</>;
}
