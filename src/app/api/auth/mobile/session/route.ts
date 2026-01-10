import { NextResponse } from "next/server"
import { validateMobileToken } from "@/lib/mobileAuth"

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authorization header required" },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7) // Remove "Bearer " prefix
    const user = await validateMobileToken(token)

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token, // Return the same token for convenience
    })
  } catch (error: any) {
    console.error("Session validation error:", error)
    return NextResponse.json(
      { error: "Session validation failed" },
      { status: 500 }
    )
  }
}

