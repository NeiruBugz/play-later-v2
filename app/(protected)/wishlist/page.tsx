import { prisma } from "@/lib/prisma"

export default async function WishlistPage() {
  const wishlist = await prisma.wishlistedGame.findMany()
  return (
    <section>
      <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl">
        Wishlist
      </h1>
      <section>
        {!wishlist || wishlist.length === 0 ? <h2>Wishlist is empty</h2> : null}
      </section>
    </section>
  )
}
