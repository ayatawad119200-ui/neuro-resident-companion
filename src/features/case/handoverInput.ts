import type { CaseRecord } from '../../db/db';
import type { HandoverInput } from '../../engine';

/**
 * Maps a stored case to the handover builder input. Kept in one place so the
 * detail view and the printable PDF view never drift apart.
 */
export function handoverInputFor(
  record: CaseRecord,
  sexLabel: string,
): HandoverInput {
  return {
    ageYears: record.demographics.ageYears,
    sex: sexLabel,
    weightKg: record.demographics.weightKg,
    heightCm: record.demographics.heightCm,
    pregnant: record.demographics.pregnant,
    creatinineMgDl: record.demographics.creatinineMgDl,
    egfr: record.demographics.egfr,
    allergies: record.demographics.allergies,
    lastKnownWell: record.lastKnownWell,
    notes: record.notes,
    history: record.history,
  };
}
