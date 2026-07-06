import type {
  ApplicationStatus,
  HiringSignals,
  SavedJobAnalysis,
} from "./jobTypes";

const tableName = "saved_job_analyses";

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase environment variables. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local.",
    );
  }

  return {
    url: url.replace(/\/$/, ""),
    key,
  };
}

async function supabaseRequest<T>(path: string, init: RequestInit = {}) {
  const { url, key } = getSupabaseConfig();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Supabase returned HTTP ${response.status}.`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

export async function listSavedJobAnalyses() {
  return supabaseRequest<SavedJobAnalysis[]>(
    `${tableName}?select=*&order=created_at.desc`,
  );
}

export async function createSavedJobAnalysis({
  jobText,
  analysis,
  status,
}: {
  jobText: string;
  analysis: HiringSignals;
  status: ApplicationStatus;
}) {
  const rows = await supabaseRequest<SavedJobAnalysis[]>(tableName, {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      job_text: jobText,
      analysis,
      status,
      role_title: analysis.role_title,
      company: analysis.company,
      location: analysis.location,
      fit_for_my_profile: analysis.fit_for_my_profile,
      application_priority: analysis.application_priority,
    }),
  });

  return rows[0];
}

export async function updateSavedJobStatus({
  id,
  status,
}: {
  id: string;
  status: ApplicationStatus;
}) {
  const rows = await supabaseRequest<SavedJobAnalysis[]>(
    `${tableName}?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify({ status }),
    },
  );

  return rows[0];
}
