import igdbApi from "@/src/shared/api/igdb";

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
