import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
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
      "/api/plans/:path*", 
      "/api/exercises/:path*",
      "/api/workout-instances/:path*",
      "/api/plan-instances/:path*",
      "/api/mesocycles/:path*",
      "/dashboard",
      "/api/dashboard",
      // "/((?!auth|api/auth|$).*)",
    ],
  } 