import igdbApi from "@/src/packages/igdb-api";

export default async function Page({ params }: { params: { id: string } }) {
  const gameInfo = await igdbApi.getGameById(Number(params.id));
  return (
    <div>
      <h1>
        Page {params.id} {gameInfo?.[0]?.name}
      </h1>
    </div>
  );
}
