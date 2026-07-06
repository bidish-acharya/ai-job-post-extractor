"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import type { HiringSignals } from "./lib/jobTypes";

const samplePrompt =
  "Paste a job post here. Include the company intro, responsibilities, requirements, tools, location, and anything else from the listing.";

function formatToday() {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
}

function formatLabel(label: string) {
  return label.replaceAll("_", " ");
}

function EmptyValue() {
  return <span className="text-slate-400">Not found in job post</span>;
}

function FieldCard({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {formatLabel(label)}
      </p>
      <div className="mt-3 text-sm leading-6 text-slate-800">{children}</div>
    </section>
  );
}

function TextValue({ value }: { value?: string }) {
  if (!value?.trim()) {
    return <EmptyValue />;
  }

  return <>{value}</>;
}

function PillList({ items }: { items?: string[] }) {
  if (!items || items.length === 0) {
    return <EmptyValue />;
  }

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

function BulletList({ items }: { items?: string[] }) {
  if (!items || items.length === 0) {
    return <EmptyValue />;
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-sm leading-6 text-slate-700">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Badge({
  label,
  value,
  tone,
}: {
  label: string;
  value?: string;
  tone: "fit" | "priority" | "confidence";
}) {
  const safeValue = value || "Medium";

  let className =
    "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold";

  if (tone === "fit") {
    if (safeValue === "Yes") {
      className += " border-emerald-200 bg-emerald-50 text-emerald-700";
    } else if (safeValue === "No") {
      className += " border-red-200 bg-red-50 text-red-700";
    } else {
      className += " border-amber-200 bg-amber-50 text-amber-700";
    }
  }

  if (tone === "priority") {
    if (safeValue === "High") {
      className += " border-cyan-200 bg-cyan-50 text-cyan-700";
    } else if (safeValue === "Low") {
      className += " border-slate-200 bg-slate-50 text-slate-600";
    } else {
      className += " border-amber-200 bg-amber-50 text-amber-700";
    }
  }

  if (tone === "confidence") {
    if (safeValue === "High") {
      className += " border-slate-300 bg-slate-100 text-slate-800";
    } else if (safeValue === "Low") {
      className += " border-red-200 bg-red-50 text-red-700";
    } else {
      className += " border-amber-200 bg-amber-50 text-amber-700";
    }
  }

  return (
    <span className={className}>
      <span className="font-medium opacity-70">{label}:</span>
      <span>{safeValue}</span>
    </span>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      {[0, 1, 2, 3].map((item) => (
        <div
          key={item}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="h-3 w-28 rounded-full bg-slate-200" />
          <div className="mt-4 h-4 w-full rounded-full bg-slate-100" />
          <div className="mt-2 h-4 w-3/4 rounded-full bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function DecisionSummary({ result }: { result: HiringSignals }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap gap-2">
        <Badge label="Fit" value={result.fit_for_my_profile} tone="fit" />
        <Badge
          label="Priority"
          value={result.application_priority}
          tone="priority"
        />
        <Badge label="Confidence" value={result.confidence} tone="confidence" />
      </div>

      <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
        <TextValue value={result.role_title} />
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {[result.company, result.location].filter(Boolean).join(" - ") ||
          "Company or location not found"}
      </p>

      <div className="mt-5 rounded-xl bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Fit reason
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-800">
          <TextValue value={result.fit_reason} />
        </p>
      </div>
    </section>
  );
}

export default function Home() {
  const [todayLabel, setTodayLabel] = useState("");
  const [jobPost, setJobPost] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [result, setResult] = useState<HiringSignals | null>(null);

  const canAnalyze = jobPost.trim().length > 0 && !isLoading;
  const canSave =
    Boolean(result) && jobPost.trim().length > 0 && !isSaving && !saveMessage;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTodayLabel(formatToday());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  async function handleAnalyze() {
    if (!canAnalyze) {
      return;
    }

    setIsLoading(true);
    setError("");
    setSaveError("");
    setSaveMessage("");
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

  async function handleSave() {
    if (!canSave || !result) {
      return;
    }

    setIsSaving(true);
    setSaveError("");
    setSaveMessage("");

    try {
      const response = await fetch("/api/saved", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobText: jobPost,
          analysis: result,
          status: "did_not_apply",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to save this analysis.");
      }

      setSaveMessage("Saved. You can label it on the saved page.");
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Unable to save this analysis.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950 sm:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
              {todayLabel || "Today"} - AI career decision tool
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              AI Job Post Extractor
            </h1>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Turn messy job descriptions into hiring signals, profile fit,
              missing skills, risks, and a clear application strategy.
            </p>
          </div>

          <Link
            href="/saved"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-cyan-500 hover:text-cyan-700"
          >
            Saved analyses
          </Link>
        </header>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.95fr)]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-10">
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
                className="min-h-[460px] resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-base leading-7 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
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
                className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
              >
                {isLoading ? "Analyzing..." : "Analyze job post"}
              </button>
            </div>
          </section>

          <aside className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">
                Analysis result
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                The result should explain what the company wants, how it matches
                your profile, what the risks are, and how to position yourself.
              </p>
            </div>

            {isLoading ? (
              <LoadingState />
            ) : error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-800 shadow-sm">
                {error}
              </div>
            ) : result ? (
              <div className="grid gap-4">
                <DecisionSummary result={result} />

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-950">
                        Keep this analysis
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        Save only the job posts you want to track.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={!canSave}
                      className="inline-flex h-11 items-center justify-center rounded-xl bg-cyan-700 px-5 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                    >
                      {isSaving ? "Saving..." : "Save analysis"}
                    </button>
                  </div>

                  {saveMessage ? (
                    <p className="mt-3 text-sm font-medium text-emerald-700">
                      {saveMessage}{" "}
                      <Link href="/saved" className="underline underline-offset-4">
                        Open saved page
                      </Link>
                    </p>
                  ) : null}

                  {saveError ? (
                    <p className="mt-3 text-sm font-medium text-red-700">
                      {saveError}
                    </p>
                  ) : null}
                </section>

                <section className="grid gap-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    1. Extracted hiring signals
                  </h3>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FieldCard label="company">
                      <TextValue value={result.company} />
                    </FieldCard>

                    <FieldCard label="location">
                      <TextValue value={result.location} />
                    </FieldCard>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FieldCard label="seniority">
                      <TextValue value={result.seniority} />
                    </FieldCard>

                    <FieldCard label="language_requirement">
                      <TextValue value={result.language_requirement} />
                    </FieldCard>
                  </div>

                  <FieldCard label="required_skills">
                    <PillList items={result.required_skills} />
                  </FieldCard>

                  <FieldCard label="nice_to_have_skills">
                    <PillList items={result.nice_to_have_skills} />
                  </FieldCard>

                  <FieldCard label="tools">
                    <PillList items={result.tools} />
                  </FieldCard>
                </section>

                <section className="grid gap-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    2. Match against my profile
                  </h3>

                  <FieldCard label="missing_skills">
                    <BulletList items={result.missing_skills} />
                  </FieldCard>

                  <FieldCard label="risk_factors">
                    <BulletList items={result.risk_factors} />
                  </FieldCard>
                </section>

                <section className="grid gap-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    3. Why the AI thinks this
                  </h3>

                  <FieldCard label="evidence_from_job_post">
                    <BulletList items={result.evidence_from_job_post} />
                  </FieldCard>

                  <FieldCard label="assumptions">
                    <BulletList items={result.assumptions} />
                  </FieldCard>
                </section>

                <section className="grid gap-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    4. Application strategy
                  </h3>

                  <FieldCard label="interview_angle">
                    <TextValue value={result.interview_angle} />
                  </FieldCard>

                  <FieldCard label="application_positioning">
                    <TextValue value={result.application_positioning} />
                  </FieldCard>

                  <FieldCard label="next_learning_step">
                    <TextValue value={result.next_learning_step} />
                  </FieldCard>
                </section>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-50 text-lg font-semibold text-cyan-700">
                  AI
                </div>

                <h2 className="mt-5 text-lg font-semibold text-slate-950">
                  No analysis yet
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Add a job post and run the analyzer to preview the hiring
                  signals, fit assessment, risks, and positioning strategy here.
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
