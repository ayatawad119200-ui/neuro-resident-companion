import Dexie, { type Table } from 'dexie';
import { z } from 'zod';

/* ------------------------------------------------------------------ */
/* Case schema (M1) — no patient identifiers by design.               */
/* ------------------------------------------------------------------ */

export const SexSchema = z.enum(['male', 'female', 'other', 'unknown']);
export type Sex = z.infer<typeof SexSchema>;

export const DemographicsSchema = z.object({
  ageYears: z.number().min(0).max(120),
  sex: SexSchema,
  weightKg: z.number().min(0.5).max(400).nullable(),
  heightCm: z.number().min(30).max(250).nullable(),
  pregnant: z.boolean().nullable(),
  creatinineMgDl: z.number().min(0).max(30).nullable(),
  egfr: z.number().min(0).max(300).nullable(),
  allergies: z.array(z.string().min(1).max(80)).max(30),
});
export type Demographics = z.infer<typeof DemographicsSchema>;

export const CaseHistorySchema = z.object({
  complaint: z.string().max(120).nullable(),
  hpi: z.string().max(8_000),
  pmh: z.string().max(8_000),
  drugs: z.string().max(8_000),
  family: z.string().max(8_000),
  social: z.string().max(8_000),
});
export type CaseHistory = z.infer<typeof CaseHistorySchema>;

export const SavedScoreSchema = z.object({
  id: z.string().min(1),
  scoreId: z.string().min(1),
  name: z.string().min(1),
  score: z.number(),
  max: z.number(),
  at: z.string().min(1),
  sourceId: z.string().min(1),
  version: z.string().min(1),
  status: z.enum(['draft', 'approved']),
});
export type SavedScore = z.infer<typeof SavedScoreSchema>;

export const DecisionLogSchema = z.object({
  id: z.string().min(1),
  algorithmId: z.string().min(1),
  resultLabel: z.string(),
  path: z.array(z.string()),
  at: z.string().min(1),
  sourceId: z.string().min(1),
  version: z.string().min(1),
});
export type DecisionLog = z.infer<typeof DecisionLogSchema>;

export const MedLogSchema = z.object({
  id: z.string().min(1),
  drugId: z.string().min(1),
  ruleId: z.string().min(1),
  label: z.string(),
  dose: z.number(),
  unit: z.string(),
  at: z.string().min(1),
  sourceId: z.string().min(1),
  version: z.string().min(1),
});
export type MedLog = z.infer<typeof MedLogSchema>;

export const CaseRecordSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  demographics: DemographicsSchema,
  lastKnownWell: z.string().nullable(),
  history: CaseHistorySchema,
  notes: z.string().max(20_000),
  scores: z.array(SavedScoreSchema),
  decisions: z.array(DecisionLogSchema),
  meds: z.array(MedLogSchema),
});
export type CaseRecord = z.infer<typeof CaseRecordSchema>;

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

export const LanguageSchema = z.enum(['ar', 'en']);
export type Language = z.infer<typeof LanguageSchema>;

export const ThemeSchema = z.enum(['light', 'dark', 'system']);
export type Theme = z.infer<typeof ThemeSchema>;

export const AppSettingsSchema = z.object({
  language: LanguageSchema,
  theme: ThemeSchema,
  disclaimerAccepted: z.boolean(),
});
export type AppSettings = z.infer<typeof AppSettingsSchema>;

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'ar',
  theme: 'system',
  disclaimerAccepted: false,
};

export type SettingValue = string | number | boolean | null;
export interface SettingRow {
  key: string;
  value: SettingValue;
}

/* ------------------------------------------------------------------ */
/* Database                                                            */
/* ------------------------------------------------------------------ */

export class NrcDatabase extends Dexie {
  cases!: Table<CaseRecord, string>;
  settings!: Table<SettingRow, string>;

  constructor() {
    super('nrc-db');
    this.version(1).stores({
      cases: 'id, createdAt, updatedAt',
      settings: 'key',
    });
  }
}

export const db = new NrcDatabase();

export async function getSettings(): Promise<AppSettings> {
  const rows = await db.settings.toArray();
  const map = new Map(rows.map((row) => [row.key, row.value]));

  const language = LanguageSchema.safeParse(map.get('language'));
  const theme = ThemeSchema.safeParse(map.get('theme'));
  const disclaimer = z.boolean().safeParse(map.get('disclaimerAccepted'));

  return {
    language: language.success ? language.data : DEFAULT_SETTINGS.language,
    theme: theme.success ? theme.data : DEFAULT_SETTINGS.theme,
    disclaimerAccepted: disclaimer.success
      ? disclaimer.data
      : DEFAULT_SETTINGS.disclaimerAccepted,
  };
}

export async function setSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K],
): Promise<void> {
  await db.settings.put({ key, value });
}

/* ------------------------------------------------------------------ */
/* Backup / restore (FR-802)                                           */
/* ------------------------------------------------------------------ */

export const BackupSchema = z.object({
  app: z.literal('nrc'),
  schemaVersion: z.literal(1),
  exportedAt: z.string().min(1),
  cases: z.array(CaseRecordSchema),
  settings: z.array(
    z.object({
      key: z.string().min(1),
      value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
    }),
  ),
});
export type Backup = z.infer<typeof BackupSchema>;

export async function exportBackup(): Promise<Backup> {
  const [cases, settings] = await Promise.all([
    db.cases.toArray(),
    db.settings.toArray(),
  ]);
  return {
    app: 'nrc',
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    cases,
    settings,
  };
}

export async function importBackup(
  raw: unknown,
): Promise<{ cases: number; settings: number }> {
  const parsed = BackupSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const where = first?.path.length ? first.path.join('.') : 'file';
    throw new Error(`Invalid backup (${where}): ${first?.message ?? 'unknown error'}`);
  }

  await db.transaction('rw', db.cases, db.settings, async () => {
    await db.cases.bulkPut(parsed.data.cases);
    await db.settings.bulkPut(parsed.data.settings);
  });

  return {
    cases: parsed.data.cases.length,
    settings: parsed.data.settings.length,
  };
}

export async function wipeAll(): Promise<void> {
  await db.transaction('rw', db.cases, db.settings, async () => {
    await db.cases.clear();
    await db.settings.clear();
  });
}
