import GoogleSignIn from "@/features/auth/google-sign-in"

export default function LoginPage() {
  return (
    <main className="min-h-screen">
      <div className="relative h-screen flex-col items-center justify-center lg:container lg:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <div className="relative h-full flex-col bg-muted text-white dark:border-r md:p-10 lg:flex">
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 px-8">
            <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl">
              PlayLater – Your Personal Gaming Queue
            </h1>
            <p className="leading-7 lg:text-xl [&:not(:first-child)]:mt-6">
              PlayLater is the ultimate gaming backlog manager designed for
              gamers who want to keep track of their games and plan their next
              gaming sessions. With PlayLater, you can easily add your favorite
              games to your backlog, mark them as played, and set your own
              priorities.
            </p>
            <p className="leading-7 lg:text-xl [&:not(:first-child)]:mt-6">
              PlayLater helps you stay on top of your gaming queue and never
              miss a game you wanted to play. Hit sign in button and start
              playing the games you&apos;ve always wanted to try!
            </p>
            <div className="mx-auto flex w-full flex-col items-center justify-center space-y-6 sm:w-[350px] md:mt-6 lg:hidden">
              <GoogleSignIn />
            </div>
          </div>
        </div>
        <div className="lg:p-8">
          <div className="mx-auto hidden w-full flex-col items-center justify-center space-y-6 sm:w-[350px] lg:flex">
            <GoogleSignIn />
          </div>
        </div>
      </div>
    </main>
  )
}
