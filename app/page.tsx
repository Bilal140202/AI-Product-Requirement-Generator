import { PRDForm } from "@/components/PRDForm";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-8 sm:px-8 lg:px-10">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] px-6 py-10 shadow-2xl shadow-sky-950/30 sm:px-10 sm:py-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.15),transparent_24%)]" />
        <div className="relative flex flex-col gap-6">
          <span className="w-fit rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs uppercase tracking-[0.28em] text-sky-200">
            AI Product Ops
          </span>
          <div className="max-w-3xl">
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-6xl">
              Turn a rough product idea into a decision-ready PRD.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-slate-300 sm:text-lg">
              Draft objectives, target audience, user stories, non-functional requirements, and a delivery plan in one pass.
            </p>
          </div>
          <div className="grid gap-4 text-sm text-slate-300 sm:grid-cols-3">
            <div className="glass-panel rounded-2xl p-4">Structured markdown output</div>
            <div className="glass-panel rounded-2xl p-4">Optional cover image prompt generation</div>
            <div className="glass-panel rounded-2xl p-4">Copy and PDF export built in</div>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <PRDForm />
      </section>
    </main>
  );
}
