import { SteamAppInfo } from "@/src/shared/types";
import { ImportedGameCard } from "./imported-game-item";

const GameList: React.FC<{
  games: SteamAppInfo[];
  onChangeStatus: (appId: number, status: string) => void;
  onSaveGame: (steamGame: SteamAppInfo) => Promise<void>;
  onIgnoreClick: (steamGame: SteamAppInfo) => Promise<void>;
}> = ({ games, onChangeStatus, onSaveGame, onIgnoreClick }) => {
  return (
    <ul className="w-full space-y-4 overflow-auto lg:max-w-full">
      {games.map((game) => (
        <li key={game.appid}>
          <ImportedGameCard
            game={game}
            onGameStatusChange={onChangeStatus}
            onSaveGameClick={onSaveGame}
            onIgnoreClick={onIgnoreClick}
          />
        </li>
      ))}
    </ul>
  );
};

export { GameList };
