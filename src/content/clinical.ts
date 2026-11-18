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

/* Shared option sets for the motor items (same values, different hold time). */

const motorLimbOptions = (seconds: number) => [
  { id: 'no_drift', label: `No drift (holds for ${seconds} seconds)`, value: 0 },
  {
    id: 'drift',
    label: `Drifts but does not hit bed before ${seconds} seconds`,
    value: 1,
  },
  {
    id: 'some_effort',
    label: 'Some effort against gravity; cannot maintain position',
    value: 2,
  },
  {
    id: 'no_effort',
    label: 'No effort against gravity; limb falls immediately',
    value: 3,
  },
  { id: 'no_movement', label: 'No movement', value: 4 },
  {
    id: 'untestable',
    label: 'Untestable (amputation or joint fusion) — scored 0',
    value: 0,
  },
];

export const nihssScore: ScoreDef = {
  id: 'nihss',
  name: 'NIH Stroke Scale (NIHSS)',
  shortName: 'NIHSS',
  description:
    '15 items, total 0–42. Transcribed from the author-provided MedCalc-Pro dataset. Draft — not independently verified. “Untestable” options are scored 0, as in the source.',
  items: [
    {
      id: 'loc_responsiveness',
      label: '1a. Level of Consciousness (LOC)',
      options: [
        { id: 'alert', label: 'Alert; keenly responsive', value: 0 },
        { id: 'drowsy', label: 'Not alert; arousable by minor stimulation', value: 1 },
        {
          id: 'obtunded',
          label: 'Obtunded or stuporous; requires strong or repeated stimulation',
          value: 2,
        },
        {
          id: 'coma',
          label: 'Coma (only reflex activity or no response)',
          value: 3,
        },
      ],
    },
    {
      id: 'loc_questions',
      label: '1b. LOC Questions (Month/Age)',
      options: [
        { id: 'both_correct', label: 'Both questions answered correctly', value: 0 },
        {
          id: 'one_correct',
          label: 'One question answered correctly (or intubated/unable to speak)',
          value: 1,
        },
        {
          id: 'none_correct',
          label: 'Both questions answered incorrectly (or aphasic/comatose)',
          value: 2,
        },
      ],
    },
    {
      id: 'loc_commands',
      label: '1c. LOC Commands (Open/Close Eyes / Make Fist)',
      options: [
        { id: 'both_correct', label: 'Both tasks performed correctly', value: 0 },
        { id: 'one_correct', label: 'One task performed correctly', value: 1 },
        { id: 'none_correct', label: 'Neither task performed correctly', value: 2 },
      ],
    },
    {
      id: 'best_gaze',
      label: '2. Best Gaze',
      options: [
        { id: 'normal', label: 'Normal', value: 0 },
        {
          id: 'partial_palsy',
          label: 'Partial gaze palsy (abnormal gaze in one or both eyes)',
          value: 1,
        },
        {
          id: 'forced_deviation',
          label: 'Forced deviation or total gaze paresis',
          value: 2,
        },
      ],
    },
    {
      id: 'visual_fields',
      label: '3. Visual Fields',
      options: [
        { id: 'no_loss', label: 'No visual loss', value: 0 },
        { id: 'partial_hemianopia', label: 'Partial hemianopia', value: 1 },
        { id: 'complete_hemianopia', label: 'Complete hemianopia', value: 2 },
        {
          id: 'bilateral_hemianopia',
          label: 'Bilateral hemianopia (total blindness)',
          value: 3,
        },
      ],
    },
    {
      id: 'facial_palsy',
      label: '4. Facial Palsy',
      options: [
        { id: 'normal', label: 'Normal', value: 0 },
        {
          id: 'minor',
          label: 'Minor (flattened nasolabial fold / asymmetric smile)',
          value: 1,
        },
        {
          id: 'partial',
          label: 'Partial (complete or near-complete paralysis of lower face)',
          value: 2,
        },
        {
          id: 'complete',
          label: 'Complete (absent movement of upper and lower face)',
          value: 3,
        },
      ],
    },
    {
      id: 'motor_arm_left',
      label: '5a. Motor Arm — Left',
      options: motorLimbOptions(10),
    },
    {
      id: 'motor_arm_right',
      label: '5b. Motor Arm — Right',
      options: motorLimbOptions(10),
    },
    {
      id: 'motor_leg_left',
      label: '6a. Motor Leg — Left',
      options: motorLimbOptions(5),
    },
    {
      id: 'motor_leg_right',
      label: '6b. Motor Leg — Right',
      options: motorLimbOptions(5),
    },
    {
      id: 'limb_ataxia',
      label: '7. Limb Ataxia',
      options: [
        { id: 'absent', label: 'Absent', value: 0 },
        { id: 'present_one', label: 'Present in one limb', value: 1 },
        { id: 'present_two', label: 'Present in two limbs', value: 2 },
        {
          id: 'untestable',
          label: 'Untestable (e.g., amputation/joint fusion) — scored 0',
          value: 0,
        },
      ],
    },
    {
      id: 'sensory',
      label: '8. Sensory',
      options: [
        { id: 'normal', label: 'Normal', value: 0 },
        { id: 'mild_loss', label: 'Mild sensory loss (dull to pinprick)', value: 1 },
        {
          id: 'severe_loss',
          label: 'Severe sensory loss (absent sensation)',
          value: 2,
        },
      ],
    },
    {
      id: 'best_language',
      label: '9. Best Language',
      options: [
        { id: 'no_aphasia', label: 'Normal (no aphasia)', value: 0 },
        {
          id: 'mild_moderate',
          label: 'Mild to moderate aphasia (some loss of fluency or comprehension)',
          value: 1,
        },
        {
          id: 'severe',
          label: 'Severe aphasia (fragmentary expression / communication limited)',
          value: 2,
        },
        {
          id: 'mute',
          label: 'Mute / global aphasia (no usable speech or auditory comprehension)',
          value: 3,
        },
      ],
    },
    {
      id: 'dysarthria',
      label: '10. Dysarthria',
      options: [
        { id: 'normal', label: 'Normal', value: 0 },
        {
          id: 'mild_moderate',
          label: 'Mild to moderate (slurred but understandable)',
          value: 1,
        },
        { id: 'severe', label: 'Severe (unintelligible speech)', value: 2 },
        { id: 'untestable', label: 'Untestable (e.g., intubated) — scored 0', value: 0 },
      ],
    },
    {
      id: 'extinction_neglect',
      label: '11. Extinction and Inattention (Neglect)',
      options: [
        { id: 'no_neglect', label: 'No neglect', value: 0 },
        {
          id: 'partial_neglect',
          label: 'Partial neglect (one modality: visual/tactile/auditory/spatial)',
          value: 1,
        },
        {
          id: 'complete_neglect',
          label:
            'Complete/profound neglect (more than one modality / does not recognize own hand)',
          value: 2,
        },
      ],
    },
  ],
  interpretation: [
    { min: 0, max: 4, label: 'Minor stroke (<5)', tone: 'ok' },
    { min: 5, max: 15, label: 'Moderate stroke (5–15)', tone: 'warn' },
    { min: 16, max: 20, label: 'Moderate to severe stroke (16–20)', tone: 'danger' },
    { min: 21, max: 42, label: 'Severe stroke (21–42)', tone: 'danger' },
  ],
  sourceId: 'medcalc-pro',
  version: '2026-06-07',
  status: 'draft',
};

/** Scores that are runnable today. All entries are draft until reviewed. */
export const clinicalScores: readonly ScoreDef[] = [gcsScore, nihssScore];
