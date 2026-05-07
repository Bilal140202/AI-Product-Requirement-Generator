"use client";

import { ExportButtons } from "@/components/ExportButtons";
import { MarkdownViewer } from "@/components/MarkdownViewer";
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

export function PRDForm() {
  const [idea, setIdea] = useState("");
  const [audience, setAudience] = useState("");
  const [constraints, setConstraints] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(false);
  const [assetUrl, setAssetUrl] = useState("");
  const [error, setError] = useState("");
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!loading) {
      setStepIndex(0);
      return;
    }

    const intervalId = window.setInterval(() => {
      setStepIndex((current) => (current + 1) % loadingSteps.length);
    }, 850);

    return () => window.clearInterval(intervalId);
  }, [loading]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = { idea, audience, constraints, competitors };

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

      setMarkdown(data.markdown);

      const assetResponse = await fetch("/api/assets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: data.title || idea
        })
      });

      if (assetResponse.ok) {
        const assetData = (await assetResponse.json()) as AssetPayload;
        setAssetUrl(assetData.imageUrl || "");
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
            <p className="text-sm text-slate-400">Describe the product clearly enough for the generator to structure it.</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
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
            disabled={loading}
            type="submit"
          >
            <WandSparkles className="h-4 w-4" />
            {loading ? "Generating..." : "Generate PRD"}
          </button>
          {loading ? <span className="text-sm text-slate-400">{loadingSteps[stepIndex]}</span> : null}
          {error ? <span className="text-sm text-rose-300">{error}</span> : null}
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
