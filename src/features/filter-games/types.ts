import type { Dispatch, SetStateAction } from "react";

export type LibraryFiltersUIProps = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
};

export type FormState = {
  order: string;
  purchaseType?: string;
  search?: string;
  sortBy: string;
  status: string;
};

export type FormAction = (prevState: FormState, payload: FormData) => FormState;
