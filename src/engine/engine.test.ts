import { describe, expect, it } from 'vitest';
import {
  EngineError,
  buildHandoverNote,
  bmi,
  calculateDose,
  calculateScore,
  checkInteractions,
  convertLength,
  convertMass,
  convertVolume,
  convertWeight,
  elapsedSince,
  formatDecimal,
  formatDose,
  formatElapsed,
  roundTo,
  toKilograms,
  validateAlgorithm,
  walkAlgorithm,
  type AlgorithmDef,
  type DoseRule,
  type EngineErrorCode,
  type InteractionDef,
  type ScoreDef,
} from './index';

function expectEngineError(fn: () => unknown, code: EngineErrorCode): void {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(EngineError);
    expect((error as EngineError).code).toBe(code);
    return;
  }
  throw new Error(`Expected EngineError with code ${code}`);
}

/* ------------------------------------------------------------------ */
/* Units                                                               */
/* ------------------------------------------------------------------ */

describe('unit conversions', () => {
  it('converts mass between mcg, mg and g', () => {
    expect(convertMass(1_000, 'mcg', 'mg')).toBe(1);
    expect(convertMass(1, 'g', 'mg')).toBe(1_000);
    expect(convertMass(2.5, 'g', 'kg')).toBeCloseTo(0.0025, 10);
  });

  it('converts volume between mL and L', () => {
    expect(convertVolume(1, 'L', 'mL')).toBe(1_000);
    expect(convertVolume(250, 'mL', 'L')).toBeCloseTo(0.25, 10);
  });

  it('converts weight between kg and lb', () => {
    expect(toKilograms(1, 'lb')).toBeCloseTo(0.45359237, 8);
    expect(convertWeight(1, 'kg', 'lb')).toBeCloseTo(2.2046226218, 8);
    expect(convertWeight(5, 'kg', 'kg')).toBe(5);
  });

  it('converts length between cm and inches', () => {
    expect(convertLength(2.54, 'cm', 'in')).toBeCloseTo(1, 10);
    expect(convertLength(12, 'in', 'cm')).toBeCloseTo(30.48, 10);
  });

  it('rejects negative and non-finite inputs', () => {
    expectEngineError(() => convertMass(-1, 'mg', 'g'), 'NEGATIVE_VALUE');
    expectEngineError(() => convertWeight(Number.NaN, 'kg', 'lb'), 'INVALID_NUMBER');
  });

  it('computes BMI without attaching a clinical category', () => {
    expect(bmi(70, 175)).toBeCloseTo(22.857, 3);
    expectEngineError(() => bmi(0, 175), 'OUT_OF_RANGE');
  });

  it('rounds down to a step', () => {
    expect(roundTo(1.99, 0.5)).toBe(1.5);
    expect(roundTo(2, 0.5)).toBe(2);
    expect(roundTo(0.1 + 0.2, 0.1)).toBe(0.3);
    expectEngineError(() => roundTo(1, 0), 'INVALID_RULE');
  });

  it('formats decimals without trailing zeros', () => {
    expect(formatDecimal(12)).toBe('12');
    expect(formatDecimal(12.5)).toBe('12.5');
    expect(formatDecimal(1.23456, 2)).toBe('1.23');
    expect(formatDecimal(0.0001, 3)).toBe('0');
  });
});

/* ------------------------------------------------------------------ */
/* Scores                                                              */
/* ------------------------------------------------------------------ */

const testScore: ScoreDef = {
  id: 'test-score',
  name: 'Test score',
  items: [
    {
      id: 'alpha',
      label: 'Item A',
      options: [
        { id: 'a0', label: 'None', value: 0 },
        { id: 'a1', label: 'Mild', value: 1 },
        { id: 'a2', label: 'Marked', value: 2 },
      ],
    },
    {
      id: 'beta',
      label: 'Item B',
      options: [
        { id: 'b0', label: 'Absent', value: 0 },
        { id: 'b3', label: 'Present', value: 3 },
      ],
    },
  ],
  interpretation: [
    { min: 0, max: 1, label: 'Low', tone: 'ok' },
    { min: 2, max: 3, label: 'Middle', tone: 'warn' },
    { min: 4, max: 5, label: 'High', tone: 'danger' },
  ],
  sourceId: 'test-source',
  version: '1.0.0',
  status: 'approved',
};

