const STATUSES = ["backlog", "inprogress", "completed", "abandoned"] as const
type ArrElement<ArrType> = ArrType extends readonly (infer ElementType)[]
  ? ElementType
  : never

interface Game {
  id: string
  title: string
  status: ArrElement<typeof STATUSES>
  platform: string
  imageUrl: string
}

export const games: Game[] = [
  {
    id: "1",
    title: "The Last Of Us Part I",
    status: "completed",
    platform: "PlayStation",
    imageUrl:
      "https://howlongtobeat.com/games/109104_The_Last_of_Us_Part_I.jpg?width=250",
  },
  {
    id: "2",
    title: "The Legend of Zelda: Tears of the Kingdom",
    status: "inprogress",
    platform: "Nintendo",
    imageUrl:
      "https://howlongtobeat.com/games/72589_The_Legend_of_Zelda_Tears_of_the_Kingdom.jpg?width=250",
  },
]
