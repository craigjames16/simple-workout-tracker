import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { validateMobileToken } from "@/lib/mobileAuth"
import { NextRequest } from "next/server"

/**
 * Get authenticated user from either:
 * - NextAuth session (cookie-based, for web)
 * - Bearer token (for mobile apps)
 * 
 * Returns the user ID if authenticated, null otherwise
 */
export async function getAuthUser(request?: NextRequest | Request): Promise<string | null> {
  // First, try to get session from cookies (web app)
  const session = await getServerSession(authOptions)
  if (session?.user?.id) {
    return session.user.id
  }

  // If no session, try Bearer token (mobile app)
  if (request) {
    const authHeader = request.headers.get("authorization")
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7) // Remove "Bearer " prefix
      const user = await validateMobileToken(token)
      if (user) {
        return user.id
      }
    }
  }

  return null
}

/**
 * Get full user object from either session or token
 */
export async function getAuthUserObject(request?: NextRequest | Request): Promise<{ id: string; email: string; name: string | null } | null> {
  // First, try to get session from cookies (web app)
  const session = await getServerSession(authOptions)
  if (session?.user) {
    return {
      id: session.user.id,
      email: session.user.email || "",
      name: session.user.name || null,
    }
  }

  // If no session, try Bearer token (mobile app)
  if (request) {
    const authHeader = request.headers.get("authorization")
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7) // Remove "Bearer " prefix
      const user = await validateMobileToken(token)
      if (user) {
        return user
      }
    }
  }

  return null
}

