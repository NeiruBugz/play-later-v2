import { createContext, useContext, type ReactNode } from "react";

export type InlineAddConfirmationPresenter = (
  render: (dismiss: () => void) => ReactNode
) => void;

const InlineAddConfirmationContext =
  createContext<InlineAddConfirmationPresenter | null>(null);

export const InlineAddConfirmationProvider =
  InlineAddConfirmationContext.Provider;

export function useInlineAddConfirmation(): InlineAddConfirmationPresenter | null {
  return useContext(InlineAddConfirmationContext);
}
