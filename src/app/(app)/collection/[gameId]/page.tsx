import { getGameById } from '@/server/actions/gameActions';
import { Badge, Heading, Text, Image as ChakraImage } from '@chakra-ui/react';
import { format } from 'date-fns';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import Image from 'next/image';
import { IMAGE_API, IMAGE_SIZES } from '@/shared/config/igdb.image.config';
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

  return (
    <>
      {gameData?.coverImage ? (
        <ChakraImage asChild rounded="sm" shadow="md">
          <Image
            src={`${IMAGE_API}/${IMAGE_SIZES['hd']}/${gameData.coverImage}.webp`}
            alt={`${gameData.title} cover art`}
            width={200}
            height={300}
          />
        </ChakraImage>
      ) : null}
      <Heading>{gameData?.title}</Heading>
      <Text>{gameData?.description}</Text>
      {gameData?.releaseDate ? (
        <Badge>{format(gameData.releaseDate, 'MMM dd, yyyy')}</Badge>
      ) : null}
    </>
  );
}
