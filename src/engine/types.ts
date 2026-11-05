import { z } from 'zod';

/* ------------------------------------------------------------------ */
/* Shared enums                                                        */
/* ------------------------------------------------------------------ */

export const ContentStatusSchema = z.enum(['draft', 'approved']);
export type ContentStatus = z.infer<typeof ContentStatusSchema>;

export const ToneSchema = z.enum(['ok', 'warn', 'danger', 'info', 'neutral']);
export type Tone = z.infer<typeof ToneSchema>;

/* ------------------------------------------------------------------ */
/* Sources (guideline registry — M9)                                   */
/* ------------------------------------------------------------------ */

export const SourceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  org: z.string().min(1),
  year: z.number().int().min(1900).max(2100),
  version: z.string().min(1),
  url: z.string().url().optional(),
  reviewedBy: z.string().min(1).optional(),
  reviewedAt: z.string().min(1).optional(),
  status: ContentStatusSchema.default('draft'),
});
export type Source = z.infer<typeof SourceSchema>;

/* ------------------------------------------------------------------ */
/* Scores (M3)                                                         */
/* ------------------------------------------------------------------ */

export const ScoreOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  value: z.number(),
});
export type ScoreOption = z.infer<typeof ScoreOptionSchema>;

export const ScoreItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  help: z.string().optional(),
  options: z.array(ScoreOptionSchema).min(1),
});
export type ScoreItem = z.infer<typeof ScoreItemSchema>;

export const ScoreBandSchema = z.object({
  min: z.number(),
  max: z.number(),
  label: z.string().min(1),
  tone: ToneSchema.default('info'),
});
export type ScoreBand = z.infer<typeof ScoreBandSchema>;

export const ScoreDefSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  shortName: z.string().optional(),
  description: z.string().optional(),
  items: z.array(ScoreItemSchema).min(1),
  interpretation: z.array(ScoreBandSchema).default([]),
  sourceId: z.string().min(1),
  version: z.string().min(1),
  status: ContentStatusSchema.default('draft'),
});
export type ScoreDef = z.infer<typeof ScoreDefSchema>;

/* ------------------------------------------------------------------ */
/* Dosing (M5)                                                         */
/* ------------------------------------------------------------------ */

export const DoseUnitSchema = z.enum(['mg', 'mcg', 'g', 'units', 'mL']);
export type DoseUnit = z.infer<typeof DoseUnitSchema>;

export const DoseBasisSchema = z.enum(['per_kg', 'fixed']);
export type DoseBasis = z.infer<typeof DoseBasisSchema>;

export const DoseRoundingSchema = z.enum(['none', '0.1', '0.5', '1']);
export type DoseRounding = z.infer<typeof DoseRoundingSchema>;

export const AdjustmentKindSchema = z.enum(['renal', 'hepatic', 'age', 'weight']);
export type AdjustmentKind = z.infer<typeof AdjustmentKindSchema>;

export const DoseRuleSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  route: z.string().min(1),
  unit: DoseUnitSchema,
  basis: DoseBasisSchema,
  /** Amount per kg for `per_kg`, or the fixed amount for `fixed`. */
  amount: z.number().positive(),
  /** Absolute single-dose ceiling. Never exceeded. */
  maxAmount: z.number().positive().optional(),
  minWeightKg: z.number().positive().optional(),
  maxWeightKg: z.number().positive().optional(),
  rounding: DoseRoundingSchema.default('none'),
  adjustments: z.array(AdjustmentKindSchema).default([]),
  sourceId: z.string().min(1),
  version: z.string().min(1),
  status: ContentStatusSchema.default('draft'),
});
export type DoseRule = z.infer<typeof DoseRuleSchema>;

