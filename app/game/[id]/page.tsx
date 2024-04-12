import igdbApi from "@/lib/igdb-api";

export default async function Page({ params }: { params: { id: string } }) {
  const gameInfo = await igdbApi.getGameById(Number(params.id));
  console.log(gameInfo);
  return (
    <div>
      <h1>Page {params.id}</h1>
    </div>
  );
}
