import { getGameById } from '@/server/actions/gameActions';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const gamePageParamsSchema = z.object({ gameId: z.string() });

type GamePageParams = z.infer<typeof gamePageParamsSchema>;

export default async function GamePage(props: {
  params: Promise<GamePageParams>;
}) {
  const { success, data } = gamePageParamsSchema.safeParse(await props.params);

  if (!success) {
    redirect('/');
  }

  const gameData = await getGameById(data.gameId);

  console.log({ gameData });

  return <>Game Page {data.gameId}</>;
}
