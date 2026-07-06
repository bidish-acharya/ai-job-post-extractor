import { isApplicationStatus } from "@/src/app/lib/jobTypes";
import { updateSavedJobStatus } from "@/src/app/lib/savedJobs";

function jsonResponse(body: unknown, init?: ResponseInit) {
  return Response.json(body, init);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  if (!id) {
    return jsonResponse({ error: "Missing saved job id." }, { status: 400 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!isRecord(body) || !isApplicationStatus(body.status)) {
    return jsonResponse(
      {
        error:
          'Request body must include status as "applied", "rejected", or "did_not_apply".',
      },
      { status: 400 },
    );
  }

  try {
    const savedJob = await updateSavedJobStatus({ id, status: body.status });

    if (!savedJob) {
      return jsonResponse({ error: "Saved job was not found." }, { status: 404 });
    }

    return jsonResponse({ savedJob });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update saved job.";

    return jsonResponse({ error: message }, { status: 500 });
  }
}
