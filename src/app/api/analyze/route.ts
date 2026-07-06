import { userProfile } from "@/src/lib/userProfile";
import type { HiringSignals } from "@/src/app/lib/jobTypes";

const userProfileText = JSON.stringify(userProfile, null, 2);

const SYSTEM_PROMPT = `You extract structured information from job posts.

Return valid JSON only. Do not include markdown, prose, comments, or code fences.

Use exactly this shape:
{
  "role_title": "",
  "company": "",
  "location": "",
  "required_skills": [],
  "nice_to_have_skills": [],
  "tools": [],
  "seniority": "",
  "language_requirement": "",
  "fit_for_my_profile": "Yes | Maybe | No",
  "fit_reason": "",
  "application_priority": "High | Medium | Low",
  "missing_skills": [],
  "risk_factors": [],
  "interview_angle": "",
  "evidence_from_job_post": [],
  "assumptions": [],
  "confidence": "High | Medium | Low",
  "next_learning_step": "",
  "application_positioning": ""
}

Rules:
- Use empty strings or empty arrays when information is missing.
- Keep arrays as concise strings, not objects.
- fit_for_my_profile must be exactly "Yes", "Maybe", or "No".
- Evaluate fit_for_my_profile using the career profile below and its fit_rules.
- application_positioning should be practical advice for positioning this person's application to this specific job.
- evidence_from_job_post should include short phrases or signals from the job post that justify the fit assessment.
- assumptions should mention what you are inferring but cannot know for certain.
- missing_skills should be honest and specific.
- risk_factors should explain why this application may fail.
- next_learning_step should suggest one practical thing the candidate should learn or build next.
- confidence must be exactly "High", "Medium", or "Low".
- application_priority must be exactly "High", "Medium", or "Low".

Career profile:
${userProfileText}`;

function jsonResponse(body: unknown, init?: ResponseInit) {
  return Response.json(body, init);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseModelJson(content: string) {
  try {
    return JSON.parse(content);
  } catch {
    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");

    if (start === -1 || end === -1 || end <= start) {
      throw new Error("The model did not return a JSON object.");
    }

    return JSON.parse(content.slice(start, end + 1));
  }
}

function toString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeFit(value: unknown): HiringSignals["fit_for_my_profile"] {
  return value === "Yes" || value === "No" || value === "Maybe"
    ? value
    : "Maybe";
}

function normalizePriority(value: unknown): HiringSignals["application_priority"] {
  return value === "High" || value === "Medium" || value === "Low"
    ? value
    : "Medium";
}

function normalizeConfidence(value: unknown): HiringSignals["confidence"] {
  return value === "High" || value === "Medium" || value === "Low"
    ? value
    : "Medium";
}

function normalizeHiringSignals(value: unknown): HiringSignals {
  if (!isRecord(value)) {
    throw new Error("The model response was not a JSON object.");
  }

  return {
    role_title: toString(value.role_title),
    company: toString(value.company),
    location: toString(value.location),
    required_skills: toStringArray(value.required_skills),
    nice_to_have_skills: toStringArray(value.nice_to_have_skills),
    tools: toStringArray(value.tools),
    seniority: toString(value.seniority),
    language_requirement: toString(value.language_requirement),
    fit_for_my_profile: normalizeFit(value.fit_for_my_profile),
    fit_reason: toString(value.fit_reason),
    application_priority: normalizePriority(value.application_priority),
    missing_skills: toStringArray(value.missing_skills),
    risk_factors: toStringArray(value.risk_factors),
    interview_angle: toString(value.interview_angle),
    evidence_from_job_post: toStringArray(value.evidence_from_job_post),
    assumptions: toStringArray(value.assumptions),
    confidence: normalizeConfidence(value.confidence),
    next_learning_step: toString(value.next_learning_step),
    application_positioning: toString(value.application_positioning),
  };
}

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return jsonResponse(
      {
        error:
          "Missing GROQ_API_KEY. Add it to your local .env file or deployment environment and restart the Next.js server.",
      },
      { status: 500 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!isRecord(body) || typeof body.jobText !== "string" || !body.jobText.trim()) {
    return jsonResponse(
      { error: 'Request body must include a non-empty "jobText" string.' },
      { status: 400 },
    );
  }

  try {
    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          response_format: { type: "json_object" },
          temperature: 0.1,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `Extract structured job information from this job post:\n\n${body.jobText}`,
            },
          ],
        }),
      },
    );

    if (!groqResponse.ok) {
      const detail = await groqResponse.text();

      return jsonResponse(
        {
          error: "Groq API request failed.",
          detail: detail || `Groq returned HTTP ${groqResponse.status}.`,
        },
        { status: 502 },
      );
    }

    const groqData = await groqResponse.json();
    const content = groqData?.choices?.[0]?.message?.content;

    if (typeof content !== "string" || !content.trim()) {
      return jsonResponse(
        { error: "Groq returned an empty model response." },
        { status: 502 },
      );
    }

    const parsed = parseModelJson(content);

    return jsonResponse(normalizeHiringSignals(parsed));
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong while analyzing the job post.";

    return jsonResponse({ error: message }, { status: 500 });
  }
}
