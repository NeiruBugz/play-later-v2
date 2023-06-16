import { SignIn, auth } from "@clerk/nextjs"

export default function IndexPage() {
  const { session } = auth()
  return (
    <section className="flex h-screen">
      <section className="container flex h-full w-1/2 items-center justify-center bg-slate-300">
        Hero
      </section>
      <section className="container flex h-full w-1/2 items-center justify-center bg-slate-800">
        {!session && (
          <div>
            <SignIn />
          </div>
        )}
      </section>
    </section>
  )
}
