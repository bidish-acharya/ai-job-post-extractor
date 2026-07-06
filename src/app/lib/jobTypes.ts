export type ApplicationStatus = "applied" | "rejected" | "did_not_apply";

export const applicationStatusOptions: {
  value: ApplicationStatus;
  label: string;
}[] = [
  { value: "did_not_apply", label: "Did not apply" },
  { value: "applied", label: "Applied" },
  { value: "rejected", label: "Rejected" },
];

export type HiringSignals = {
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
  application_priority: "High" | "Medium" | "Low";
  missing_skills: string[];
  risk_factors: string[];
  interview_angle: string;
  evidence_from_job_post: string[];
  assumptions: string[];
  confidence: "High" | "Medium" | "Low";
  next_learning_step: string;
  application_positioning: string;
};

export type SavedJobAnalysis = {
  id: string;
  created_at: string;
  job_text: string;
  analysis: HiringSignals;
  status: ApplicationStatus;
  role_title: string;
  company: string;
  location: string;
  fit_for_my_profile: HiringSignals["fit_for_my_profile"];
  application_priority: HiringSignals["application_priority"];
};

export function isApplicationStatus(value: unknown): value is ApplicationStatus {
  return (
    value === "applied" || value === "rejected" || value === "did_not_apply"
  );
}
