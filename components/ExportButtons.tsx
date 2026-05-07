"use client";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Copy, Download } from "lucide-react";
import { useState } from "react";

type ExportButtonsProps = {
  markdown: string;
  targetId: string;
};

export function ExportButtons({ markdown, targetId }: ExportButtonsProps) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    if (!markdown) {
      return;
    }
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const exportPdf = async () => {
    if (!markdown) {
      return;
    }

    const target = document.getElementById(targetId);
    if (!target) {
      return;
    }

    setBusy(true);
    try {
      const canvas = await html2canvas(target, {
        backgroundColor: "#08111f",
        scale: 2
      });
      const image = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const width = 210;
      const height = (canvas.height * width) / canvas.width;
      pdf.addImage(image, "PNG", 0, 0, width, height);
      pdf.save("product-requirements-document.pdf");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      <button
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!markdown}
        onClick={copyToClipboard}
        type="button"
      >
        <Copy className="h-4 w-4" />
        {copied ? "Copied" : "Copy Markdown"}
      </button>
      <button
        className="inline-flex items-center gap-2 rounded-full bg-sky-400 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!markdown || busy}
        onClick={exportPdf}
        type="button"
      >
        <Download className="h-4 w-4" />
        {busy ? "Exporting..." : "Export PDF"}
      </button>
    </div>
  );
}
