import { InputGroup } from '@/shared/components/ui/input-group';
import { Button, Text, Flex, Input, Box, Spinner } from '@chakra-ui/react';

function SteamIdInput({
  steamId,
  setSteamId,
  onViewGames,
  isLoading,
}: {
  steamId: string;
  setSteamId: (value: string) => void;
  onViewGames: () => void;
  isLoading: boolean;
}) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && steamId.trim().length > 0 && !isLoading) {
      onViewGames();
    }
  };

  return (
    <Box mb="2">
      <Text fontWeight="medium" mb="1">
        Steam ID
      </Text>
      <Flex gap="2">
        <InputGroup
          w="100%"
          endElement={
            steamId ? (
              <Button
                p={0}
                size="xs"
                onClick={() => setSteamId('')}
                variant="ghost"
              >
                ✕
              </Button>
            ) : null
          }
        >
          <Input
            id="steamId"
            value={steamId}
            onChange={(e) => setSteamId(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your Steam ID"
            flex="1"
            disabled={isLoading}
          />
        </InputGroup>

        <Button
          onClick={onViewGames}
          disabled={isLoading || steamId.trim().length === 0}
          colorPalette="blue"
        >
          {isLoading ? (
            <Flex align="center" gap="2">
              <Spinner size="sm" />
              <span>Loading...</span>
            </Flex>
          ) : (
            'View Games'
          )}
        </Button>
      </Flex>
      <Text fontSize="sm" color="gray.500" mt="1">
        You can find your Steam ID in your profile URL: steamcommunity.com/id/
        <Text as="span" fontWeight="bold">
          your-steam-id
        </Text>{' '}
        or use your 17-digit Steam ID number.
      </Text>
    </Box>
  );
}

export { SteamIdInput };
