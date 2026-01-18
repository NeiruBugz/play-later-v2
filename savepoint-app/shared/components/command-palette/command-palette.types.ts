export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface GameSearchItem {
  id: number | string;
  name: string;
  slug: string;
  coverImageId?: string | null;
  releaseYear?: number | null;
  platforms?: string[];
}

export interface RecentGameItem {
  id: number;
  name: string;
  slug: string;
  coverImageId?: string | null;
  status: string;
}
