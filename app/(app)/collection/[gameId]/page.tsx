import {
  Badge,
  Heading,
  Text,
  Image as ChakraImage,
  Flex,
} from '@chakra-ui/react';
import { format } from 'date-fns';
import { notFound, redirect } from 'next/navigation';
import { z } from 'zod';
import Image from 'next/image';
import { IMAGE_API, IMAGE_SIZES } from '@/shared/config/igdb.image.config';
import { LibraryEntries } from './_components/library-entries';
import { findGameByIdWithUsersBacklog } from '../../../../features/collection/collection-actions';
import { IoCalendarOutline } from 'react-icons/io5';

const gamePageParamsSchema = z.object({ gameId: z.string() });
type GamePageParams = z.infer<typeof gamePageParamsSchema>;

export default async function GamePage({
  params,
}: {
  params: Promise<GamePageParams>;
}) {
  const resolvedParams = await params;
  const result = gamePageParamsSchema.safeParse(resolvedParams);

  if (!result.success) {
    console.error('Invalid gameId parameter:', result.error);
    redirect('/');
  }

  const { gameId } = result.data;
  const gameData = await findGameByIdWithUsersBacklog(gameId);

  if (!gameData?.id) {
    console.warn(`Game with id ${gameId} not found`);
    return notFound();
  }

  return (
    <>
      <Flex justify="space-between">
        {gameData.coverImage && (
          <ChakraImage asChild rounded="sm" shadow="md">
            <Image
              src={`${IMAGE_API}/${IMAGE_SIZES['hd']}/${gameData.coverImage}.webp`}
              alt={`${gameData.title} cover art`}
              width={200}
              height={300}
            />
          </ChakraImage>
        )}
        <LibraryEntries
          gameId={gameData.id}
          backlogItems={gameData.backlogItems || []}
        />
      </Flex>
      <Heading>{gameData.title}</Heading>
      <Text>{gameData.description}</Text>
      {gameData.releaseDate && (
        <Badge variant="surface" size="md">
          <IoCalendarOutline />
          Released at: {format(gameData.releaseDate, 'MMM dd, yyyy')}
        </Badge>
      )}
    </>
  );
}
