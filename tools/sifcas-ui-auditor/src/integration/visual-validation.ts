export type VisualEvidence = {
  before: string | null;
  after: string | null;
  viewport: { width: number; height: number };
  status: "not-run" | "pass" | "warning" | "fail";
  reason?: string;
};

export function validateVisualEvidence(evidence: VisualEvidence) {
  if (!evidence.before || !evidence.after) return { ...evidence, status: "not-run" as const, reason: "screenshots before/after were not both provided" };
  return { ...evidence, status: "warning" as const, reason: "pixel/overflow/contrast comparison must be reviewed from the generated screenshots and reports" };
}
