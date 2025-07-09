import { AddGameForm } from "@/features/add-game";
import { Header } from "@/shared/components/header";

export default function AddGamePage() {
  return (
    <>
      <Header authorized={true} />
      <div className="container pt-[60px]">
        <AddGameForm />
      </div>
    </>
  );
}
