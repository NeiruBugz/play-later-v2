import { SearchResponse } from '@/shared/types/igdb.types';

export type FormState = {
  selectedGame: SearchResponse | null;
  statusValue: string[];
  platformValue: string[];
  acquisitionTypeValue: string[];
};

export type FormAction =
  | { type: 'SET_SELECTED_GAME'; payload: SearchResponse | null }
  | { type: 'SET_STATUS'; payload: string[] }
  | { type: 'SET_PLATFORM'; payload: string[] }
  | { type: 'SET_ACQUISITION_TYPE'; payload: string[] }
  | { type: 'RESET_FORM' };
