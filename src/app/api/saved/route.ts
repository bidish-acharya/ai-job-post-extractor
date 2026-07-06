import {
  createSavedJobAnalysis,
  listSavedJobAnalyses,
} from "@/src/app/lib/savedJobs";
import {
  isApplicationStatus,
  type ApplicationStatus,
  type HiringSignals,
} from "@/src/app/lib/jobTypes";

function jsonResponse(body: unknown, init?: ResponseInit) {
  return Response.json(body, init);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isHiringSignals(value: unknown): value is HiringSignals {
  return (
    isRecord(value) &&
    typeof value.role_title === "string" &&
    typeof value.company === "string" &&
    typeof value.location === "string" &&
    typeof value.fit_reason === "string" &&
    typeof value.application_positioning === "string"
  );
}

export async function GET() {
  try {
    const savedJobs = await listSavedJobAnalyses();

    return jsonResponse({ savedJobs });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to load saved job analyses.";

    return jsonResponse({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!isRecord(body)) {
    return jsonResponse({ error: "Request body must be an object." }, { status: 400 });
  }

  if (typeof body.jobText !== "string" || !body.jobText.trim()) {
    return jsonResponse(
      { error: 'Request body must include a non-empty "jobText" string.' },
      { status: 400 },
    );
  }

  if (!isHiringSignals(body.analysis)) {
    return jsonResponse(
      { error: 'Request body must include an "analysis" object.' },
      { status: 400 },
    );
  }

  const status: ApplicationStatus = isApplicationStatus(body.status)
    ? body.status
    : "did_not_apply";

  try {
    const savedJob = await createSavedJobAnalysis({
      jobText: body.jobText,
      analysis: body.analysis,
      status,
    });

    return jsonResponse({ savedJob }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save job analysis.";

    return jsonResponse({ error: message }, { status: 500 });
  }
}
