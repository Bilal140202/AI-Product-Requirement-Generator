"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownViewerProps = {
  content: string;
};

export function MarkdownViewer({ content }: MarkdownViewerProps) {
  return (
    <div className="prose-prd min-h-[420px] rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-6">
      {content ? (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      ) : (
        <div className="flex h-full min-h-[360px] items-center justify-center text-center text-slate-400">
          Generated PRD output will appear here.
        </div>
      )}
    </div>
  );
}
