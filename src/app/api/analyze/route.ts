type HiringSignals = {
  role_title: string;
  company: string;
  location: string;
  required_skills: string[];
  nice_to_have_skills: string[];
  tools: string[];
  seniority: string;
  language_requirement: string;
  fit_for_my_profile: "Yes" | "Maybe" | "No";
  fit_reason: string;
  application_positioning: string;
};

const userProfile = {
  career_direction: [
    "Moving from product/UI-UX background into AI/data product building",
    "Interested in AI automation, dashboards, data products, internal tools",
    "Wants to avoid pure Figma/UI-only roles",
  ],
  target_roles: [
    "AI Automation Specialist",
    "AI/Data Product Builder",
    "AI Workflow Developer",
    "Product/Data Analyst",
    "Technical Product Specialist",
    "Junior AI Solutions Consultant",
  ],
  avoid_roles: [
    "Pure senior Product Designer",
    "Visual UI Designer",
    "Pure ML Engineer",
    "Heavy backend-only Software Engineer",
  ],
  experience: [
    "Built RhinoStats independently using React, Vite, Tailwind, Python, and pandas",
    "Worked at Sagacity on an AI-powered B2B learning platform",
    "Worked at Bosch on UX, dashboards, app feedback analysis, and design systems",
    "Worked at TOMRA on B2B SaaS dashboards for industrial machine data",
    "Led design/frontend work at Deerwalk for e-learning products",
  ],
  skills: {
    product_design: [
      "Figma",
      "Framer",
      "Prototyping",
      "Design systems",
      "Dashboards",
    ],
    frontend: ["HTML", "CSS", "JavaScript", "React", "Vue.js", "TypeScript"],
    research: [
      "Usability testing",
      "Heuristic evaluation",
      "Hotjar",
      "User feedback analysis",
    ],
    data_ai: ["Python", "pandas", "Claude", "Cursor", "Codex", "Groq API workflows"],
  },
  languages: {
    english: "Fluent",
    german: "A2/B1, actively learning",
  },
  fit_rules: {
    yes: "Role combines AI, automation, product thinking, data, dashboards, internal tools, frontend, or workflow building.",
    maybe:
      "Role is adjacent but has gaps such as stronger SQL, Python, cloud, backend, or German requirements.",
    no: "Role is mostly pure visual design, senior UX leadership, pure ML engineering, heavy backend engineering, or requires fluent German.",
  },
};

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
  "application_positioning": ""
}

Rules:
- Use empty strings or empty arrays when information is missing.
- Keep arrays as concise strings, not objects.
- fit_for_my_profile must be exactly "Yes", "Maybe", or "No".
- Evaluate fit_for_my_profile using the career profile below and its fit_rules.
- application_positioning should be practical advice for positioning this person's application to this specific job.

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
