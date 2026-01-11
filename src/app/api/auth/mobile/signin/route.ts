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

    const user = await authenticateUser(email, password, false)

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
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
    console.error("Sign in error:", error)
    return NextResponse.json(
      { error: error.message || "Sign in failed" },
      { status: 500 }
    )
  }
}

