import { SearchForm } from "@/features/search/search-form"

export default async function SearchPage() {
  return (
    <section>
      <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl">
        Find your next game!
      </h1>
      <SearchForm />
    </section>
  )
}
