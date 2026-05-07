"use client";

type GenerateLocalPrdInput = {
  model: string;
  idea: string;
  audience?: string;
  constraints?: string;
  competitors?: string;
  onProgress?: (message: string) => void;
};

let cachedModel = "";
let cachedEngine: {
  chat: {
    completions: {
      create(args: {
        messages: Array<{ role: "system" | "user"; content: string }>;
        temperature: number;
      }): Promise<{
        choices?: Array<{
          message?: {
            content?: string | null;
          };
        }>;
      }>;
    };
  };
} | null = null;

function buildPrompt(input: GenerateLocalPrdInput) {
  return [
    `Idea: ${input.idea}`,
    `Target Audience: ${input.audience || "Not specified"}`,
    `Technical Constraints: ${input.constraints || "Not specified"}`,
    `Competitors: ${input.competitors || "Not specified"}`,
    "Return only the finished markdown PRD."
  ].join("\n");
}

export async function generatePrdWithWebLLM(input: GenerateLocalPrdInput) {
  if (typeof window === "undefined") {
    throw new Error("WebLLM can only run in the browser.");
  }

  if (!("gpu" in navigator)) {
    throw new Error("WebLLM requires a WebGPU-capable browser.");
  }

  const webllm = await import("@mlc-ai/web-llm");

  if (!cachedEngine || cachedModel !== input.model) {
    input.onProgress?.("Loading local model...");
    cachedEngine = await webllm.CreateMLCEngine(input.model, {
      initProgressCallback(progress) {
        const text = typeof progress.text === "string" ? progress.text : "Loading local model...";
        input.onProgress?.(text);
      }
    });
    cachedModel = input.model;
  }

  input.onProgress?.("Running local inference...");

  const reply = await cachedEngine.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "You are a senior Product Manager. Output a markdown PRD with these sections exactly: 1. Objective 2. Target Audience 3. User Stories 4. Non-functional Requirements 5. MVP Scope 6. Delivery Plan. Do not use placeholders or generic filler."
      },
      {
        role: "user",
        content: buildPrompt(input)
      }
    ],
    temperature: 0.4
  });

  const markdown = reply.choices?.[0]?.message?.content?.trim();
  if (!markdown) {
    throw new Error("WebLLM did not return markdown content.");
  }

  return markdown;
}
