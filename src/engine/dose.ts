import {
  EngineError,
  type DoseRule,
  type DoseUnit,
  type DoseRounding,
} from './types';
import { assertRange, formatDecimal, roundTo } from './units';

/**
 * Absolute sanity limits for calculator inputs. These are ENGINE limits (a
 * weight of 0 or 900 kg is a data-entry error), not clinical thresholds.
 */
export const DOSE_LIMITS = {
  weightKg: { min: 0.5, max: 400 },
  ageYears: { min: 0, max: 120 },
  egfr: { min: 0, max: 300 },
} as const;

export type HepaticChildPugh = 'A' | 'B' | 'C' | 'unknown';

export interface DoseInput {
  weightKg?: number | null;
  ageYears?: number | null;
  egfr?: number | null;
  hepaticChildPugh?: HepaticChildPugh | null;
}

export interface DoseResult {
  ruleId: string;
  dose: number;
  unit: DoseUnit;
  /** Value before the absolute ceiling was applied. */
  raw: number;
  capped: boolean;
  rounded: boolean;
  steps: string[];
  warnings: string[];
}

const DOSE_UNITS: readonly DoseUnit[] = ['mg', 'mcg', 'g', 'units', 'mL'];

const ROUNDING_STEP: Record<DoseRounding, number> = {
  none: 0,
  '0.1': 0.1,
  '0.5': 0.5,
  '1': 1,
};

/**
 * Weight-based / fixed dose calculator (FR-503, FR-507).
 *
 * - Every numeric input is range-checked against DOSE_LIMITS (hard stop).
 * - `maxAmount` is an absolute ceiling and is never exceeded.
 * - Rounding always floors, so a cap can never be rounded upward.
 * - The full calculation trail is returned for the confirm screen.
 * - Clinical adjustment values are NOT applied here; missing adjustment
 *   inputs are surfaced as warnings so the UI can demand the approved source.
 */
export function calculateDose(
  rule: DoseRule,
  input: DoseInput,
  requestedUnit?: DoseUnit,
): DoseResult {
  if (!DOSE_UNITS.includes(rule.unit)) {
    throw new EngineError('INVALID_UNIT', `Unsupported dose unit "${rule.unit}"`);
  }
  if (requestedUnit !== undefined && requestedUnit !== rule.unit) {
    throw new EngineError(
      'INVALID_UNIT',
      `Requested unit "${requestedUnit}" does not match the rule unit "${rule.unit}"`,
    );
  }
  if (!Number.isFinite(rule.amount) || rule.amount <= 0) {
    throw new EngineError('INVALID_RULE', 'Dose amount must be greater than zero');
  }
  if (rule.maxAmount !== undefined && (!Number.isFinite(rule.maxAmount) || rule.maxAmount <= 0)) {
    throw new EngineError('INVALID_RULE', 'Maximum amount must be greater than zero');
  }

  const steps: string[] = [];
  const warnings: string[] = [];

  let weight: number | null = null;
  if (input.weightKg !== undefined && input.weightKg !== null) {
    weight = assertRange(
      input.weightKg,
      DOSE_LIMITS.weightKg.min,
      DOSE_LIMITS.weightKg.max,
      'weightKg',
      'WEIGHT_OUT_OF_RANGE',
    );
    if (rule.minWeightKg !== undefined && weight < rule.minWeightKg) {
      throw new EngineError(
        'WEIGHT_OUT_OF_RANGE',
        `Weight ${weight} kg is below the rule minimum of ${rule.minWeightKg} kg`,
      );
    }
    if (rule.maxWeightKg !== undefined && weight > rule.maxWeightKg) {
      throw new EngineError(
        'WEIGHT_OUT_OF_RANGE',
        `Weight ${weight} kg is above the rule maximum of ${rule.maxWeightKg} kg`,
      );
    }
  }

  let age: number | null = null;
  if (input.ageYears !== undefined && input.ageYears !== null) {
    age = assertRange(
      input.ageYears,
      DOSE_LIMITS.ageYears.min,
      DOSE_LIMITS.ageYears.max,
      'ageYears',
      'AGE_OUT_OF_RANGE',
    );
  }

  let egfr: number | null = null;
  if (input.egfr !== undefined && input.egfr !== null) {
    egfr = assertRange(
      input.egfr,
      DOSE_LIMITS.egfr.min,
      DOSE_LIMITS.egfr.max,
      'egfr',
      'EGFR_OUT_OF_RANGE',
    );
  }

  if (rule.basis === 'per_kg' && weight === null) {
    throw new EngineError(
      'WEIGHT_REQUIRED',
      'This rule is weight-based: a valid weight is required',
    );
  }

  if (rule.adjustments.includes('renal') && egfr === null) {
    warnings.push(
      'Renal function (eGFR) was not provided. Verify the renal adjustment in the approved source before prescribing.',
    );
  }
  if (rule.adjustments.includes('age') && age === null) {
    warnings.push(
      'Age was not provided. Verify the age adjustment in the approved source before prescribing.',
    );
  }
  if (rule.adjustments.includes('weight') && weight === null) {
    warnings.push(
      'Weight was not provided. Verify the weight-based adjustment in the approved source before prescribing.',
    );
  }
  if (
    rule.adjustments.includes('hepatic') &&
    (input.hepaticChildPugh === undefined ||
      input.hepaticChildPugh === null ||
      input.hepaticChildPugh === 'unknown')
  ) {
    warnings.push(
      'Hepatic status (Child-Pugh) was not provided. Verify the hepatic adjustment in the approved source before prescribing.',
    );
  }
  if (rule.status === 'draft') {
    warnings.push(
      'This dosing rule is marked DRAFT. It must be reviewed against the source text before clinical use.',
    );
  }

  let raw: number;
  if (rule.basis === 'per_kg') {
    const safeWeight = weight as number;
    raw = safeWeight * rule.amount;
    steps.push(
      `${formatDecimal(safeWeight)} kg × ${formatDecimal(rule.amount)} ${rule.unit}/kg = ${formatDecimal(raw)} ${rule.unit}`,
    );
  } else {
    raw = rule.amount;
    steps.push(`Fixed dose: ${formatDecimal(rule.amount)} ${rule.unit}`);
  }

  let capped = false;
  let cappedValue = raw;
  if (rule.maxAmount !== undefined && cappedValue > rule.maxAmount) {
    cappedValue = rule.maxAmount;
    capped = true;
    steps.push(
      `Maximum single dose applied: ${formatDecimal(rule.maxAmount)} ${rule.unit}`,
    );
  }

  const step = ROUNDING_STEP[rule.rounding];
  let dose = cappedValue;
  let rounded = false;
  if (step > 0) {
    const floored = roundTo(cappedValue, step);
    if (floored !== cappedValue) {
      rounded = true;
      steps.push(
        `Rounded down to the nearest ${formatDecimal(step)} ${rule.unit}: ${formatDecimal(floored)} ${rule.unit}`,
      );
    }
    dose = floored;
  }

  if (!(dose > 0)) {
    throw new EngineError(
      'DOSE_ROUNDS_TO_ZERO',
      'The calculated dose rounds to zero — check the rule and inputs',
    );
  }

  steps.push(`Result: ${formatDecimal(dose)} ${rule.unit} (${rule.route})`);

  return {
    ruleId: rule.id,
    dose,
    unit: rule.unit,
    raw,
    capped,
    rounded,
    steps,
    warnings,
  };
}

export function formatDose(value: number, unit: string): string {
  return `${formatDecimal(value)} ${unit}`;
}
