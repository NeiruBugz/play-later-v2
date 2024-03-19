import { hasUsername } from "@/features/auth/actions"
import { UserNameForm } from "@/features/auth/username-form"
import {
  fetchAndProcessGames,
  setDefaultProps,
} from "@/features/library/helpers"
import { LibraryContent } from "@/features/library/ui/content"
import { Header } from "@/features/library/ui/header"

import { LibraryPageProps } from "@/types/library"

export default async function LibraryPage({
  searchParams = setDefaultProps(),
}: LibraryPageProps) {
  const params = new URLSearchParams(searchParams)
  const { list, currentStatus, totalBacklogTime, backlogged } =
    await fetchAndProcessGames(params)
  const withUsername = await hasUsername()
  return (
    <section className="relative">
      <Header currentStatus={currentStatus} backlogged={backlogged} />
      <section className="bg-background p-4 md:container">
        <LibraryContent
          list={list}
          currentStatus={currentStatus}
          totalBacklogTime={totalBacklogTime}
          backloggedLength={backlogged.length}
        />
      </section>
      {withUsername ? null : <UserNameForm />}
    </section>
  )
}
