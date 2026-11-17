export type ServiceRequestDescriptionResult =
  | { ok: true; description: string }
  | { ok: false; reason: "location_required" | "description_too_long" };

export function prepareServiceRequestDescription(category: string, location: string, description: string): ServiceRequestDescriptionResult {
  if (location.length > 240) return { ok: false, reason: "description_too_long" };
  if (category === "infrastructure" && location.length < 3) return { ok: false, reason: "location_required" };
  const fullDescription = location ? `Local informado: ${location}\n\n${description}` : description;
  return fullDescription.length <= 8000
    ? { ok: true, description: fullDescription }
    : { ok: false, reason: "description_too_long" };
}
