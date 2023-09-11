import GoogleSignIn from "@/features/auth/google-sign-in"

export default function LoginPage() {
  return (
    <main className="min-h-screen">
      <div className="bg-black md:hidden"></div>
      <div className="container relative hidden h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
          <div className="absolute inset-0 bg-zinc-900" />
        </div>
        <div className="lg:p-8">
          <div className="mx-auto flex w-full flex-col items-center justify-center space-y-6 sm:w-[350px]">
            <GoogleSignIn />
          </div>
        </div>
      </div>
    </main>
  )
}
