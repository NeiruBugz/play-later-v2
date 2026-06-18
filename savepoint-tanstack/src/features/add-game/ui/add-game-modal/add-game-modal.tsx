import { AddGameContent } from "../add-game-content";

type AddGameModalProps = {
  onAdded: () => void;
};

export function AddGameModal({ onAdded }: AddGameModalProps) {
  return <AddGameContent onAdded={onAdded} />;
}
