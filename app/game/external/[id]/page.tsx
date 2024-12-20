import igdbApi from "@/src/shared/api/igdb";
import { GenericPageProps } from "@/src/shared/types";
import { Header } from "@/src/widgets/header";

export default async function ExternalGamePage(props: GenericPageProps) {
  const id = (await props.params).id;
  const igdbData = await igdbApi.getGameById(Number(id));

  return (
    <>
      <Header />
      <div className="container mt-[60px]">
        External Game Page {id} {igdbData?.name}
      </div>
    </>
  );
}
