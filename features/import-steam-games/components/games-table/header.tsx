import { Box, Flex, Text } from '@chakra-ui/react';
import { FiArrowUp, FiArrowDown } from 'react-icons/fi';

type SortField = 'name' | 'playtime_forever';
type SortDirection = 'asc' | 'desc';

function SortableTableHeader({
  sortField,
  sortDirection,
  onSort,
}: {
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}) {
  return (
    <Box as="thead" bg="gray.50">
      <Box as="tr" borderBottomWidth="2px" borderColor="gray.200">
        <Box
          as="th"
          p="3"
          textAlign="left"
          cursor="pointer"
          onClick={() => onSort('name')}
          _hover={{ bg: 'gray.100' }}
          transition="background-color 0.2s"
        >
          <Flex align="center" gap="1">
            <Text fontWeight="semibold">Game</Text>
            {sortField === 'name' && (
              <Box color="blue.500" ml="1">
                {sortDirection === 'asc' ? <FiArrowUp /> : <FiArrowDown />}
              </Box>
            )}
          </Flex>
        </Box>
        <Box
          as="th"
          p="3"
          textAlign="left"
          cursor="pointer"
          onClick={() => onSort('playtime_forever')}
          _hover={{ bg: 'gray.100' }}
          transition="background-color 0.2s"
        >
          <Flex align="center" gap="1">
            <Text fontWeight="semibold">Playtime</Text>
            {sortField === 'playtime_forever' && (
              <Box color="blue.500" ml="1">
                {sortDirection === 'asc' ? <FiArrowUp /> : <FiArrowDown />}
              </Box>
            )}
          </Flex>
        </Box>
        <Box as="th" p="3" textAlign="left" fontWeight="semibold">
          <Text fontWeight="semibold">Status</Text>
        </Box>
      </Box>
    </Box>
  );
}

export { SortableTableHeader };
