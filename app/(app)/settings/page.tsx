import { SteamImport } from './_components/steam-import';
import { Box, Heading, Text, VStack } from '@chakra-ui/react';

export default function SettingsPage() {
  return (
    <Box p="6">
      <Heading as="h1" size="xl" mb="6">
        Settings
      </Heading>

      <Box
        bg="white"
        _dark={{ bg: 'gray.800' }}
        borderRadius="lg"
        shadow="md"
        p="6"
        mb="6"
      >
        <Heading as="h2" size="lg" mb="4">
          Import Games
        </Heading>
        <VStack gap="4" alignItems="stretch">
          <Box>
            <Heading as="h3" size="md" mb="2">
              Steam
            </Heading>
            <Text color="gray.600" _dark={{ color: 'gray.300' }} mb="3">
              Import your games from Steam to add them to your backlog.
            </Text>
            <SteamImport />
          </Box>
        </VStack>
      </Box>
    </Box>
  );
}
