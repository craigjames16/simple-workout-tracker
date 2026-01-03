import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: "/signin",
    error: "/error",
  },
  callbacks: {
    authorized: ({ req }) => !!req.cookies.get("next-auth.session-token") || !!req.cookies.get("__Secure-next-auth.session-token")
  }
})

export const config = {
    matcher: [
      "/plans/:path*",
      "/plan/:path*",
      "/track/:path*",
      "/exercises",
      "/workouts",
      "/mesocycle",
      "/account",
      "/data",
      // API routes are excluded - they handle their own authentication
      // using getAuthUser which supports both cookies and Bearer tokens
      // "/((?!auth|api/auth|$).*)",
    ],
  } 