import GoogleSignIn from "@/features/auth/google-sign-in"

import { Logo } from "@/components/logo"

const generateFeatures = () => [
  {
    title: "Game Organization",
    description: "Easily organize your games into categories and genres.",
    icon: "🎮",
  },
  {
    title: "Progress Tracking",
    description:
      "Track your progress in each game and set goals for completion.",
    icon: "📊",
  },
  // {
  //   title: "Reminders",
  //   description: "Receive notifications for upcoming game releases and events.",
  //   icon: "🔔",
  // },
]
export default function LoginPage() {
  return (
    <div className="h-screen flex-1 bg-gradient-to-r from-gray-900 to-gray-800">
      <nav className="p-4">
        <div className="container m-0 flex items-center justify-between p-0 md:mx-auto md:p-8">
          <div className="flex items-center gap-2 text-white">
            <Logo name={"PlayLater"} />
          </div>
          <GoogleSignIn />
        </div>
      </nav>

      <main className=" text-white">
        <section className="container mx-auto pt-16 text-center">
          <h1 className="mb-4 text-6xl font-extrabold leading-tight">
            Manage Your Gaming Backlog
          </h1>
          <p className="mb-8 text-xl">
            Organize your games, track progress, and never miss a gaming session
            again.
          </p>
        </section>

        <section className="bg-gradient-to-r from-gray-800 to-gray-700 py-16">
          <div className="container mx-auto">
            <h2 className="mb-12 text-center text-4xl font-extrabold text-white">
              Key Features
            </h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-2">
              {generateFeatures().map((feature, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center rounded-lg bg-gray-700 p-8"
                >
                  <div className="mb-4 text-4xl">{feature.icon}</div>
                  <h3 className="mb-2 text-xl font-bold">{feature.title}</h3>
                  <p className="text-gray-300">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="relative w-full bg-gradient-to-r from-gray-900 to-gray-800 p-4 md:fixed md:bottom-0">
        <div className="container mx-auto text-center text-white">
          <p>&copy; 2023-{new Date().getFullYear()} PlayLater.</p>
        </div>
      </footer>
    </div>
  )
}
