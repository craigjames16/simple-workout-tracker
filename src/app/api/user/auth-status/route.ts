import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has a password
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        password: true,
        accounts: {
          select: {
            provider: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const hasPassword = !!user.password
    const linkedProviders = user.accounts.map((account) => account.provider)

    return NextResponse.json({
      hasPassword,
      linkedProviders,
    })
  } catch (error) {
    console.error("Error fetching auth status:", error)
    return NextResponse.json(
      { error: "Failed to fetch auth status" },
      { status: 500 }
    )
  }
}

