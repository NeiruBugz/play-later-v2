import { FormState } from '@/features/add-game-to-library/types/form';
import { FormAction } from '@/features/add-game-to-library/types/form';
import { SearchResponse } from '@/shared/types/igdb.types';

export const initialFormState: FormState = {
  selectedGame: null,
  statusValue: [],
  platformValue: [],
  acquisitionTypeValue: [],
};

export function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_SELECTED_GAME':
      return { ...state, selectedGame: action.payload };
    case 'SET_STATUS':
      return { ...state, statusValue: action.payload };
    case 'SET_PLATFORM':
      return { ...state, platformValue: action.payload };
    case 'SET_ACQUISITION_TYPE':
      return { ...state, acquisitionTypeValue: action.payload };
    case 'RESET_FORM':
      return initialFormState;
    default:
      return state;
  }
}

export const formActions = {
  setSelectedGame: (game: SearchResponse | null): FormAction => ({
    type: 'SET_SELECTED_GAME',
    payload: game,
  }),
  setStatus: (status: string[]): FormAction => ({
    type: 'SET_STATUS',
    payload: status,
  }),
  setPlatform: (platform: string[]): FormAction => ({
    type: 'SET_PLATFORM',
    payload: platform,
  }),
  setAcquisitionType: (acquisitionType: string[]): FormAction => ({
    type: 'SET_ACQUISITION_TYPE',
    payload: acquisitionType,
  }),
  resetForm: (): FormAction => ({
    type: 'RESET_FORM',
  }),
};

export function isFormValid(state: FormState, userId?: string | null): boolean {
  return !!(
    state.selectedGame &&
    state.statusValue.length > 0 &&
    state.platformValue.length > 0 &&
    state.acquisitionTypeValue.length > 0 &&
    userId
  );
}
