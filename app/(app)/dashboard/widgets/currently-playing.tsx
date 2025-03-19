import { Card, Heading, Text, Flex, SimpleGrid } from '@chakra-ui/react';
import { prisma } from '@/prisma/client';
import { GameCard } from '@/shared/components/game/game-card';
import { Game } from '@/shared/types/entities/Game';
import { Genre } from '@/shared/types/entities/Genre';

export default async function CurrentlyPlayingWidget({
  userId,
}: {
  userId?: string;
}) {
  const currentlyPlayingGames = await prisma.game.findMany({
    where: {
      backlogItems: {
        some: {
          userId,
          status: 'PLAYING',
        },
      },
    },
    include: {
      backlogItems: {
        where: {
          userId,
        },
      },
      genres: {
        include: {
          genre: true,
        },
      },
    },
    take: 4,
  });

  const transformedGames = currentlyPlayingGames.map((game) => {
    return {
      ...game,
      genres: game.genres.map(
        (g) =>
          ({
            id: g.genre.id.toString(), // Convert number to string
            name: g.genre.name,
            slug: g.genre.name.toLowerCase().replace(/\s+/g, '-'),
            igdbId: g.genre.id,
          }) as Genre,
      ),
    } as Game;
  });

  return (
    <Card.Root p={4} height="full">
      <Heading size="md" mb={4}>
        Currently Playing
      </Heading>

      {transformedGames.length === 0 ? (
        <Flex
          justify="center"
          align="center"
          height="150px"
          direction="column"
          gap={2}
        >
          <Text color="gray.500">
            You&apos;re not playing any games right now
          </Text>
          <Text fontSize="sm" color="gray.400">
            Update your collection to track what you&apos;re playing
          </Text>
        </Flex>
      ) : (
        <SimpleGrid columns={{ base: 1, sm: 2, md: 2, lg: 4 }} gap={4}>
          {transformedGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </SimpleGrid>
      )}
    </Card.Root>
  );
}
