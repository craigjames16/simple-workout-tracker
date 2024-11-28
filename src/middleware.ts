// export { default } from "next-auth/middleware"
import { withAuth } from "next-auth/middleware"

export default withAuth(
    function middleware(req){},
    {
      callbacks: {
          authorized: ({ req }) => { // Return boolean indicating if user is authorized
              return !!req.cookies.get("next-auth.session-token")
      },
      pages: {
          signIn: "/auth/signin", 
          error: "/auth/error",
      }
    }})

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
      "/((?!auth|api/auth|$).*)",
    ],
  } 