import type {
  AlgorithmDef,
  DoseRule,
  InteractionDef,
  ScoreDef,
  Source,
} from '../engine/types';

/* ------------------------------------------------------------------ */
/* Demonstration content.                                             */
/*                                                                    */
/* Everything in this file is DELIBERATELY non-clinical: it exists to  */
/* prove the engines end-to-end while Phase 2 content is pending.      */
/* It must never be presented as medical advice.                       */
/* ------------------------------------------------------------------ */

export const demoSource: Source = {
  id: 'demo-source',
  title: 'Demo content — engine verification only (not a guideline)',
  org: 'Neuro Resident Companion development',
  year: 2026,
  version: '0.0.0',
  status: 'draft',
};

export const demoScore: ScoreDef = {
  id: 'demo-score',
  name: 'Demo score (engine verification only)',
  shortName: 'DEMO',
  description:
    'A non-clinical dummy definition used to test the score engine and its UI. Do not use for patient care.',
  items: [
    {
      id: 'alpha',
      label: 'Demo item A (not clinical)',
      options: [
        { id: 'a0', label: 'None (0)', value: 0 },
        { id: 'a1', label: 'Mild (1)', value: 1 },
        { id: 'a2', label: 'Marked (2)', value: 2 },
      ],
    },
    {
      id: 'beta',
      label: 'Demo item B (not clinical)',
      options: [
        { id: 'b0', label: 'Absent (0)', value: 0 },
        { id: 'b3', label: 'Present (3)', value: 3 },
      ],
    },
  ],
  interpretation: [
    { min: 0, max: 1, label: 'Demo band: lower range', tone: 'ok' },
    { min: 2, max: 3, label: 'Demo band: middle range', tone: 'warn' },
    { min: 4, max: 5, label: 'Demo band: upper range', tone: 'danger' },
  ],
  sourceId: 'demo-source',
  version: '0.0.0',
  status: 'draft',
};

export const demoAlgorithm: AlgorithmDef = {
  id: 'demo-algorithm',
  name: 'Demo decision tree (engine verification only)',
  description:
    'A non-clinical dummy tree used to test the decision-tree runner. Do not use for patient care.',
  start: 'q1',
  nodes: [
    {
      id: 'q1',
      kind: 'question',
      prompt: 'Demo question 1 — choose a branch',
      help: 'This is a demonstration node, not a clinical question.',
      options: [
        { id: 'go2', label: 'Continue to demo question 2', next: 'q2' },
        { id: 'finish-a', label: 'Finish with demo result A', next: 'result-a' },
      ],
    },
    {
      id: 'q2',
      kind: 'question',
      prompt: 'Demo question 2 — pick an outcome',
      options: [
        { id: 'to-b', label: 'Demo outcome B', next: 'result-b' },
        { id: 'to-c', label: 'Demo outcome C', next: 'result-c' },
      ],
    },
    {
      id: 'result-a',
      kind: 'result',
      prompt: 'Demo result A',
      result: {
        label: 'Demo result A (not clinical)',
        tone: 'info',
        actions: ['Demonstration only — this is not a clinical action.'],
      },
    },
    {
      id: 'result-b',
      kind: 'result',
      prompt: 'Demo result B',
      result: {
        label: 'Demo result B (not clinical)',
        tone: 'warn',
        actions: ['Demonstration only — this is not a clinical action.'],
      },
    },
    {
      id: 'result-c',
      kind: 'result',
      prompt: 'Demo result C',
      result: {
        label: 'Demo result C (not clinical)',
        tone: 'ok',
        actions: ['Demonstration only — this is not a clinical action.'],
      },
    },
  ],
  sourceId: 'demo-source',
  version: '0.0.0',
  status: 'draft',
};

export const demoDoseRule: DoseRule = {
  id: 'demo-dose',
  label: 'Demo dosing rule (no active substance)',
  route: 'demo route',
  unit: 'units',
  basis: 'per_kg',
  // Deliberately neutral numbers: 1 demo unit per kg, capped at 100 demo units.
  amount: 1,
  maxAmount: 100,
  rounding: '0.5',
  adjustments: ['renal', 'weight'],
  sourceId: 'demo-source',
  version: '0.0.0',
  status: 'draft',
};

export interface DemoDrug {
  id: string;
  label: string;
}

export const demoDrugs: readonly DemoDrug[] = [
  { id: 'demo-a', label: 'Demo drug A (not a medicine)' },
  { id: 'demo-b', label: 'Demo drug B (not a medicine)' },
  { id: 'demo-c', label: 'Demo drug C (not a medicine)' },
];

export const demoInteractions: readonly InteractionDef[] = [
  {
    id: 'demo-ia',
    drugs: ['demo-a', 'demo-b'],
    severity: 'major',
    mechanism: 'Demo mechanism text (not clinical).',
    management: 'Demo management text (not clinical).',
    sourceId: 'demo-source',
    version: '0.0.0',
    status: 'draft',
  },
  {
    id: 'demo-ib',
    drugs: ['demo-b', 'demo-c'],
    severity: 'moderate',
    mechanism: 'Demo mechanism text (not clinical).',
    management: 'Demo management text (not clinical).',
    sourceId: 'demo-source',
    version: '0.0.0',
    status: 'draft',
  },
  {
    id: 'demo-ic',
    drugs: ['demo-a', 'demo-c'],
    severity: 'minor',
    mechanism: 'Demo mechanism text (not clinical).',
    management: 'Demo management text (not clinical).',
    sourceId: 'demo-source',
    version: '0.0.0',
    status: 'draft',
  },
];
