const SYSTEM_PROMPT = `You are a senior Product Manager. Output a markdown PRD with these sections exactly:
1. Objective
2. Target Audience
3. User Stories
4. Non-functional Requirements
5. MVP Scope
6. Delivery Plan

Do not use placeholders or generic filler. Base every section on the user's actual product idea, audience, constraints, and competitors.`;

type Provider = "openrouter" | "pollinations";

type GeneratePrdInput = {
  provider?: Provider;
  apiKey?: string;
  model?: string;
  idea: string;
  audience?: string;
  constraints?: string;
  competitors?: string;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
};

function buildPrompt(input: GeneratePrdInput) {
  return [
    `Idea: ${input.idea}`,
    `Target Audience: ${input.audience || "Not specified"}`,
    `Technical Constraints: ${input.constraints || "Not specified"}`,
    `Competitors: ${input.competitors || "Not specified"}`,
    "Return only the finished markdown PRD."
  ].join("\n");
}

function extractTitle(markdown: string, fallbackIdea: string) {
  const firstHeading = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (firstHeading) {
    return firstHeading.replace(/\s+PRD$/i, "");
  }

  return (
    fallbackIdea
      .replace(/[^a-zA-Z0-9 ]/g, " ")
      .trim()
      .split(/\s+/)
      .slice(0, 6)
      .join(" ") || "Product Concept"
  );
}

function extractMarkdown(payload: ChatCompletionResponse) {
  const content = payload.choices?.[0]?.message?.content;
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => (part.type === "text" ? part.text || "" : ""))
      .join("")
      .trim();
  }

  return "";
}

async function callOpenAiCompatibleApi(
  apiUrl: string,
  apiKey: string | undefined,
  model: string,
  input: GeneratePrdInput,
  extraHeaders?: Record<string, string>
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extraHeaders
  };

  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: buildPrompt(input)
        }
      ]
    })
  });

  if (!response.ok) {
    const failureText = await response.text();
    throw new Error(
      `Provider request failed with status ${response.status}${failureText ? `: ${failureText}` : "."}`
    );
  }

  const payload = (await response.json()) as ChatCompletionResponse;
  const markdown = extractMarkdown(payload);
  if (!markdown) {
    throw new Error("Provider response did not include markdown content.");
  }

  return {
    title: extractTitle(markdown, input.idea),
    markdown
  };
}

export async function generatePrd(input: GeneratePrdInput) {
  const provider = input.provider || "pollinations";
  const model =
    input.model?.trim() ||
    (provider === "openrouter" ? "openai/gpt-4.1-mini" : "openai");

  if (provider === "openrouter") {
    if (!input.apiKey) {
      throw new Error("OpenRouter requires a user-provided API key.");
    }

    return callOpenAiCompatibleApi(
      "https://openrouter.ai/api/v1/chat/completions",
      input.apiKey,
      model,
      input,
      {
        "HTTP-Referer": "https://github.com/Bilal140202/AI-Product-Requirement-Generator",
        "X-Title": "AI Product Requirement Generator"
      }
    );
  }

  return callOpenAiCompatibleApi(
    "https://gen.pollinations.ai/v1/chat/completions",
    input.apiKey,
    model,
    input
  );
}
