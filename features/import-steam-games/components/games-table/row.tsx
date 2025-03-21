import { Box, Text, Badge, Flex, Icon } from '@chakra-ui/react';
import Image from 'next/image';
import { useState } from 'react';
import { SteamGame } from '../../types';
import { formatPlaytime, getSteamImageUrl } from '@/shared/external-apis/steam';
import { FiInfo } from 'react-icons/fi';
import { Tooltip } from '@/shared/components/ui/tooltip';
import { SingleImportButton } from '../single-import-button';

function GameRow({
  game,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isSelected,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSelect,
  steamId,
  onImportCompleted,
}: {
  game: SteamGame;
  isSelected: boolean;
  onSelect: (appid: number) => void;
  steamId: string;
  onImportCompleted?: () => void;
}) {
  const [imageError, setImageError] = useState(false);

  // Handle undefined or null playtime values
  const playtime = game.playtime_forever ?? 0;
  const hasPlaytime = playtime > 0;
  const hasRelatedGames = game.relatedGames && game.relatedGames.length > 1;

  // Generate Steam image URL
  const getGameImageUrl = () => {
    if (imageError) {
      // Return a generic game controller icon as fallback
      return 'https://placehold.co/40x40?text=Game';
    }

    // Try to use the logo image if available
    if (game.img_logo_url) {
      return getSteamImageUrl(game.appid, game.img_logo_url);
    }
    // Fall back to the icon image if available
    if (game.img_icon_url) {
      return getSteamImageUrl(game.appid, game.img_icon_url);
    }
    // Use the Steam header image as a fallback
    return getSteamImageUrl(game.appid);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  // Generate tooltip content for related games
  const getRelatedGamesTooltipContent = () => {
    if (!hasRelatedGames) return null;

    return (
      <Box p="2" maxW="300px">
        <Text fontWeight="bold" mb="2">
          Includes {game.relatedGames!.length} related titles:
        </Text>
        {game.relatedGames!.map((relatedGame) => (
          <Box key={relatedGame.appid} mb="1">
            <Text>{relatedGame.name}</Text>
            <Text fontSize="xs" color="gray.500">
              {formatPlaytime(relatedGame.playtime_forever || 0)}
            </Text>
          </Box>
        ))}
      </Box>
    );
  };

  // Determine status and badge color
  const getStatusBadge = () => {
    if (game.alreadyInBacklog) {
      return (
        <Badge
          colorPalette="green"
          textTransform="uppercase"
          fontWeight="bold"
          fontSize="xs"
          letterSpacing="0.5px"
          py={1}
          px={2}
          borderRadius="sm"
        >
          IMPORTED
        </Badge>
      );
    }

    return (
      <Badge
        colorPalette="orange"
        textTransform="uppercase"
        fontWeight="bold"
        fontSize="xs"
        letterSpacing="0.5px"
        py={1}
        px={2}
        borderRadius="sm"
      >
        NOT IMPORTED
      </Badge>
    );
  };

  return (
    <Box
      as="tr"
      key={game.appid}
      _hover={{ bg: 'gray.50' }}
      transition="background-color 0.2s"
      borderBottomWidth="1px"
      borderColor="gray.200"
    >
      <Box as="td" p="3">
        <Flex align="center" gap="3">
          <Box
            position="relative"
            width="40px"
            height="40px"
            borderRadius="md"
            overflow="hidden"
            bg="gray.100"
          >
            <Image
              src={getGameImageUrl()}
              alt={game.name}
              fill
              style={{ objectFit: 'cover' }}
              unoptimized
              onError={handleImageError}
            />
          </Box>
          <Flex align="center">
            <Text fontWeight="medium">{game.name}</Text>
            {hasRelatedGames && (
              <Tooltip content={getRelatedGamesTooltipContent()}>
                <Flex align="center" ml="2">
                  <Icon
                    color="blue.500"
                    boxSize="4"
                    cursor="help"
                    _hover={{ color: 'blue.600' }}
                  >
                    <FiInfo />
                  </Icon>
                </Flex>
              </Tooltip>
            )}
          </Flex>
        </Flex>
      </Box>
      <Box as="td" p="3">
        <Text
          fontWeight={hasPlaytime ? 'bold' : 'normal'}
          color={hasPlaytime ? 'purple.600' : 'gray.600'}
        >
          {formatPlaytime(playtime)}
          {hasRelatedGames && (
            <Text as="span" fontSize="xs" color="gray.500" mt="1">
              Combined from {game.relatedGames!.length} titles
            </Text>
          )}
        </Text>
      </Box>
      <Box as="td" p="3">
        <Flex align="center" justify="space-between">
          {getStatusBadge()}
          <SingleImportButton
            steamId={steamId}
            game={game}
            onImportCompleted={onImportCompleted}
          />
        </Flex>
      </Box>
    </Box>
  );
}

export { GameRow };
