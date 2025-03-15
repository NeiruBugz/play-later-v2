import { SortableTableHeader } from './header';
import { GameRow } from './row';
import { SteamGame, SortField, SortDirection } from '../../types';
import { Box } from '@chakra-ui/react';

function GamesTable({
  games,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  selectedGameIds,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSelectGame,
  sortField,
  sortDirection,
  onSort,
}: {
  games: SteamGame[];
  selectedGameIds: number[];
  onSelectGame: (appid: number) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}) {
  return (
    <Box borderWidth="1px" borderRadius="md" overflow="hidden" boxShadow="sm">
      <Box overflowX="auto">
        <Box as="table" width="full" borderCollapse="collapse">
          <SortableTableHeader
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={onSort}
          />
          <Box as="tbody">
            {games.map((game) => (
              <GameRow
                key={game.appid}
                game={game}
                isSelected={false}
                onSelect={() => {}}
              />
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export { GamesTable };
