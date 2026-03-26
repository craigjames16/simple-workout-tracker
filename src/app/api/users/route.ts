import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/getAuthUser"
import { prisma } from "@/lib/prisma"

/**
 * Soft-delete the authenticated user (mobile Bearer token or web session).
 */
export async function DELETE(request: Request) {
  try {
    const userId = await getAuthUser(request)

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error: any) {
    console.error("DELETE /api/users error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete account" },
      { status: 500 }
    )
  }
}
