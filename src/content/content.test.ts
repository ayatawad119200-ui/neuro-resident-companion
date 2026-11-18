import { describe, expect, it } from 'vitest';
import { calculateScore, EngineError } from '../engine';
import { ScoreDefSchema, SourceSchema } from '../engine/types';
import { clinicalScores, gcsScore, medcalcSource, nihssScore, sources } from './index';

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

/* ------------------------------------------------------------------ */
/* NIHSS                                                               */
/* ------------------------------------------------------------------ */

/** Answers every item with its lowest-valued option id. */
const nihssZeros = (): Record<string, string> =>
  Object.fromEntries(
    nihssScore.items.map((item) => [
      item.id,
      item.options.reduce((lowest, option) =>
        option.value < lowest.value ? option : lowest,
      ).id,
    ]),
  );

/** Answers every item with its highest-valued option id. */
const nihssMax = (): Record<string, string> =>
  Object.fromEntries(
    nihssScore.items.map((item) => [
      item.id,
      item.options.reduce((highest, option) =>
        option.value > highest.value ? option : highest,
      ).id,
    ]),
  );

const nihssAnswers = (overrides: Record<string, string>) => ({
  ...nihssZeros(),
  ...overrides,
});

describe('NIHSS definition', () => {
  it('parses as a valid draft score with 15 items and a 0–42 range', () => {
    expect(ScoreDefSchema.safeParse(nihssScore).success).toBe(true);
    expect(nihssScore.status).toBe('draft');
    expect(nihssScore.items).toHaveLength(15);
    expect(nihssScore.sourceId).toBe('medcalc-pro');

    const result = calculateScore(nihssScore, nihssMax());
    expect(result.min).toBe(0);
    expect(result.max).toBe(42);
  });

  it('gives exactly one band for every possible total', () => {
    for (let total = 0; total <= 42; total += 1) {
      const bands = nihssScore.interpretation.filter(
        (entry) => total >= entry.min && total <= entry.max,
      );
      expect(bands, `total ${total}`).toHaveLength(1);
    }
  });

  it('scores all-zero answers as 0 and all-maximum answers as 42', () => {
    const lowest = calculateScore(nihssScore, nihssZeros());
    expect(lowest.score).toBe(0);
    expect(lowest.complete).toBe(true);
    expect(lowest.band?.label).toContain('Minor');

    const highest = calculateScore(nihssScore, nihssMax());
    expect(highest.score).toBe(42);
    expect(highest.complete).toBe(true);
    expect(highest.band?.label).toContain('Severe');
  });

  it('maps the band boundaries 4/5, 15/16, and 20/21', () => {
    expect(
      calculateScore(nihssScore, nihssAnswers({ loc_responsiveness: 'coma', loc_questions: 'one_correct' }))
        .band?.label,
    ).toContain('Minor');
    expect(
      calculateScore(nihssScore, nihssAnswers({ loc_responsiveness: 'coma', loc_questions: 'none_correct' }))
        .band?.label,
    ).toContain('Moderate stroke');

    const fifteen = {
      loc_responsiveness: 'coma',
      loc_questions: 'none_correct',
      loc_commands: 'none_correct',
      best_gaze: 'forced_deviation',
      visual_fields: 'complete_hemianopia',
      facial_palsy: 'partial',
      motor_arm_left: 'some_effort',
    };
    expect(calculateScore(nihssScore, nihssAnswers(fifteen)).score).toBe(15);
    expect(calculateScore(nihssScore, nihssAnswers(fifteen)).band?.label).toContain(
      'Moderate stroke',
    );

    const sixteen = { ...fifteen, motor_arm_left: 'no_effort' };
    expect(calculateScore(nihssScore, nihssAnswers(sixteen)).score).toBe(16);
    expect(calculateScore(nihssScore, nihssAnswers(sixteen)).band?.label).toContain(
      'Moderate to severe',
    );

    const twenty = { ...sixteen, motor_leg_left: 'no_movement' };
    expect(calculateScore(nihssScore, nihssAnswers(twenty)).score).toBe(20);
    expect(calculateScore(nihssScore, nihssAnswers(twenty)).band?.label).toContain(
      'Moderate to severe',
    );

    const twentyOne = { ...twenty, motor_leg_right: 'drift' };
    expect(calculateScore(nihssScore, nihssAnswers(twentyOne)).score).toBe(21);
    expect(calculateScore(nihssScore, nihssAnswers(twentyOne)).band?.label).toContain(
      'Severe stroke',
    );
  });

  it('keeps an untestable limb at 0 and reports the correct label', () => {
    const result = calculateScore(
      nihssScore,
      nihssAnswers({ motor_arm_left: 'untestable' }),
    );
    expect(result.score).toBe(0);
    expect(result.complete).toBe(true);
    const item = result.items.find((entry) => entry.itemId === 'motor_arm_left');
    expect(item?.optionId).toBe('untestable');
    expect(item?.value).toBe(0);
    expect(item?.optionLabel).toContain('Untestable');
  });

  it('marks a partially answered assessment as incomplete', () => {
    const result = calculateScore(nihssScore, { best_gaze: 'forced_deviation' });
    expect(result.complete).toBe(false);
    expect(result.score).toBe(2);
  });
});
