import { z } from 'zod';
import {
  CaseRecordSchema,
  DemographicsSchema,
  db,
  type CaseHistory,
  type CaseRecord,
  type Demographics,
} from './db';

/** Input accepted by the "new case" form. */
export const NewCaseSchema = DemographicsSchema.extend({
  complaint: z.string().max(120).nullable(),
  lastKnownWell: z.string().nullable(),
  notes: z.string().max(20_000),
});
export type NewCaseInput = z.infer<typeof NewCaseSchema>;

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `case-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function emptyHistory(complaint: string | null): CaseHistory {
  return {
    complaint,
    hpi: '',
    pmh: '',
    drugs: '',
    family: '',
    social: '',
  };
}

export async function createCase(raw: unknown): Promise<string> {
  const input = NewCaseSchema.parse(raw);
  const now = new Date().toISOString();
  const record: CaseRecord = {
    schemaVersion: 1,
    id: newId(),
    createdAt: now,
    updatedAt: now,
    demographics: {
      ageYears: input.ageYears,
      sex: input.sex,
      weightKg: input.weightKg,
      heightCm: input.heightCm,
      pregnant: input.pregnant,
      creatinineMgDl: input.creatinineMgDl,
      egfr: input.egfr,
      allergies: input.allergies,
    },
    lastKnownWell: input.lastKnownWell,
    history: emptyHistory(input.complaint),
    notes: input.notes,
    scores: [],
    decisions: [],
    meds: [],
  };
  await db.cases.put(record);
  return record.id;
}

export async function listCases(): Promise<CaseRecord[]> {
  return db.cases.orderBy('updatedAt').reverse().toArray();
}

export async function getCase(id: string): Promise<CaseRecord | undefined> {
  return db.cases.get(id);
}

export interface CasePatch {
  demographics?: Partial<Demographics>;
  history?: Partial<CaseHistory>;
  notes?: string;
  lastKnownWell?: string | null;
}

export async function updateCase(id: string, patch: CasePatch): Promise<void> {
  await db.transaction('rw', db.cases, async () => {
    const existing = await db.cases.get(id);
    if (!existing) throw new Error('Case not found');

    const next: CaseRecord = {
      ...existing,
      demographics: { ...existing.demographics, ...(patch.demographics ?? {}) },
      history: { ...existing.history, ...(patch.history ?? {}) },
      notes: patch.notes !== undefined ? patch.notes : existing.notes,
      lastKnownWell:
        patch.lastKnownWell !== undefined
          ? patch.lastKnownWell
          : existing.lastKnownWell,
      updatedAt: new Date().toISOString(),
    };

    await db.cases.put(CaseRecordSchema.parse(next));
  });
}

/** Full replacement used by the edit form. */
export async function replaceCaseFromForm(
  id: string,
  raw: unknown,
): Promise<void> {
  const input = NewCaseSchema.parse(raw);
  await updateCase(id, {
    demographics: {
      ageYears: input.ageYears,
      sex: input.sex,
      weightKg: input.weightKg,
      heightCm: input.heightCm,
      pregnant: input.pregnant,
      creatinineMgDl: input.creatinineMgDl,
      egfr: input.egfr,
      allergies: input.allergies,
    },
    history: { complaint: input.complaint },
    notes: input.notes,
    lastKnownWell: input.lastKnownWell,
  });
}

export async function deleteCase(id: string): Promise<void> {
  await db.cases.delete(id);
}

export async function countCases(): Promise<number> {
  return db.cases.count();
}
