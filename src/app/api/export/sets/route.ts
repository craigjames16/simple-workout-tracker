import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/getAuthUser"
import { buildSetsCsvForUser } from "@/lib/userDataExport"

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUser(request)
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const csvContent = await buildSetsCsvForUser(userId)
    const dateStamp = new Date().toISOString().split("T")[0]

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="workout-data-export-${dateStamp}.csv"`,
      },
    })
  } catch (error) {
    console.error("Error exporting data:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
