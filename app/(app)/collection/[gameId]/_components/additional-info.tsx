import {
  IGDB_WEBSITE_CATEGORY,
  STORE_INFO,
  IGDBWebsiteCategory,
} from '@/shared/constants/igdb';
import { getIGDBGameData } from '@/shared/external-apis/igdb/igdb-actions';
import {
  Box,
  Button,
  HStack,
  Link,
  SimpleGrid,
  Tag,
  VStack,
  Text,
} from '@chakra-ui/react';
import { IoGlobeOutline } from 'react-icons/io5';

async function AdditionalGameInfo({
  igdbId,
  steamStoreUrl,
}: {
  igdbId: number;
  steamStoreUrl: string | null;
}) {
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
    const officialSite = websites.find(
      (site) => site.category === IGDB_WEBSITE_CATEGORY.OFFICIAL,
    );

    // Debug store categories
    console.log(
      'Store websites:',
      websites.map((site) => ({
        category: site.category,
        url: site.url,
        mappedStore: STORE_INFO[site.category as IGDBWebsiteCategory]?.name,
      })),
    );

    // Extract store links
    const steamStoreInfo = STORE_INFO[IGDB_WEBSITE_CATEGORY.STEAM];
    const storeLinks = [
      // Steam link from game data
      ...(steamStoreUrl && steamStoreInfo
        ? [
            {
              name: steamStoreInfo.name,
              url: steamStoreUrl,
              Icon: steamStoreInfo.icon,
              color: steamStoreInfo.color,
            },
          ]
        : []),
      // Other store links from IGDB
      ...websites
        .map((site) => {
          const storeInfo = STORE_INFO[site.category as IGDBWebsiteCategory];
          if (!storeInfo || site.category === IGDB_WEBSITE_CATEGORY.STEAM)
            return null;
          return {
            name: storeInfo.name,
            url: site.url,
            Icon: storeInfo.icon,
            color: storeInfo.color,
          };
        })
        .filter((store): store is NonNullable<typeof store> => store !== null),
    ];

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

        {/* Store Links */}
        {storeLinks.length > 0 && (
          <Box>
            <Text fontWeight="bold" mb={2}>
              Available On
            </Text>
            <SimpleGrid columns={{ base: 1, sm: 2 }} gap={2}>
              {storeLinks.map((store) => {
                const StoreIcon = store.Icon;
                return (
                  <Button
                    key={store.url}
                    asChild
                    bg={store.color}
                    color="white"
                    _hover={{
                      bg: store.color,
                      opacity: 0.9,
                    }}
                    size="md"
                    width="100%"
                  >
                    <Link href={store.url} target="_blank">
                      <StoreIcon /> {store.name}
                    </Link>
                  </Button>
                );
              })}
            </SimpleGrid>
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

export { AdditionalGameInfo };
