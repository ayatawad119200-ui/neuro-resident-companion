import { EngineError } from './types';

/* ------------------------------------------------------------------ */
/* Unit conversions — pure arithmetic only, no clinical thresholds.     */
/* ------------------------------------------------------------------ */

export type MassUnit = 'mcg' | 'mg' | 'g' | 'kg';
export type VolumeUnit = 'mL' | 'L';
export type WeightUnit = 'kg' | 'lb';
export type LengthUnit = 'cm' | 'in';

const MASS_IN_MG: Record<MassUnit, number> = {
  mcg: 0.001,
  mg: 1,
  g: 1_000,
  kg: 1_000_000,
};

const ML_PER_UNIT: Record<VolumeUnit, number> = {
  mL: 1,
  L: 1_000,
};

const KG_PER_LB = 0.45359237;
const CM_PER_IN = 2.54;

export function assertFiniteNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new EngineError(
      'INVALID_NUMBER',
      `${field} must be a finite number`,
      String(value),
    );
  }
  return value;
}

export function assertNonNegative(value: unknown, field: string): number {
  const parsed = assertFiniteNumber(value, field);
  if (parsed < 0) {
    throw new EngineError('NEGATIVE_VALUE', `${field} cannot be negative`, String(value));
  }
  return parsed;
}

export function assertRange(
  value: unknown,
  min: number,
  max: number,
  field: string,
  code: 'OUT_OF_RANGE' | 'WEIGHT_OUT_OF_RANGE' | 'AGE_OUT_OF_RANGE' | 'EGFR_OUT_OF_RANGE' = 'OUT_OF_RANGE',
): number {
  const parsed = assertFiniteNumber(value, field);
  if (parsed < min || parsed > max) {
    throw new EngineError(code, `${field} must be between ${min} and ${max}`, String(value));
  }
  return parsed;
}

/** Round DOWN to a step (floor) so a safety cap can never be rounded upward. */
export function roundTo(value: number, step: number): number {
  assertFiniteNumber(value, 'value');
  if (!Number.isFinite(step) || step <= 0) {
    throw new EngineError('INVALID_RULE', 'roundTo step must be a positive number');
  }
  const floored = Math.floor((value + 1e-9) / step) * step;
  return Number(floored.toFixed(6));
}

export function convertMass(value: number, from: MassUnit, to: MassUnit): number {
  const safe = assertNonNegative(value, 'mass');
  return (safe * MASS_IN_MG[from]) / MASS_IN_MG[to];
}

export function convertVolume(value: number, from: VolumeUnit, to: VolumeUnit): number {
  const safe = assertNonNegative(value, 'volume');
  return (safe * ML_PER_UNIT[from]) / ML_PER_UNIT[to];
}

export function convertWeight(value: number, from: WeightUnit, to: WeightUnit): number {
  const safe = assertNonNegative(value, 'weight');
  if (from === to) return safe;
  return from === 'kg' ? safe / KG_PER_LB : safe * KG_PER_LB;
}

export function convertLength(value: number, from: LengthUnit, to: LengthUnit): number {
  const safe = assertNonNegative(value, 'length');
  if (from === to) return safe;
  return from === 'cm' ? safe / CM_PER_IN : safe * CM_PER_IN;
}

export function toKilograms(value: number, from: WeightUnit): number {
  return convertWeight(value, from, 'kg');
}

/**
 * Body-mass index — plain arithmetic. The app deliberately does not attach a
 * clinical category to the result.
 */
export function bmi(weightKg: number, heightCm: number): number {
  const weight = assertNonNegative(weightKg, 'weightKg');
  const height = assertNonNegative(heightCm, 'heightCm');
  if (weight === 0 || height === 0) {
    throw new EngineError('OUT_OF_RANGE', 'Weight and height must be greater than zero');
  }
  const metres = height / 100;
  return weight / (metres * metres);
}

/** Trim trailing zeros for display: 12.500 -> "12.5", 12.000 -> "12". */
export function formatDecimal(value: number, maxFractionDigits = 3): string {
  assertFiniteNumber(value, 'value');
  const fixed = value.toFixed(Math.max(0, Math.min(10, maxFractionDigits)));
  if (!fixed.includes('.')) return fixed;
  return fixed.replace(/0+$/, '').replace(/\.$/, '');
}
