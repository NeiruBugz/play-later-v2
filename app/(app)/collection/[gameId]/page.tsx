import {
  Badge,
  Box,
  Button,
  Container,
  Heading,
  Text,
  Image as ChakraImage,
  Grid,
  GridItem,
  HStack,
  VStack,
  Tag,
  SimpleGrid,
  Skeleton,
  Stat,
  StatGroup,
  Link,
} from '@chakra-ui/react';
import { format } from 'date-fns';
import { notFound, redirect } from 'next/navigation';
import { z } from 'zod';
import Image from 'next/image';
import { IMAGE_API, IMAGE_SIZES } from '@/shared/config/igdb.image.config';
import { LibraryEntries } from './_components/library-entries';
import { MismatchCorrection } from './_components/mismatch-correction';
import {
  IoCalendarOutline,
  IoGameControllerOutline,
  IoStarOutline,
  IoTimeOutline,
  IoLogoSteam,
  IoGlobeOutline,
  IoTrophyOutline,
} from 'react-icons/io5';
import { findGameByIdWithUsersBacklog } from '@/features/backlog/actions/backlog-actions';
import { getIGDBGameData } from '@/shared/external-apis/igdb/igdb-actions';
import { Suspense } from 'react';

const gamePageParamsSchema = z.object({ gameId: z.string() });
type GamePageParams = z.infer<typeof gamePageParamsSchema>;

// Component to display additional IGDB data
async function AdditionalGameInfo({ igdbId }: { igdbId: number }) {
  try {
    const igdbData = await getIGDBGameData(igdbId);

    if (!igdbData) {
      return null;
    }

    // Extract developers and publishers
    const developers =
      igdbData.involved_companies
        ?.filter((company) => company.developer)
        .map((company) => company.company.name) || [];

    const publishers =
      igdbData.involved_companies
        ?.filter((company) => company.publisher)
        .map((company) => company.company.name) || [];

    // Extract websites
    const websites = igdbData.websites || [];
    const officialSite = websites.find((site) => site.category === 1);

    return (
      <VStack gap={6} align="stretch">
        {(developers.length > 0 || publishers.length > 0) && (
          <Box>
            <Text fontWeight="bold" mb={2}>
              Companies
            </Text>
            {developers.length > 0 && (
              <Box mb={2}>
                <Text fontSize="sm" color="gray.600">
                  Developer{developers.length > 1 ? 's' : ''}
                </Text>
                <Text>{developers.join(', ')}</Text>
              </Box>
            )}
            {publishers.length > 0 && (
              <Box>
                <Text fontSize="sm" color="gray.600">
                  Publisher{publishers.length > 1 ? 's' : ''}
                </Text>
                <Text>{publishers.join(', ')}</Text>
              </Box>
            )}
          </Box>
        )}

        {igdbData.game_modes && igdbData.game_modes.length > 0 && (
          <Box>
            <Text fontWeight="bold" mb={2}>
              Game Modes
            </Text>
            <HStack gap={2} flexWrap="wrap">
              {igdbData.game_modes.map((mode) => (
                <Tag.Root
                  key={mode.name}
                  size="md"
                  variant="subtle"
                  colorPalette="teal"
                >
                  <Tag.Label>{mode.name}</Tag.Label>
                </Tag.Root>
              ))}
            </HStack>
          </Box>
        )}

        {igdbData.themes && igdbData.themes.length > 0 && (
          <Box>
            <Text fontWeight="bold" mb={2}>
              Themes
            </Text>
            <HStack gap={2} flexWrap="wrap">
              {igdbData.themes.map((theme) => (
                <Tag.Root
                  key={theme.name}
                  size="md"
                  variant="subtle"
                  colorPalette="orange"
                >
                  <Tag.Label>{theme.name}</Tag.Label>
                </Tag.Root>
              ))}
            </HStack>
          </Box>
        )}

        {officialSite && (
          <Box>
            <Button asChild variant="outline" size="sm">
              <Link href={officialSite.url} target="_blank">
                <IoGlobeOutline /> Official Website
              </Link>
            </Button>
          </Box>
        )}
      </VStack>
    );
  } catch (error) {
    console.error('Error fetching IGDB data:', error);
    return null;
  }
}

