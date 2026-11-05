import { useState, type ReactNode } from "react";

import {
  InlineAddConfirmationProvider,
  type InlineAddConfirmationPresenter,
} from "../../model/inline-add-confirmation-context";

type Presented = { id: number; content: ReactNode };

export function InlineAddConfirmationHost({
  children,
}: {
  children: ReactNode;
}) {
  const [presented, setPresented] = useState<Presented | null>(null);

  const present: InlineAddConfirmationPresenter = (render) => {
    const id = Date.now();
    const dismiss = () =>
      setPresented((current) => (current?.id === id ? null : current));
    setPresented({ id, content: render(dismiss) });
  };

  return (
    <InlineAddConfirmationProvider value={present}>
      {children}
      {presented ? (
        <div key={presented.id} className="p-md">
          {presented.content}
        </div>
      ) : null}
    </InlineAddConfirmationProvider>
  );
}
