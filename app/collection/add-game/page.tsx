import { AddGameForm } from "@/features/add-game";
import { EditorialHeader } from "@/shared/components/header";

export default function AddGamePage() {
  return (
    <>
      <EditorialHeader authorized={true} />
      <div className="container pt-[60px]">
        <AddGameForm />
      </div>
    </>
  );
}
