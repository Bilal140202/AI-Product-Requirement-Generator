import { generatePrd } from "@/lib/nyok-client";
import { enforceRateLimit } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const forwardedFor = request.headers.get("x-forwarded-for") || "local";
    enforceRateLimit(`prd:${forwardedFor}`);

    const body = (await request.json()) as {
      provider?: "openrouter" | "pollinations";
      apiKey?: string;
      model?: string;
      idea?: string;
      audience?: string;
      constraints?: string;
      competitors?: string;
    };

    if (!body.idea?.trim()) {
      return NextResponse.json({ error: "Idea is required." }, { status: 400 });
    }

    const result = await generatePrd({
      provider: body.provider,
      apiKey: body.apiKey?.trim(),
      model: body.model?.trim(),
      idea: body.idea.trim(),
      audience: body.audience?.trim(),
      constraints: body.constraints?.trim(),
      competitors: body.competitors?.trim()
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unexpected PRD generation failure."
      },
      { status: 500 }
    );
  }
}
