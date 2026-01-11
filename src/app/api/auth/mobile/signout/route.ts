import { NextResponse } from "next/server"

export async function POST() {
  // For mobile apps, signout is handled client-side by clearing the token
  // This endpoint exists for consistency with the API structure
  return NextResponse.json({ message: "Signed out successfully" })
}

