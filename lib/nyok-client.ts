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

function buildPrompt(input: GeneratePrdInput) {
  return [
    `Idea: ${input.idea}`,
    `Target Audience: ${input.audience || "Not specified"}`,
    `Technical Constraints: ${input.constraints || "Not specified"}`,
    `Competitors: ${input.competitors || "Not specified"}`,
    "Return only the finished markdown PRD."
  ].join("\n");
}

function buildHeaders(apiKey: string | undefined, extraHeaders?: Record<string, string>) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extraHeaders
  };

  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  return headers;
}

function createSseTextStream(source: ReadableStream<Uint8Array>) {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = source.getReader();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() || "";

          for (const event of events) {
            const lines = event
              .split("\n")
              .map((line) => line.trim())
              .filter((line) => line.startsWith("data:"));

            for (const line of lines) {
              const payload = line.slice(5).trim();
              if (!payload || payload === "[DONE]") {
                continue;
              }

              try {
                const json = JSON.parse(payload) as {
                  choices?: Array<{
                    delta?: { content?: string | null };
                    message?: { content?: string | null };
                  }>;
                };

                const chunk =
                  json.choices?.[0]?.delta?.content ??
                  json.choices?.[0]?.message?.content ??
                  "";

                if (chunk) {
                  controller.enqueue(encoder.encode(chunk));
                }
              } catch {
                continue;
              }
            }
          }
        }

        if (buffer.trim()) {
          const lines = buffer
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.startsWith("data:"));

          for (const line of lines) {
            const payload = line.slice(5).trim();
            if (!payload || payload === "[DONE]") {
              continue;
            }
            try {
              const json = JSON.parse(payload) as {
                choices?: Array<{
                  delta?: { content?: string | null };
                  message?: { content?: string | null };
                }>;
              };
              const chunk =
                json.choices?.[0]?.delta?.content ??
                json.choices?.[0]?.message?.content ??
                "";
              if (chunk) {
                controller.enqueue(encoder.encode(chunk));
              }
            } catch {
              continue;
            }
          }
        }

        controller.close();
      } catch (error) {
        controller.error(error);
      } finally {
        reader.releaseLock();
      }
    }
  });
}

async function requestProviderStream(
  apiUrl: string,
  apiKey: string | undefined,
  model: string,
  input: GeneratePrdInput,
  extraHeaders?: Record<string, string>
) {
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: buildHeaders(apiKey, extraHeaders),
    body: JSON.stringify({
      model,
      temperature: 0.4,
      stream: true,
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

  if (!response.body) {
    throw new Error("Provider response did not include a readable stream.");
  }

  return createSseTextStream(response.body);
}

export async function streamPrd(input: GeneratePrdInput) {
  const provider = input.provider || "pollinations";
  const model =
    input.model?.trim() ||
    (provider === "openrouter" ? "openai/gpt-4.1-mini" : "openai");

  if (provider === "openrouter") {
    if (!input.apiKey) {
      throw new Error("OpenRouter requires a user-provided API key.");
    }

    return requestProviderStream(
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

  return requestProviderStream(
    "https://gen.pollinations.ai/v1/chat/completions",
    input.apiKey,
    model,
    input
  );
}
