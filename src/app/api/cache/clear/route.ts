import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    revalidateTag("*");
    return NextResponse.json({
      success: true,
      message: "All caches cleared",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to clear cache" },
      { status: 500 },
    );
  }
}
