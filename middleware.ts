import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: async ({ req, token }) => {
      const pathname = req.nextUrl.pathname;
      if (token) return true;

      return (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/images/") ||
        pathname === "/favicon.ico" ||
        pathname.includes("shared-wishlist") ||
        pathname.includes("privacy-policy")
      );
    },
  },
  pages: {
    signIn: "/login",
  },
});