describe('calculateScore', () => {
  it('sums valid answers and selects the matching band', () => {
    const result = calculateScore(testScore, { alpha: 0, beta: 0 });
    expect(result.score).toBe(0);
    expect(result.min).toBe(0);
    expect(result.max).toBe(5);
    expect(result.complete).toBe(true);
    expect(result.band?.label).toBe('Low');
    expect(result.items.every((item) => item.answered)).toBe(true);
  });

  it('uses the upper boundary of a band', () => {
    const result = calculateScore(testScore, { alpha: 2, beta: 3 });
    expect(result.score).toBe(5);
    expect(result.band?.label).toBe('High');
  });

  it('marks partial answers as incomplete without inventing a value', () => {
    const result = calculateScore(testScore, { alpha: 1 });
    expect(result.score).toBe(1);
    expect(result.complete).toBe(false);
    const beta = result.items.find((item) => item.itemId === 'beta');
    expect(beta?.answered).toBe(false);
    expect(beta?.value).toBe(0);
    expect(result.band?.label).toBe('Low');
  });

  it('treats null and undefined as unanswered', () => {
    const result = calculateScore(testScore, { alpha: null, beta: undefined });
    expect(result.complete).toBe(false);
    expect(result.score).toBe(0);
  });

  it('rejects an option value that is not in the definition', () => {
    expectEngineError(() => calculateScore(testScore, { alpha: 9 }), 'INVALID_OPTION');
  });

  it('rejects non-numeric answers', () => {
    expectEngineError(
      () => calculateScore(testScore, { alpha: '1' as unknown as number }),
      'INVALID_OPTION',
    );
  });

  it('rejects an empty definition', () => {
    const empty = { ...testScore, items: [] } as unknown as ScoreDef;
    expectEngineError(() => calculateScore(empty, {}), 'EMPTY_DEFINITION');
  });
});

/* ------------------------------------------------------------------ */
/* Algorithms                                                          */
/* ------------------------------------------------------------------ */

const testAlgorithm: AlgorithmDef = {
  id: 'test-algorithm',
  name: 'Test algorithm',
  start: 'q1',
  nodes: [
    {
      id: 'q1',
      kind: 'question',
      prompt: 'First question',
      options: [
        { id: 'to-r1', label: 'Go to result 1', next: 'r1' },
        { id: 'to-q2', label: 'Go to question 2', next: 'q2' },
      ],
    },
    {
      id: 'q2',
      kind: 'question',
      prompt: 'Second question',
      options: [
        { id: 'to-r1', label: 'Go to result 1', next: 'r1' },
        { id: 'to-r2', label: 'Go to result 2', next: 'r2' },
      ],
    },
    {
      id: 'r1',
      kind: 'result',
      prompt: 'Result 1',
      result: { label: 'Result one', tone: 'ok', actions: ['Action one'] },
    },
    {
      id: 'r2',
      kind: 'result',
      prompt: 'Result 2',
      result: { label: 'Result two', tone: 'warn', actions: [] },
    },
  ],
  sourceId: 'test-source',
  version: '1.0.0',
  status: 'approved',
};

