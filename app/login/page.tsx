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
    <div className="flex-1 bg-gradient-to-r from-gray-900 to-gray-800 h-screen">
      <nav className="p-4">
        <div className="container md:mx-auto flex justify-between items-center m-0 p-0 md:p-8">
          <div className="flex gap-2 items-center text-white">
            <Logo name={"PlayLater"} />
          </div>
          <GoogleSignIn />
        </div>
      </nav>

      <main className=" text-white">
        <section className="container mx-auto pt-16 text-center">
          <h1 className="text-6xl font-extrabold leading-tight mb-4">
            Manage Your Gaming Backlog
          </h1>
          <p className="text-xl mb-8">
            Organize your games, track progress, and never miss a gaming session
            again.
          </p>
        </section>

        <section className="bg-gradient-to-r from-gray-800 to-gray-700 py-16">
          <div className="container mx-auto">
            <h2 className="text-4xl font-extrabold mb-12 text-center text-white">
              Key Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
              {generateFeatures().map((feature, index) => (
                <div
                  key={index}
                  className="p-8 bg-gray-700 rounded-lg flex flex-col items-center"
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-300">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="p-4 relative md:bottom-0 w-full md:fixed bg-gradient-to-r from-gray-900 to-gray-800">
        <div className="container mx-auto text-center text-white">
          <p>&copy; 2023-{new Date().getFullYear()} PlayLater.</p>
        </div>
      </footer>
    </div>
  )
}
