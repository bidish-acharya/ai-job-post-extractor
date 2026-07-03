"use client";

import { useState } from "react";

type HiringSignals = {
  role_title: string;
  company: string;
  location: string;
  required_skills: string[];
  nice_to_have_skills: string[];
  tools: string[];
  seniority: string;
  language_requirement: string;
  fit_for_my_profile: string;
  fit_reason: string;
  application_positioning: string;
};

const samplePrompt =
  "Paste a job post here. Include the company intro, responsibilities, requirements, tools, location, and anything else from the listing.";

function FieldCard({
  label,
  children,
}: {
  label: keyof HiringSignals;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <div className="mt-3 text-sm leading-6 text-slate-800">{children}</div>
    </section>
  );
}

function PillList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-700"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      {[0, 1, 2, 3].map((item) => (
        <div
          key={item}
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="h-3 w-28 rounded-full bg-slate-200" />
          <div className="mt-4 h-4 w-full rounded-full bg-slate-100" />
          <div className="mt-2 h-4 w-3/4 rounded-full bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [jobPost, setJobPost] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<HiringSignals | null>(null);

  const canAnalyze = jobPost.trim().length > 0 && !isLoading;

  async function handleAnalyze() {
    if (!canAnalyze) {
      return;
    }

    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobText: jobPost }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to analyze this job post.");
      }

      setResult(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to analyze this job post.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950 sm:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
            AI analysis UI
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            AI Job Post Extractor
          </h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            Turn messy job descriptions into structured hiring signals you can
            scan, compare, and use for application positioning.
          </p>
        </header>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-10">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="job-post"
                className="text-sm font-semibold text-slate-900"
              >
                Job description
              </label>
              <textarea
                id="job-post"
                value={jobPost}
                onChange={(event) => setJobPost(event.target.value)}
                placeholder={samplePrompt}
                className="min-h-[460px] resize-y rounded-lg border border-slate-300 bg-white px-4 py-3 text-base leading-7 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
              />
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                {jobPost.trim()
                  ? `${jobPost.trim().split(/\s+/).length} words ready to analyze`
                  : "Paste a job description to begin."}
              </p>
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={!canAnalyze}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
              >
                {isLoading ? "Analyzing..." : "Analyze job post"}
              </button>
            </div>
          </section>

          <aside className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">
                Structured signals
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Paste a job post to extract structured role, skills, tooling,
                fit, and positioning signals.
              </p>
            </div>

            {isLoading ? (
              <LoadingState />
            ) : error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-800 shadow-sm">
                {error}
              </div>
            ) : result ? (
              <div className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldCard label="role_title">{result.role_title}</FieldCard>
                  <FieldCard label="company">{result.company}</FieldCard>
                </div>
                <FieldCard label="location">{result.location}</FieldCard>
                <FieldCard label="required_skills">
                  <PillList items={result.required_skills} />
                </FieldCard>
                <FieldCard label="nice_to_have_skills">
                  <PillList items={result.nice_to_have_skills} />
                </FieldCard>
                <FieldCard label="tools">
                  <PillList items={result.tools} />
                </FieldCard>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldCard label="seniority">{result.seniority}</FieldCard>
                  <FieldCard label="language_requirement">
                    {result.language_requirement}
                  </FieldCard>
                </div>
                <FieldCard label="fit_for_my_profile">
                  {result.fit_for_my_profile}
                </FieldCard>
                <FieldCard label="fit_reason">{result.fit_reason}</FieldCard>
                <FieldCard label="application_positioning">
                  {result.application_positioning}
                </FieldCard>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-50 text-lg font-semibold text-cyan-700">
                  AI
                </div>
                <h2 className="mt-5 text-lg font-semibold text-slate-950">
                  No analysis yet
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Add a job post and run the analyzer to preview the hiring
                  signals here.
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