describe('walkAlgorithm', () => {
  it('returns the first question when there are no answers', () => {
    const outcome = walkAlgorithm(testAlgorithm, []);
    expect(outcome.status).toBe('question');
    if (outcome.status === 'question') {
      expect(outcome.node.id).toBe('q1');
    }
    expect(outcome.path).toHaveLength(0);
  });

  it('walks a single answer to a result', () => {
    const outcome = walkAlgorithm(testAlgorithm, ['to-r1']);
    expect(outcome.status).toBe('result');
    if (outcome.status === 'result') {
      expect(outcome.node.id).toBe('r1');
      expect(outcome.node.result?.label).toBe('Result one');
    }
    expect(outcome.path).toHaveLength(1);
    expect(outcome.path[0]?.choiceId).toBe('to-r1');
  });

  it('walks multiple answers and records every step', () => {
    const outcome = walkAlgorithm(testAlgorithm, ['to-q2', 'to-r2']);
    expect(outcome.status).toBe('result');
    if (outcome.status === 'result') {
      expect(outcome.node.id).toBe('r2');
    }
    expect(outcome.path.map((step) => step.nodeId)).toEqual(['q1', 'q2']);
    expect(outcome.path.map((step) => step.choiceId)).toEqual(['to-q2', 'to-r2']);
  });

  it('ignores answers after a result node', () => {
    const outcome = walkAlgorithm(testAlgorithm, ['to-r1', 'to-r2']);
    expect(outcome.status).toBe('result');
    expect(outcome.path).toHaveLength(1);
  });

  it('returns a typed error for an unknown option', () => {
    const outcome = walkAlgorithm(testAlgorithm, ['nope']);
    expect(outcome.status).toBe('error');
    if (outcome.status === 'error') {
      expect(outcome.error.code).toBe('UNKNOWN_OPTION');
    }
  });

  it('returns a typed error for a missing start node', () => {
    const broken: AlgorithmDef = { ...testAlgorithm, start: 'missing' };
    const outcome = walkAlgorithm(broken, []);
    expect(outcome.status).toBe('error');
    if (outcome.status === 'error') {
      expect(outcome.error.code).toBe('UNKNOWN_NODE');
    }
  });

  it('returns a typed error for a missing target node', () => {
    const broken: AlgorithmDef = {
      ...testAlgorithm,
      nodes: testAlgorithm.nodes.map((node) =>
        node.id === 'q1'
          ? {
              ...node,
              options: [{ id: 'bad', label: 'Bad target', next: 'nowhere' }],
            }
          : node,
      ),
    };
    const outcome = walkAlgorithm(broken, ['bad']);
    expect(outcome.status).toBe('error');
    if (outcome.status === 'error') {
      expect(outcome.error.code).toBe('UNKNOWN_NODE');
    }
  });

  it('detects a cycle', () => {
    const cyclic: AlgorithmDef = {
      ...testAlgorithm,
      nodes: [
        {
          id: 'q1',
          kind: 'question',
          prompt: 'Loop 1',
          options: [{ id: 'to-q2', label: 'Next', next: 'q2' }],
        },
        {
          id: 'q2',
          kind: 'question',
          prompt: 'Loop 2',
          options: [{ id: 'to-q1', label: 'Back', next: 'q1' }],
        },
      ],
    };
    const outcome = walkAlgorithm(cyclic, ['to-q2', 'to-q1']);
    expect(outcome.status).toBe('error');
    if (outcome.status === 'error') {
      expect(outcome.error.code).toBe('CYCLE_DETECTED');
    }
  });
});

