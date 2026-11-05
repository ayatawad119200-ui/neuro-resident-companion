import type { InteractionDef, InteractionSeverity } from './types';

export const SEVERITY_ORDER: Record<InteractionSeverity, number> = {
  contraindicated: 4,
  major: 3,
  moderate: 2,
  minor: 1,
};

/**
 * Interaction checker (FR-504). Pure set matching against content defs.
 *
 * - Duplicate selections are collapsed (selecting the same drug twice is not
 *   an interaction).
 * - Findings are de-duplicated by id and sorted by clinical severity.
 * - An empty result means "no interaction is recorded in the loaded content",
 *   which the UI must phrase carefully (never "safe").
 */
export function checkInteractions(
  selectedDrugIds: readonly string[],
  defs: readonly InteractionDef[],
): InteractionDef[] {
  const selected = new Set(
    selectedDrugIds.map((id) => id.trim()).filter((id) => id.length > 0),
  );

  const seen = new Set<string>();
  const findings: InteractionDef[] = [];
  for (const def of defs) {
    if (!selected.has(def.drugs[0]) || !selected.has(def.drugs[1])) continue;
    if (seen.has(def.id)) continue;
    seen.add(def.id);
    findings.push(def);
  }

  return findings.sort((a, b) => {
    const bySeverity = SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity];
    return bySeverity !== 0 ? bySeverity : a.id.localeCompare(b.id);
  });
}
