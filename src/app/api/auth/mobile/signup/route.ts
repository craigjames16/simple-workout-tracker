import { NextResponse } from "next/server"
import { authenticateUser, generateMobileToken } from "@/lib/mobileAuth"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      )
    }

    const user = await authenticateUser(email, password, true)

    if (!user) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      )
    }

    const token = await generateMobileToken(user)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    })
  } catch (error: any) {
    console.error("Sign up error:", error)
    return NextResponse.json(
      { error: error.message || "Sign up failed" },
      { status: 400 }
    )
  }
}