describe('validateAlgorithm', () => {
  it('accepts a structurally valid tree (result nodes may omit options)', () => {
    expect(validateAlgorithm(testAlgorithm)).toEqual([]);
  });

  it('reports duplicate node ids', () => {
    const duplicate: AlgorithmDef = {
      ...testAlgorithm,
      nodes: [...testAlgorithm.nodes, { ...testAlgorithm.nodes[0]! }],
    };
    expect(validateAlgorithm(duplicate).join(' ')).toContain('Duplicate node id');
  });

  it('reports a missing start node', () => {
    const broken: AlgorithmDef = { ...testAlgorithm, start: 'missing' };
    expect(validateAlgorithm(broken).join(' ')).toContain('does not exist');
  });

  it('reports a question without options', () => {
    const broken: AlgorithmDef = {
      ...testAlgorithm,
      nodes: testAlgorithm.nodes.map((node) =>
        node.id === 'q1' ? { ...node, options: [] } : node,
      ),
    };
    expect(validateAlgorithm(broken).join(' ')).toContain('has no options');
  });

  it('reports a result without a payload', () => {
    const broken: AlgorithmDef = {
      ...testAlgorithm,
      nodes: testAlgorithm.nodes.map((node) =>
        node.id === 'r1' ? { ...node, result: undefined } : node,
      ),
    };
    expect(validateAlgorithm(broken).join(' ')).toContain('has no result payload');
  });

  it('reports a result that carries options', () => {
    const broken: AlgorithmDef = {
      ...testAlgorithm,
      nodes: testAlgorithm.nodes.map((node) =>
        node.id === 'r1'
          ? {
              ...node,
              options: [{ id: 'x', label: 'X', next: 'r2' }],
            }
          : node,
      ),
    };
    expect(validateAlgorithm(broken).join(' ')).toContain('must not have options');
  });

  it('reports missing option targets', () => {
    const broken: AlgorithmDef = {
      ...testAlgorithm,
      nodes: testAlgorithm.nodes.map((node) =>
        node.id === 'q2'
          ? {
              ...node,
              options: [{ id: 'bad', label: 'Bad', next: 'missing' }],
            }
          : node,
      ),
    };
    expect(validateAlgorithm(broken).join(' ')).toContain('points to missing node');
  });

  it('reports unreachable nodes', () => {
    const broken: AlgorithmDef = {
      ...testAlgorithm,
      nodes: [
        ...testAlgorithm.nodes,
        {
          id: 'orphan',
          kind: 'result',
          prompt: 'Orphan',
          result: { label: 'Orphan', tone: 'info', actions: [] },
        },
      ],
    };
    expect(validateAlgorithm(broken).join(' ')).toContain('is unreachable');
  });
});

/* ------------------------------------------------------------------ */
/* Dosing                                                              */
/* ------------------------------------------------------------------ */

function makeRule(overrides: Partial<DoseRule> = {}): DoseRule {
  return {
    id: 'test-rule',
    label: 'Test rule',
    route: 'test route',
    unit: 'units',
    basis: 'per_kg',
    amount: 1,
    maxAmount: 100,
    rounding: '0.5',
    adjustments: [],
    sourceId: 'test-source',
    version: '1.0.0',
    status: 'approved',
    ...overrides,
  };
}

