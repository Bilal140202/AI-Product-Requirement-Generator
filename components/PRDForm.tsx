"use client";

import { ExportButtons } from "@/components/ExportButtons";
import { MarkdownViewer } from "@/components/MarkdownViewer";
import { generatePrdWithWebLLM } from "@/lib/webllm-client";
import { Sparkles, WandSparkles } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

const loadingSteps = [
  "Analyzing prompt...",
  "Structuring features...",
  "Drafting user stories..."
];

type AssetPayload = {
  imageUrl?: string;
};

type Provider = "openrouter" | "pollinations" | "webllm";

function extractTitle(markdown: string, fallbackIdea: string) {
  const firstHeading = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (firstHeading) {
    return firstHeading.replace(/\s+PRD$/i, "");
  }

  return fallbackIdea;
}

export function PRDForm() {
  const [provider, setProvider] = useState<Provider>("pollinations");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("openai");
  const [idea, setIdea] = useState("");
  const [audience, setAudience] = useState("");
  const [constraints, setConstraints] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(false);
  const [assetUrl, setAssetUrl] = useState("");
  const [error, setError] = useState("");
  const [stepIndex, setStepIndex] = useState(0);
  const [liveStatus, setLiveStatus] = useState("");

  useEffect(() => {
    if (!loading || provider === "webllm") {
      setStepIndex(0);
      return;
    }

    const intervalId = window.setInterval(() => {
      setStepIndex((current) => (current + 1) % loadingSteps.length);
    }, 850);

    return () => window.clearInterval(intervalId);
  }, [loading, provider]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setLiveStatus("");

    try {
      let nextMarkdown = "";
      let nextTitle = idea;

      if (provider === "webllm") {
        nextMarkdown = await generatePrdWithWebLLM({
          model: model.trim(),
          idea,
          audience,
          constraints,
          competitors,
          onProgress: setLiveStatus
        });
        nextTitle = extractTitle(nextMarkdown, idea);
      } else {
        const payload = {
          provider,
          apiKey: apiKey.trim(),
          model: model.trim(),
          idea,
          audience,
          constraints,
          competitors
        };

        const response = await fetch("/api/generate-prd", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        const data = (await response.json()) as { markdown?: string; error?: string; title?: string };

        if (!response.ok || !data.markdown) {
          throw new Error(data.error || "Failed to generate PRD.");
        }

        nextMarkdown = data.markdown;
        nextTitle = data.title || idea;
      }

      setMarkdown(nextMarkdown);

      if (provider !== "webllm") {
        const assetResponse = await fetch("/api/assets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            title: nextTitle,
            provider,
            apiKey: apiKey.trim()
          })
        });

        if (assetResponse.ok) {
          const assetData = (await assetResponse.json()) as AssetPayload;
          setAssetUrl(assetData.imageUrl || "");
        }
      } else {
        setAssetUrl("");
      }
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "A request failed. Your input is still here, so you can retry."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <form className="glass-panel rounded-[2rem] p-6 sm:p-8" onSubmit={onSubmit}>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-sky-400/10 p-3 text-sky-300">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Generate a PRD</h2>
            <p className="text-sm text-slate-400">Use a real provider only. No placeholder PRDs are returned anymore.</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">AI provider</span>
              <select
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white"
                onChange={(event) => {
                  const nextProvider = event.target.value as Provider;
                  setProvider(nextProvider);
                  if (nextProvider === "openrouter") {
                    setModel("openai/gpt-4.1-mini");
                  } else if (nextProvider === "webllm") {
                    setModel("Llama-3.1-8B-Instruct");
                  } else {
                    setModel("openai");
                  }
                }}
                value={provider}
              >
                <option value="pollinations">Pollinations</option>
                <option value="openrouter">OpenRouter</option>
                <option value="webllm">WebLLM (free local)</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">
                {provider === "openrouter"
                  ? "OpenRouter API key"
                  : provider === "pollinations"
                    ? "Pollinations API key"
                    : "API key not needed"}
              </span>
              <input
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white placeholder:text-slate-500 disabled:opacity-50"
                disabled={provider === "webllm"}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder={
                  provider === "openrouter"
                    ? "sk-or-v1-..."
                    : provider === "pollinations"
                      ? "Optional if your Pollinations endpoint allows anonymous access"
                      : "Runs directly in the browser with WebGPU"
                }
                type="password"
                value={provider === "webllm" ? "" : apiKey}
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Model</span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white placeholder:text-slate-500"
              onChange={(event) => setModel(event.target.value)}
              placeholder={
                provider === "openrouter"
                  ? "openai/gpt-4.1-mini"
                  : provider === "webllm"
                    ? "Llama-3.1-8B-Instruct"
                    : "openai"
              }
              value={model}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">What are you trying to build?</span>
            <textarea
              className="min-h-48 w-full rounded-[1.5rem] border border-white/10 bg-slate-950/60 px-4 py-4 text-base text-white outline-none placeholder:text-slate-500 focus:border-sky-300/40"
              onChange={(event) => setIdea(event.target.value)}
              placeholder="Example: an AI assistant that turns raw customer calls into product insights"
              required
              value={idea}
            />
          </label>

          <details className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
            <summary className="cursor-pointer list-none font-medium text-white">Advanced inputs</summary>
            <div className="mt-4 grid gap-4">
              <input
                className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white placeholder:text-slate-500"
                onChange={(event) => setAudience(event.target.value)}
                placeholder="Target audience"
                value={audience}
              />
              <textarea
                className="min-h-24 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white placeholder:text-slate-500"
                onChange={(event) => setConstraints(event.target.value)}
                placeholder="Technical constraints"
                value={constraints}
              />
              <input
                className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white placeholder:text-slate-500"
                onChange={(event) => setCompetitors(event.target.value)}
                placeholder="Competitors"
                value={competitors}
              />
            </div>
          </details>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button
            className="inline-flex items-center gap-2 rounded-full bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={loading || !model.trim() || (provider === "openrouter" && !apiKey.trim())}
            type="submit"
          >
            <WandSparkles className="h-4 w-4" />
            {loading ? "Generating..." : "Generate PRD"}
          </button>
          {loading && provider !== "webllm" ? <span className="text-sm text-slate-400">{loadingSteps[stepIndex]}</span> : null}
          {loading && provider === "webllm" && liveStatus ? <span className="text-sm text-slate-400">{liveStatus}</span> : null}
          {error ? <span className="text-sm text-rose-300">{error}</span> : null}
          {!error && provider === "pollinations" ? (
            <span className="text-sm text-slate-500">
              Pollinations is attempted live. If your endpoint rejects anonymous access, add a key and retry.
            </span>
          ) : null}
          {!error && provider === "webllm" ? (
            <span className="text-sm text-slate-500">
              WebLLM runs fully in-browser and requires a WebGPU-capable browser. First load may download a large model.
            </span>
          ) : null}
        </div>
      </form>

      <div className="glass-panel rounded-[2rem] p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Results</h2>
            <p className="text-sm text-slate-400">Review the generated document, copy it, or export it as a PDF.</p>
          </div>
          <ExportButtons markdown={markdown} targetId="prd-output" />
        </div>

        {assetUrl ? (
          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-white/10">
            <img alt="Generated PRD cover" className="h-52 w-full object-cover" src={assetUrl} />
          </div>
        ) : null}

        <div className="mt-6" id="prd-output">
          <MarkdownViewer content={markdown} />
        </div>
      </div>
    </div>
  );
}
