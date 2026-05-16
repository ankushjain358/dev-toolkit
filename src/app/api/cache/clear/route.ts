import { revalidateTag, revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all");
    const path = searchParams.get("path");
    const tag = searchParams.get("tag");

    if (all === "true") {
      // Revalidates the root layout and all pages beneath it
      revalidatePath("/", "layout");
      return NextResponse.json({
        success: true,
        message: "Cache cleared for all paths",
      });
    }

    if (path) {
      revalidatePath(path);
      return NextResponse.json({
        success: true,
        message: `Cache cleared for path: ${path}`,
      });
    }

    if (tag) {
      revalidateTag(tag);
      return NextResponse.json({
        success: true,
        message: `Cache cleared for tag: ${tag}`,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Nothing was cleared",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to clear cache" },
      { status: 500 },
    );
  }
}
