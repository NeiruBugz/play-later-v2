import { Suspense } from "react"
import Image from "next/image"
import Link from "next/link"
import GoogleSignIn from "@/features/auth/google-sign-in"
import library from "@/images/library.png"
import sharedWishlist from "@/images/shared-wishlist.png"
import { BarChart, Gamepad2, Share } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Logo } from "@/components/logo"

const generateFeatures = () => [
  {
    title: "Game Organization",
    description:
      "Easily organize your games by statuses, navigate and check completed ones",
    icon: <Gamepad2 />,
  },
  {
    title: "Progress Tracking",
    description:
      "Measure you backlog in playtime hours, view your yearly progression",
    icon: <BarChart />,
  },
  {
    title: "Shareable wishlists",
    description:
      "Organize games that you want and share them with friends in an easy way of sharing a link to it",
    icon: <Share />,
  },
]
export default function LoginPage() {
  return (
    <div className="container min-h-screen flex-1">
      <header className="flex items-center justify-between p-4 text-white">
        <div className="flex items-center gap-2">
          <Logo name={"PlayLater"} />
        </div>
        <Suspense>
          <GoogleSignIn />
        </Suspense>
      </header>

      <main className="mb-4 flex flex-col">
        <section className="py-4 text-center md:py-6">
          <h2 className="mb-4 text-5xl font-bold">
            Manage Your Gaming Backlog
          </h2>
          <p className="text-xl">
            Organize your games, track progress, and never miss a gaming session
            again.
          </p>
        </section>

        <section className="py-4 md:py-6">
          <section className="p-6">
            <h3 className="mb-12 text-center text-4xl font-extrabold">
              Key Features
            </h3>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {generateFeatures().map((feature, index) => (
                <div
                  className="min-h-60 max-w-sm overflow-hidden rounded bg-muted p-6 text-center shadow-lg"
                  key={index}
                >
                  <div className="mb-4 flex items-center justify-center text-4xl text-primary">
                    {feature.icon}
                  </div>
                  <div className="px-6 py-4 text-slate-300">
                    <div className="mb-2 text-xl font-bold">
                      {feature.title}
                    </div>
                    <p className="text-base text-slate-500">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </section>

        <section className="py-4 text-center md:py-6">
          <h3 className="mb-12 text-center text-4xl font-extrabold">
            Join project&apos;s Discord server
          </h3>
          <p className="mb-8 text-xl">
            On this server you can request access to application as a tester,
            provide feedback and request new features
          </p>
          <Button className="bg-discord">
            <Link href="https://discord.gg/NK3THJyPeT" target="_blank">
              PlayLater&apos;s server
            </Link>
          </Button>
        </section>

        <section className="container mx-auto py-4 text-center md:py-6">
          <h2 className="mb-12 text-center text-4xl font-extrabold text-white">
            Screenshots
          </h2>
          <Carousel opts={{ loop: true }}>
            <CarouselContent>
              <CarouselItem>
                <div>
                  <label>Library overview</label>
                  <Image
                    src={library}
                    alt="Libary overview"
                    fill
                    className="!relative h-auto"
                  />
                </div>
              </CarouselItem>
              <CarouselItem>
                <div>
                  <label>Shared wishlist overview</label>
                  <Image
                    src={sharedWishlist}
                    alt="Shared wishlist overview"
                    fill
                    className="!relative h-auto"
                  />
                </div>
              </CarouselItem>
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </section>
      </main>

      <footer className="p-4 text-center text-white">
        <div className="container mx-auto text-center">
          <p>&copy; 2023-{new Date().getFullYear()} PlayLater.</p>
        </div>
      </footer>
    </div>
  )
}
