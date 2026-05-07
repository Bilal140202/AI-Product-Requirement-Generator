import { enforceRateLimit } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

function buildImageUrl(title: string) {
  const prompt = encodeURIComponent(
    `premium product requirement document cover art, product strategy dashboard, ${title}, clean cinematic interface, blue glassmorphism`
  );
  return `https://image.pollinations.ai/prompt/${prompt}?width=1400&height=700&seed=42&model=flux`;
}

export async function POST(request: NextRequest) {
  try {
    const forwardedFor = request.headers.get("x-forwarded-for") || "local";
    enforceRateLimit(`asset:${forwardedFor}`);

    const body = (await request.json()) as { title?: string };
    const title = body.title?.trim() || "Product Requirements";

    return NextResponse.json({
      imageUrl: buildImageUrl(title)
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unexpected asset generation failure."
      },
      { status: 500 }
    );
  }
}
