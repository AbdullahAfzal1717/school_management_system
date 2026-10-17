import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const destinationForRole: Record<string, string> = {
  ADMIN: "/admin",
  TEACHER: "/teacher",
  STUDENT: "/student",
  PARENT: "/parent",
};

export default withAuth(
  function middleware(request) {
    const role = request.nextauth.token?.role;
    const path = request.nextUrl.pathname;
    const destination =
      typeof role === "string" && destinationForRole[role]
        ? destinationForRole[role]
        : "/sign-in";

    const blocked =
      (path.startsWith("/admin") && role !== "ADMIN") ||
      (path.startsWith("/teacher") && role !== "TEACHER") ||
      (path.startsWith("/student") && role !== "STUDENT") ||
      (path.startsWith("/parent") && role !== "PARENT");

    if (blocked) {
      return NextResponse.redirect(new URL(destination, request.url));
    }

    return NextResponse.next();
  },
  {
    pages: { signIn: "/sign-in" },
    callbacks: {
      authorized: ({ token }) => Boolean(token),
    },
  },
);

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/teacher",
    "/teacher/:path*",
    "/student",
    "/student/:path*",
    "/parent",
    "/parent/:path*",
    "/list/:path*",
    "/profile",
    "/profile/:path*",
    "/settings",
    "/settings/:path*",
  ],
};