describe('calculateDose', () => {
  it('calculates a weight-based dose', () => {
    const result = calculateDose(makeRule(), { weightKg: 70 });
    expect(result.dose).toBe(70);
    expect(result.raw).toBe(70);
    expect(result.capped).toBe(false);
    expect(result.rounded).toBe(false);
    expect(result.steps.length).toBeGreaterThan(1);
  });

  it('applies an absolute maximum and never exceeds it', () => {
    const result = calculateDose(makeRule(), { weightKg: 120 });
    expect(result.raw).toBe(120);
    expect(result.capped).toBe(true);
    expect(result.dose).toBe(100);
  });

  it('floors when rounding, so the cap can never be rounded upward', () => {
    const result = calculateDose(
      makeRule({ amount: 1.2, maxAmount: 10.5, rounding: '1' }),
      { weightKg: 10 },
    );
    expect(result.raw).toBe(12);
    expect(result.capped).toBe(true);
    expect(result.dose).toBe(10);
    expect(result.rounded).toBe(true);
  });

  it('calculates a fixed dose without requiring a weight', () => {
    const result = calculateDose(
      makeRule({ basis: 'fixed', amount: 50, maxAmount: undefined, rounding: 'none' }),
      {},
    );
    expect(result.dose).toBe(50);
    expect(result.raw).toBe(50);
  });

  it('requires a weight for a per-kg rule', () => {
    expectEngineError(() => calculateDose(makeRule(), {}), 'WEIGHT_REQUIRED');
  });

  it('rejects an out-of-range weight', () => {
    expectEngineError(
      () => calculateDose(makeRule(), { weightKg: 0 }),
      'WEIGHT_OUT_OF_RANGE',
    );
    expectEngineError(
      () => calculateDose(makeRule(), { weightKg: 900 }),
      'WEIGHT_OUT_OF_RANGE',
    );
  });

  it('enforces rule-specific weight limits', () => {
    expectEngineError(
      () => calculateDose(makeRule({ minWeightKg: 50 }), { weightKg: 40 }),
      'WEIGHT_OUT_OF_RANGE',
    );
    expectEngineError(
      () => calculateDose(makeRule({ maxWeightKg: 80 }), { weightKg: 90 }),
      'WEIGHT_OUT_OF_RANGE',
    );
  });

  it('rejects an out-of-range age and eGFR', () => {
    expectEngineError(
      () => calculateDose(makeRule(), { weightKg: 70, ageYears: 130 }),
      'AGE_OUT_OF_RANGE',
    );
    expectEngineError(
      () => calculateDose(makeRule(), { weightKg: 70, egfr: 500 }),
      'EGFR_OUT_OF_RANGE',
    );
  });

  it('rejects an invalid rule amount and a unit mismatch', () => {
    expectEngineError(
      () => calculateDose(makeRule({ amount: 0 }), { weightKg: 70 }),
      'INVALID_RULE',
    );
    expectEngineError(
      () => calculateDose(makeRule(), { weightKg: 70 }, 'mg'),
      'INVALID_UNIT',
    );
  });

  it('rejects a dose that rounds down to zero', () => {
    expectEngineError(
      () => calculateDose(makeRule({ amount: 0.1, rounding: '1' }), { weightKg: 1 }),
      'DOSE_ROUNDS_TO_ZERO',
    );
  });

  it('warns about missing adjustment inputs and draft status', () => {
    const result = calculateDose(
      makeRule({
        basis: 'fixed',
        adjustments: ['renal', 'hepatic', 'age', 'weight'],
        status: 'draft',
      }),
      {},
    );
    const joined = result.warnings.join(' ');
    expect(joined).toContain('Renal function');
    expect(joined).toContain('Hepatic status');
    expect(joined).toContain('Age was not provided');
    expect(joined).toContain('Weight was not provided');
    expect(joined).toContain('DRAFT');
  });

  it('does not warn when the required adjustment input is supplied', () => {
    const result = calculateDose(
      makeRule({ basis: 'fixed', adjustments: ['hepatic'] }),
      { hepaticChildPugh: 'B' },
    );
    expect(result.warnings.join(' ')).not.toContain('Hepatic status');
  });

  it('formats a dose value with its unit', () => {
    expect(formatDose(12.5, 'mg')).toBe('12.5 mg');
  });
});

/* ------------------------------------------------------------------ */
/* Interactions                                                        */
/* ------------------------------------------------------------------ */

const interactionDefs: InteractionDef[] = [
  {
    id: 'ia-major',
    drugs: ['a', 'b'],
    severity: 'major',
    sourceId: 'test-source',
    version: '1.0.0',
    status: 'approved',
  },
  {
    id: 'ib-moderate',
    drugs: ['b', 'c'],
    severity: 'moderate',
    sourceId: 'test-source',
    version: '1.0.0',
    status: 'approved',
  },
  {
    id: 'ic-minor',
    drugs: ['a', 'c'],
    severity: 'minor',
    sourceId: 'test-source',
    version: '1.0.0',
    status: 'approved',
  },
];

describe('checkInteractions', () => {
  it('finds an interaction regardless of selection order', () => {
    expect(checkInteractions(['a', 'b'], interactionDefs).map((item) => item.id)).toEqual([
      'ia-major',
    ]);
    expect(checkInteractions(['b', 'a'], interactionDefs).map((item) => item.id)).toEqual([
      'ia-major',
    ]);
  });

  it('collapses duplicate selections', () => {
    expect(checkInteractions(['a', 'a', 'b'], interactionDefs)).toHaveLength(1);
  });

  it('sorts findings by severity', () => {
    expect(
      checkInteractions(['a', 'b', 'c'], interactionDefs).map((item) => item.id),
    ).toEqual(['ia-major', 'ib-moderate', 'ic-minor']);
  });

  it('de-duplicates definitions with the same id', () => {
    const duplicated: InteractionDef[] = [...interactionDefs, { ...interactionDefs[0]! }];
    expect(checkInteractions(['a', 'b'], duplicated)).toHaveLength(1);
  });

  it('returns an empty list when nothing is recorded', () => {
    expect(checkInteractions(['x', 'y'], interactionDefs)).toEqual([]);
  });

  it('trims ids and ignores empty selections', () => {
    expect(checkInteractions([' a ', 'b', '  '], interactionDefs)).toHaveLength(1);
  });
});

