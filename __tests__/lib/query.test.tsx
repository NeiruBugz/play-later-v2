import { PropsWithChildren } from "react"
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"
import { renderHook } from "@testing-library/react-hooks"
import { HowLongToBeatEntry } from "howlongtobeat"
import { rest } from "msw"
import { setupServer } from "msw/node"
import { nanoid } from "nanoid"
import { test } from "vitest"

import { useSearch } from "../../lib/query"

const server = setupServer(
  rest.get("http://localhost:6060/api/search", (req, res, ctx) => {
    const searchTerm = req.url.searchParams.get("q")
    let response: HowLongToBeatEntry[] = []

    if (!searchTerm) {
      response = []
    } else if (searchTerm === "zelda") {
      response = [
        {
          id: nanoid(),
          name: "The Legend Of Zelda",
          description: "",
          platforms: ["Nintendo Entertainment System"],
          imageUrl: "",
          timeLabels: [],
          gameplayMain: 10,
          gameplayMainExtra: 12,
          gameplayCompletionist: 15,
          similarity: 1,
          searchTerm: "zelda",
          playableOn: ["Nintendo Entertainment System"],
        },
      ]
    }

    return res(ctx.json({ data: response }))
  })
)

const queryCache = new QueryCache()
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})
const wrapper = ({ children }: PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
)

test("useSearch mutation", async () => {
  server.listen()
  const { result, waitFor } = renderHook(() => useSearch(), { wrapper })

  await result.current.mutateAsync("zelda")

  await waitFor(() => result.current.isSuccess)
  server.resetHandlers()
  queryCache.clear()
  server.close()
})
