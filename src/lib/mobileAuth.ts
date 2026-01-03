import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { encode } from "next-auth/jwt"

export interface AuthUser {
  id: string
  email: string
  name: string | null
}

/**
 * Shared authentication logic for mobile and web
 */
export async function authenticateUser(
  email: string,
  password: string,
  isSignUp: boolean = false
): Promise<AuthUser | null> {
  if (isSignUp) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      throw new Error("User already exists with this email")
    }

    // Create new user
    const hashedPassword = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    })

    return {
      id: user.id,
      email: user.email || email, // email should always be set for credentials auth
      name: user.name,
    }
  } else {
    // Sign in request
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user || !user.password || !user.email) {
      return null
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    }
  }
}

/**
 * Generate a JWT token for mobile apps
 */
export async function generateMobileToken(user: AuthUser): Promise<string> {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is not configured")
  }

  const token = await encode({
    token: {
      sub: user.id,
      email: user.email,
      name: user.name,
    },
    secret,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  })

  return token
}

/**
 * Decode and validate a JWT token from mobile apps
 */
export async function validateMobileToken(token: string): Promise<AuthUser | null> {
  try {
    const { decode } = await import("next-auth/jwt")
    const secret = process.env.NEXTAUTH_SECRET
    if (!secret) {
      return null
    }

    const decoded = await decode({
      token,
      secret,
    })

    if (!decoded || !decoded.sub) {
      return null
    }

    // Fetch user from database to ensure they still exist
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub as string },
      select: {
        id: true,
        email: true,
        name: true,
      },
    })

    if (!user || !user.email) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    }
  } catch (error) {
    console.error("Error validating mobile token:", error)
    return null
  }
}