export default async function GamePage({
  params,
}: {
  params: Promise<GamePageParams>;
}) {
  const resolvedParams = await params;
  const paramsResult = gamePageParamsSchema.safeParse(resolvedParams);

  if (!paramsResult.success) {
    console.error('Invalid gameId parameter:', paramsResult.error);
    redirect('/');
  }

  const { gameId } = paramsResult.data;
  const gameResult = await findGameByIdWithUsersBacklog({ gameId });

  if (!gameResult || !gameResult.data) {
    console.warn(`Failed to fetch game with id ${gameId}`);
    return notFound();
  }

  const gameData = gameResult.data;

  if (!gameData.id) {
    console.warn(`Game with id ${gameId} not found`);
    return notFound();
  }

  // Format playtime data from HLTB if available
  const playtimeData = [];
  if (gameData.mainStory) {
    playtimeData.push({
      label: 'Main Story',
      hours: gameData.mainStory,
      icon: <IoGameControllerOutline />,
      color: 'blue',
    });
  }
  if (gameData.mainExtra) {
    playtimeData.push({
      label: 'Main + Extras',
      hours: gameData.mainExtra,
      icon: <IoTimeOutline />,
      color: 'purple',
    });
  }
  if (gameData.completionist) {
    playtimeData.push({
      label: 'Completionist',
      hours: gameData.completionist,
      icon: <IoTrophyOutline />,
      color: 'orange',
    });
  }

  // Steam store URL if available
  const steamStoreUrl = gameData.steamAppId
    ? `https://store.steampowered.com/app/${gameData.steamAppId}/`
    : null;

  return (
    <Container maxW="container.xl" py={6}>
      <Grid templateColumns={{ base: '1fr', md: '300px 1fr' }} gap={8}>
        {/* Left column - Game cover and library entries */}
        <GridItem>
          <VStack gap={6} align="stretch">
            {gameData.coverImage ? (
              <Box
                position="relative"
                width="100%"
                height="auto"
                overflow="hidden"
                borderRadius="md"
                boxShadow="lg"
              >
                <ChakraImage
                  asChild
                  rounded="md"
                  shadow="lg"
                  width="100%"
                  height="auto"
                >
                  <Image
                    src={`${IMAGE_API}/${IMAGE_SIZES['hd']}/${gameData.coverImage}.webp`}
                    alt={`${gameData.title} cover art`}
                    width={300}
                    height={450}
                    style={{
                      objectFit: 'cover',
                      width: '100%',
                      height: 'auto',
                    }}
                    priority
                  />
                </ChakraImage>
              </Box>
            ) : (
              <Box
                bg="gray.200"
                width="100%"
                height="450px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                borderRadius="md"
              >
                <IoGameControllerOutline size={64} color="gray" />
              </Box>
            )}

            {/* Steam button if available */}
            {steamStoreUrl && (
              <Button
                asChild
                colorPalette="gray"
                variant="solid"
                size="md"
                width="100%"
              >
                <Link href={steamStoreUrl} target="_blank">
                  <IoLogoSteam /> View on Steam
                </Link>
              </Button>
            )}

            {/* Add mismatch correction button if game has Steam ID */}
            {gameData.steamAppId && (
              <MismatchCorrection
                gameId={gameData.id}
                steamAppId={gameData.steamAppId}
                steamTitle={gameData.title}
                currentTitle={gameData.title}
              />
            )}

            <LibraryEntries
              gameId={gameData.id}
              backlogItems={gameData.backlogItems || []}
            />

            {/* How Long To Beat section */}
            {playtimeData.length > 0 && (
              <Box borderWidth="1px" borderRadius="md" p={4}>
                <Text fontWeight="bold" mb={3}>
                  How Long To Beat
                </Text>
                <StatGroup>
                  {playtimeData.map((data) => (
                    <Stat.Root key={data.label}>
                      <Stat.Label display="flex" alignItems="center" gap={1}>
                        {data.icon} {data.label}
                      </Stat.Label>
                      <Stat.ValueText>{data.hours} hrs</Stat.ValueText>
                    </Stat.Root>
                  ))}
                </StatGroup>
              </Box>
            )}
          </VStack>
        </GridItem>

        {/* Right column - Game details */}
        <GridItem>
          <VStack gap={6} align="stretch">
            <Box>
              <Heading size="2xl" mb={2}>
                {gameData.title}
              </Heading>

              <HStack gap={4} mt={3} mb={6} flexWrap="wrap">
                {gameData.releaseDate && (
                  <Badge
                    variant="subtle"
                    colorPalette="blue"
                    p={2}
                    borderRadius="md"
                  >
                    <HStack gap={1}>
                      <IoCalendarOutline />
                      <Text>
                        {format(gameData.releaseDate, 'MMM dd, yyyy')}
                      </Text>
                    </HStack>
                  </Badge>
                )}

                {gameData.aggregatedRating && (
                  <Badge
                    variant="subtle"
                    colorPalette="yellow"
                    p={2}
                    borderRadius="md"
                  >
                    <HStack gap={1}>
                      <IoStarOutline />
                      <Text>{Math.round(gameData.aggregatedRating)}/100</Text>
                    </HStack>
                  </Badge>
                )}
              </HStack>
            </Box>

            {gameData.genres && gameData.genres.length > 0 && (
              <Box>
                <Text fontWeight="bold" mb={2}>
                  Genres
                </Text>
                <HStack gap={2} flexWrap="wrap">
                  {gameData.genres.map((genre) => (
                    <Tag.Root
                      key={genre.genre.name}
                      size="md"
                      variant="subtle"
                      colorPalette="purple"
                    >
                      <Tag.Label>{genre.genre.name}</Tag.Label>
                    </Tag.Root>
                  ))}
                </HStack>
              </Box>
            )}

            <Box>
              <Text fontWeight="bold" mb={2}>
                Description
              </Text>
              <Text>{gameData.description}</Text>
            </Box>

            {/* Additional IGDB data */}
            {gameData.igdbId && (
              <Suspense fallback={<Skeleton height="200px" />}>
                <AdditionalGameInfo igdbId={gameData.igdbId} />
              </Suspense>
            )}

            {gameData.screenshots && gameData.screenshots.length > 0 && (
              <Box>
                <Text fontWeight="bold" mb={3}>
                  Screenshots
                </Text>
                <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap={4}>
                  {gameData.screenshots.map((screenshot, index) => (
                    <Box
                      key={screenshot.id}
                      borderRadius="md"
                      overflow="hidden"
                      boxShadow="md"
                      transition="transform 0.2s"
                      _hover={{ transform: 'scale(1.02)' }}
                    >
                      <Image
                        src={`${IMAGE_API}/${IMAGE_SIZES['s-big']}/${screenshot.imageId}.webp`}
                        alt={`${gameData.title} screenshot ${index + 1}`}
                        width={400}
                        height={225}
                        style={{
                          objectFit: 'cover',
                          width: '100%',
                          height: 'auto',
                        }}
                      />
                    </Box>
                  ))}
                </SimpleGrid>
              </Box>
            )}
          </VStack>
        </GridItem>
      </Grid>
    </Container>
  );
}
