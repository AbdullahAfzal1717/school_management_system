import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/sign-in" },
  callbacks: {
    authorized: ({ token }) => Boolean(token),
  },
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/teacher/:path*",
    "/student/:path*",
    "/parent/:path*",
    "/list/:path*",
    "/profile/:path*",
    "/settings/:path*",
  ],
};
