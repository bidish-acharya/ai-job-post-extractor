"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  applicationStatusOptions,
  type ApplicationStatus,
  type SavedJobAnalysis,
} from "../lib/jobTypes";

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatToday() {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
}

function statusLabel(status: ApplicationStatus) {
  return (
    applicationStatusOptions.find((option) => option.value === status)?.label ||
    "Did not apply"
  );
}

function statusClass(status: ApplicationStatus) {
  if (status === "applied") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "rejected") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function fitClass(fit: SavedJobAnalysis["fit_for_my_profile"]) {
  if (fit === "Yes") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (fit === "No") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

export default function SavedPage() {
  const [todayLabel, setTodayLabel] = useState("");
  const [savedJobs, setSavedJobs] = useState<SavedJobAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTodayLabel(formatToday());
    }, 0);

    async function loadSavedJobs() {
      try {
        const response = await fetch("/api/saved");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Unable to load saved analyses.");
        }

        setSavedJobs(data.savedJobs || []);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to load saved analyses.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadSavedJobs();

    return () => window.clearTimeout(timer);
  }, []);

  async function updateStatus(id: string, status: ApplicationStatus) {
    setUpdatingId(id);
    setError("");

    try {
      const response = await fetch(`/api/saved/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to update status.");
      }

      setSavedJobs((current) =>
        current.map((job) => (job.id === id ? data.savedJob : job)),
      );
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to update status.",
      );
    } finally {
      setUpdatingId("");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950 sm:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
              {todayLabel || "Today"} - saved job decisions
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Saved analyses
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              Track the job descriptions you decided to keep, with the analysis,
              save date, and your application label.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-cyan-500 hover:text-cyan-700"
          >
            Analyze another JD
          </Link>
        </header>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-800 shadow-sm">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="grid gap-4">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="h-4 w-44 rounded-full bg-slate-200" />
                <div className="mt-5 h-6 w-2/3 rounded-full bg-slate-100" />
                <div className="mt-3 h-4 w-full rounded-full bg-slate-100" />
              </div>
            ))}
          </div>
        ) : savedJobs.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Nothing saved yet
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Analyze a job post, then save the ones you want to track here.
            </p>
          </section>
        ) : (
          <section className="grid gap-4">
            {savedJobs.map((job) => (
              <article
                key={job.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Saved {formatDateTime(job.created_at)}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                      {job.role_title || "Role title not found"}
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {[job.company, job.location].filter(Boolean).join(" - ") ||
                        "Company or location not found"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${fitClass(
                        job.fit_for_my_profile,
                      )}`}
                    >
                      Fit: {job.fit_for_my_profile}
                    </span>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(
                        job.status,
                      )}`}
                    >
                      {statusLabel(job.status)}
                    </span>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="space-y-4">
                    <section className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Fit reason
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-800">
                        {job.analysis.fit_reason || "No fit reason saved."}
                      </p>
                    </section>

                    <section className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Application positioning
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-800">
                        {job.analysis.application_positioning ||
                          "No positioning saved."}
                      </p>
                    </section>

                    <details className="rounded-xl border border-slate-200 bg-white p-4">
                      <summary className="cursor-pointer text-sm font-semibold text-slate-900">
                        Original job description
                      </summary>
                      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                        {job.job_text}
                      </p>
                    </details>
                  </div>

                  <section className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-950">
                      Application label
                    </p>
                    <div className="mt-3 grid gap-2">
                      {applicationStatusOptions.map((option) => {
                        const isActive = job.status === option.value;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => updateStatus(job.id, option.value)}
                            disabled={updatingId === job.id || isActive}
                            className={`h-10 rounded-xl border px-3 text-left text-sm font-semibold transition ${
                              isActive
                                ? statusClass(option.value)
                                : "border-slate-200 bg-white text-slate-700 hover:border-cyan-400 hover:text-cyan-700"
                            } disabled:cursor-not-allowed`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
