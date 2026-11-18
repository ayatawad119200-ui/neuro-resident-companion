import { describe, expect, it } from 'vitest';
import { calculateScore, EngineError } from '../engine';
import { ScoreDefSchema, SourceSchema } from '../engine/types';
import { clinicalScores, gcsScore, medcalcSource, sources } from './index';

const gcs = (e: number, v: number, m: number) => ({
  eye_opening: e,
  verbal_response: v,
  motor_response: m,
});

describe('registered sources', () => {
  it('validates MedCalc-Pro and keeps it draft', () => {
    expect(SourceSchema.safeParse(medcalcSource).success).toBe(true);
    expect(medcalcSource.status).toBe('draft');
    expect(medcalcSource.version).toBe('main-2026-06-07');
  });

  it('exposes every registered source through the catalogue', () => {
    expect(sources.map((source) => source.id)).toContain('medcalc-pro');
  });

  it('links every clinical score to a registered source', () => {
    const ids = new Set(sources.map((source) => source.id));
    for (const definition of clinicalScores) {
      expect(ids.has(definition.sourceId)).toBe(true);
    }
  });
});

describe('GCS definition', () => {
  it('parses as a valid draft score definition', () => {
    const parsed = ScoreDefSchema.safeParse(gcsScore);
    expect(parsed.success).toBe(true);
    expect(gcsScore.status).toBe('draft');
    expect(gcsScore.items).toHaveLength(3);
  });

  it('gives exactly one interpretation band for every possible total', () => {
    for (let eye = 1; eye <= 4; eye += 1) {
      for (let verbal = 1; verbal <= 5; verbal += 1) {
        for (let motor = 1; motor <= 6; motor += 1) {
          const total = eye + verbal + motor;
          const band = gcsScore.interpretation.filter(
            (entry) => total >= entry.min && total <= entry.max,
          );
          expect(band, `total ${total}`).toHaveLength(1);
        }
      }
    }
  });

  it('scores the minimum (E1V1M1) and maximum (E4V5M6)', () => {
    const lowest = calculateScore(gcsScore, gcs(1, 1, 1));
    expect(lowest.score).toBe(3);
    expect(lowest.min).toBe(3);
    expect(lowest.complete).toBe(true);
    expect(lowest.band?.label).toContain('Severe');

    const highest = calculateScore(gcsScore, gcs(4, 5, 6));
    expect(highest.score).toBe(15);
    expect(highest.max).toBe(15);
    expect(highest.complete).toBe(true);
    expect(highest.band?.label).toContain('Mild');
  });

  it('maps the band boundaries 8/9 and 12/13', () => {
    // E1V1M6 = 8, E1V2M6 = 9, E3V3M6 = 12, E4V3M6 = 13.
    expect(calculateScore(gcsScore, gcs(1, 1, 6)).band?.label).toContain('Severe');
    expect(calculateScore(gcsScore, gcs(1, 2, 6)).band?.label).toContain('Moderate');
    expect(calculateScore(gcsScore, gcs(3, 3, 6)).band?.label).toContain('Moderate');
    expect(calculateScore(gcsScore, gcs(4, 3, 6)).band?.label).toContain('Mild');
  });

  it('marks a partially answered assessment as incomplete', () => {
    const result = calculateScore(gcsScore, { eye_opening: 4 });
    expect(result.complete).toBe(false);
    expect(result.score).toBe(4);
  });

  it('rejects a value that is not an option', () => {
    expect(() => calculateScore(gcsScore, gcs(5, 5, 6))).toThrow(EngineError);
  });
});