export const DrugDefSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  classes: z.array(z.string()).default([]),
  indications: z.array(z.string()).default([]),
  dosing: z.array(DoseRuleSchema).default([]),
  adjustments: z
    .object({
      renal: z.string(),
      hepatic: z.string(),
      age: z.string(),
      weight: z.string(),
    })
    .partial()
    .default({}),
  contraindications: z.array(z.string()).default([]),
  precautions: z.array(z.string()).default([]),
  adverseEffects: z.array(z.string()).default([]),
  monitoring: z.array(z.string()).default([]),
  pregnancy: z.string().optional(),
  interactions: z.array(z.string()).default([]),
  sourceIds: z.array(z.string()).default([]),
  version: z.string().min(1),
  status: ContentStatusSchema.default('draft'),
});
export type DrugDef = z.infer<typeof DrugDefSchema>;

/* ------------------------------------------------------------------ */
/* Interactions (M5 / FR-504)                                          */
/* ------------------------------------------------------------------ */

export const InteractionSeveritySchema = z.enum([
  'contraindicated',
  'major',
  'moderate',
  'minor',
]);
export type InteractionSeverity = z.infer<typeof InteractionSeveritySchema>;

export const InteractionDefSchema = z.object({
  id: z.string().min(1),
  drugs: z.tuple([z.string().min(1), z.string().min(1)]),
  severity: InteractionSeveritySchema,
  mechanism: z.string().optional(),
  management: z.string().optional(),
  sourceId: z.string().min(1),
  version: z.string().min(1),
  status: ContentStatusSchema.default('draft'),
});
export type InteractionDef = z.infer<typeof InteractionDefSchema>;

/* ------------------------------------------------------------------ */
/* Algorithms (M4)                                                     */
/* ------------------------------------------------------------------ */

export const AlgorithmOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  next: z.string().min(1),
});
export type AlgorithmOption = z.infer<typeof AlgorithmOptionSchema>;

export const AlgorithmResultSchema = z.object({
  label: z.string().min(1),
  tone: ToneSchema.default('info'),
  actions: z.array(z.string()).default([]),
});
export type AlgorithmResult = z.infer<typeof AlgorithmResultSchema>;

export const AlgorithmNodeSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['question', 'result']),
  prompt: z.string().min(1),
  help: z.string().optional(),
  options: z.array(AlgorithmOptionSchema).optional(),
  result: AlgorithmResultSchema.optional(),
  sourceId: z.string().optional(),
});
export type AlgorithmNode = z.infer<typeof AlgorithmNodeSchema>;

export const AlgorithmDefSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  start: z.string().min(1),
  nodes: z.array(AlgorithmNodeSchema).min(1),
  sourceId: z.string().min(1),
  version: z.string().min(1),
  status: ContentStatusSchema.default('draft'),
});
export type AlgorithmDef = z.infer<typeof AlgorithmDefSchema>;

/* ------------------------------------------------------------------ */
/* Errors                                                              */
/* ------------------------------------------------------------------ */

export type EngineErrorCode =
  | 'INVALID_NUMBER'
  | 'NEGATIVE_VALUE'
  | 'OUT_OF_RANGE'
  | 'WEIGHT_REQUIRED'
  | 'WEIGHT_OUT_OF_RANGE'
  | 'AGE_OUT_OF_RANGE'
  | 'EGFR_OUT_OF_RANGE'
  | 'INVALID_OPTION'
  | 'INVALID_UNIT'
  | 'INVALID_RULE'
  | 'DOSE_ROUNDS_TO_ZERO'
  | 'EMPTY_DEFINITION'
  | 'UNKNOWN_NODE'
  | 'UNKNOWN_OPTION'
  | 'CYCLE_DETECTED';

export class EngineError extends Error {
  readonly code: EngineErrorCode;
  readonly detail?: string;

  constructor(code: EngineErrorCode, message: string, detail?: string) {
    super(message);
    this.name = 'EngineError';
    this.code = code;
    this.detail = detail;
  }
}

/** Human-readable zod issues for content files. */
export function contentIssues(schema: z.ZodTypeAny, value: unknown): string[] {
  const parsed = schema.safeParse(value);
  if (parsed.success) return [];
  return parsed.error.issues.map((issue) => {
    const path = issue.path.length ? issue.path.join('.') : '(root)';
    return `${path}: ${issue.message}`;
  });
}
