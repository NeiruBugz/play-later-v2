import { withAuth } from "next-auth/middleware"

export default withAuth({
  callbacks: {
    authorized: async ({ req, token }) => {
      const pathname = req.nextUrl.pathname
      if (token) return true

      if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/images/") ||
        pathname === "/favicon.ico" ||
        pathname.includes("shared-wishlist") ||
        pathname.includes("privacy-policy")
      ) {
        return true
      }

      return false
    },
  },
  pages: {
    signIn: "/login",
  },
})
