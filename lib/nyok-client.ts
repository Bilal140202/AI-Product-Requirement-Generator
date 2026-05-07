const SYSTEM_PROMPT = `You are a senior Product Manager. Output a markdown PRD with these sections exactly:
1. Objective
2. Target Audience
3. User Stories
4. Non-functional Requirements
5. MVP Scope
6. Delivery Plan`;

type GeneratePrdInput = {
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
    `Competitors: ${input.competitors || "Not specified"}`
  ].join("\n");
}

function extractTitle(idea: string) {
  return (
    idea
      .replace(/[^a-zA-Z0-9 ]/g, " ")
      .trim()
      .split(/\s+/)
      .slice(0, 6)
      .join(" ") || "Product Concept"
  );
}

function buildFallbackPrd(input: GeneratePrdInput) {
  const title = extractTitle(input.idea);
  return {
    title,
    markdown: `# ${title} PRD

## 1. Objective
Build ${input.idea.trim()} with a clear first-release scope that validates demand quickly and creates a foundation for iteration.

## 2. Target Audience
- Primary users: ${input.audience || "Early adopters and internal stakeholders"}
- Core pain point: they need a faster, clearer way to solve the job described in the prompt
- Success signal: repeat usage and measurable reduction in manual effort

## 3. User Stories
- As a primary user, I want to understand the product value immediately so I can decide whether it solves my problem.
- As a primary user, I want a simple onboarding and first action flow so I can reach value within minutes.
- As a team owner, I want the product to capture structured usage data so I can prioritize future work.
- As an operator, I want guardrails around failures and edge cases so the product remains reliable.

## 4. Non-functional Requirements
- Performance: core interactions should feel responsive on standard desktop and mobile devices.
- Reliability: user input should not be lost during transient API failures.
- Security: sensitive inputs and keys must stay server-side.
- Accessibility: keyboard-accessible controls and readable contrast are required.

## 5. MVP Scope
- Landing page explaining the product value
- Primary workflow for submitting the idea and reviewing generated output
- Export and copy actions for the generated PRD
- Basic analytics and error states for failed generation attempts

## 6. Delivery Plan
1. Ship the core generation flow and structured output.
2. Validate generated quality against real prompts from the target audience.
3. Add richer collaboration, templates, and revision workflows after initial feedback.

## Notes
- Constraints: ${input.constraints || "None specified"}
- Competitors to evaluate: ${input.competitors || "None specified"}
`
  };
}

export async function generatePrd(input: GeneratePrdInput) {
  const apiUrl = process.env.NYOK_API_URL;
  const apiKey = process.env.NYOK_API_KEY;
  const model = process.env.NYOK_MODEL;

  if (!apiUrl || !apiKey) {
    return buildFallbackPrd(input);
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      system: SYSTEM_PROMPT,
      prompt: buildPrompt(input)
    })
  });

  if (!response.ok) {
    throw new Error(`NYOK request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as {
    text?: string;
    output?: string;
    content?: string;
    title?: string;
  };

  const markdown = payload.text || payload.output || payload.content;
  if (!markdown) {
    throw new Error("NYOK response did not include markdown content.");
  }

  return {
    title: payload.title || extractTitle(input.idea),
    markdown
  };
}