/* ------------------------------------------------------------------ */
/* Handover                                                            */
/* ------------------------------------------------------------------ */

describe('formatElapsed / elapsedSince', () => {
  it('formats durations compactly', () => {
    expect(formatElapsed(0)).toBe('0m');
    expect(formatElapsed(59_000)).toBe('0m');
    expect(formatElapsed(60_000)).toBe('1m');
    expect(formatElapsed(3_600_000)).toBe('1h');
    expect(formatElapsed(90_000_000)).toBe('1d 1h');
    expect(formatElapsed(Number.NaN)).toBe('0m');
  });

  it('reports a future timestamp without a negative duration', () => {
    const now = new Date('2026-01-02T00:00:00.000Z');
    const result = elapsedSince('2026-01-03T00:00:00.000Z', now);
    expect(result?.future).toBe(true);
    expect(result?.ms).toBe(0);
    expect(result?.text).toBe('0m');
  });

  it('returns null for missing or invalid timestamps', () => {
    expect(elapsedSince(null)).toBeNull();
    expect(elapsedSince('not-a-date')).toBeNull();
  });
});

describe('buildHandoverNote', () => {
  const now = new Date('2026-01-02T00:00:00.000Z');

  it('states explicitly when fields are not recorded', () => {
    const note = buildHandoverNote({}, now);
    expect(note).toContain('DEMOGRAPHICS');
    expect(note).toContain('Not recorded');
    expect(note).toContain('Allergies: none recorded');
    expect(note).toContain('Complaint: not recorded');
    expect(note).toContain('History: not entered');
    expect(note).toContain('Verify every value');
  });

  it('includes entered values verbatim without inventing anything', () => {
    const note = buildHandoverNote(
      {
        ageYears: 64,
        sex: 'female',
        weightKg: 70,
        heightCm: 175,
        pregnant: false,
        creatinineMgDl: 0.9,
        egfr: 90,
        allergies: ['penicillin', '  latex  ', ''],
        lastKnownWell: '2026-01-01T00:00:00.000Z',
        notes: 'Reviewed with the consultant.',
        history: {
          complaint: 'headache',
          hpi: 'Sudden onset.',
          pmh: 'Hypertension.',
          drugs: 'Amlodipine.',
          family: 'No relevant history.',
          social: 'Non-smoker.',
        },
      },
      now,
    );
    expect(note).toContain('Age: 64 y');
    expect(note).toContain('Sex: female');
    expect(note).toContain('Weight: 70 kg');
    expect(note).toContain('Height: 175 cm');
    expect(note).toContain('BMI: 22.9');
    expect(note).toContain('Pregnancy: no');
    expect(note).toContain('Allergies: penicillin, latex');
    expect(note).toContain('Creatinine: 0.9 mg/dL');
    expect(note).toContain('eGFR: 90 mL/min/1.73m2');
    expect(note).toContain('(1d ago)');
    expect(note).toContain('Complaint: headache');
    expect(note).toContain('HPI: Sudden onset.');
    expect(note).toContain('Reviewed with the consultant.');
    expect(note).not.toContain('History: not entered');
  });

  it('marks a future last-known-well time instead of showing a negative elapsed time', () => {
    const note = buildHandoverNote(
      { lastKnownWell: '2026-01-03T00:00:00.000Z' },
      now,
    );
    expect(note).toContain('in the future — check the entry');
  });
});
