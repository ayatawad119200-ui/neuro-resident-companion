import type { ScoreDef, Source } from '../engine/types';

/* ------------------------------------------------------------------ */
/* Clinical content — Phase 2 (draft).                                */
/*                                                                    */
/* Values are transcribed from the author-provided MedCalc-Pro        */
/* dataset (repository owner granted permission). They are DRAFT and   */
/* have not been approved by an independent clinical reviewer.        */
/* Never change a value here without bumping `version` and recording   */
/* the source text used.                                              */
/* ------------------------------------------------------------------ */

export const medcalcSource: Source = {
  id: 'medcalc-pro',
  title: 'MedCalc-Pro clinical calculator dataset (author-provided)',
  org: 'MedCalc-Pro repository owner',
  year: 2026,
  version: 'main-2026-06-07',
  url: 'https://github.com/easymoney7774/MedCalc-Pro',
  status: 'draft',
};

export const gcsScore: ScoreDef = {
  id: 'gcs',
  name: 'Glasgow Coma Scale (GCS)',
  shortName: 'GCS',
  description:
    'Eye, verbal and motor response; total 3–15. Transcribed from the author-provided MedCalc-Pro dataset. Draft — not independently verified.',
  items: [
    {
      id: 'eye_opening',
      label: 'Eye opening (E)',
      options: [
        { id: 'e4', label: 'Spontaneous', value: 4 },
        { id: 'e3', label: 'To sound', value: 3 },
        { id: 'e2', label: 'To pressure', value: 2 },
        { id: 'e1', label: 'None', value: 1 },
      ],
    },
    {
      id: 'verbal_response',
      label: 'Verbal response (V)',
      help: 'If intubated, typically scored as 1 or recorded as 1T (select the closest option based on the actual response, usually None).',
      options: [
        {
          id: 'v5',
          label: 'Oriented — correctly answers questions about time, place, and person',
          value: 5,
        },
        {
          id: 'v4',
          label: 'Confused — able to converse but content is disorganized',
          value: 4,
        },
        {
          id: 'v3',
          label: 'Inappropriate words — words or phrases without logical sentences',
          value: 3,
        },
        {
          id: 'v2',
          label: 'Incomprehensible sounds — moaning/grunting, no words',
          value: 2,
        },
        { id: 'v1', label: 'None', value: 1 },
      ],
    },
    {
      id: 'motor_response',
      label: 'Motor response (M)',
      options: [
        { id: 'm6', label: 'Obeys commands', value: 6 },
        {
          id: 'm5',
          label: 'Localizing — hand moves past clavicle/chin attempting to remove stimulus',
          value: 5,
        },
        {
          id: 'm4',
          label: 'Normal flexion/withdrawal — limb rapidly withdraws from stimulus',
          value: 4,
        },
        {
          id: 'm3',
          label: 'Abnormal flexion — decorticate posturing, slow flexion and adduction of upper limbs',
          value: 3,
        },
        {
          id: 'm2',
          label: 'Extension — decerebrate posturing, rigid extension and internal rotation of limbs',
          value: 2,
        },
        { id: 'm1', label: 'None', value: 1 },
      ],
    },
  ],
  interpretation: [
    { min: 13, max: 15, label: 'Mild head injury (13–15)', tone: 'ok' },
    { min: 9, max: 12, label: 'Moderate head injury (9–12)', tone: 'warn' },
    { min: 3, max: 8, label: 'Severe head injury — coma (3–8)', tone: 'danger' },
  ],
  sourceId: 'medcalc-pro',
  version: '2026-06-07',
  status: 'draft',
};

/** Scores that are runnable today. All entries are draft until reviewed. */
export const clinicalScores: readonly ScoreDef[] = [gcsScore];
