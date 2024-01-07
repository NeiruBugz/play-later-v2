import { PropsWithChildren } from "react"

function ListWrapper({
  count,
  children,
}: PropsWithChildren<{ count: number }>) {
  return (
    <section className="flex flex-col">
      <section className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-4 lg:grid-cols-5 lg:gap-7 xl:grid-cols-6">
        {children}
      </section>
    </section>
  )
}

export { ListWrapper }
