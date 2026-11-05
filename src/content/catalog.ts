import type { Language } from '../db/db';
import type { Source } from '../engine/types';

export const CONTENT_VERSION = '0.1.0';

/* ------------------------------------------------------------------ */
/* Shared, non-clinical catalogues used by the UI.                     */
/* Nothing in this file is a dose, cut-off or recommendation.          */
/* ------------------------------------------------------------------ */

export interface ComplaintTemplate {
  id: string;
  ar: string;
  en: string;
}

/** FR-102 complaint templates (labels only; the clinical content is Phase 2). */
export const complaintTemplates: readonly ComplaintTemplate[] = [
  { id: 'stroke', ar: 'جلطة / TIA', en: 'Stroke / TIA' },
  { id: 'seizure', ar: 'تشنج / إغماء', en: 'Seizure / Syncope' },
  { id: 'headache', ar: 'صداع', en: 'Headache' },
  { id: 'dizziness', ar: 'دوخة / دوار', en: 'Dizziness / Vertigo' },
  { id: 'weakness', ar: 'ضعف / اعتلال أعصاب', en: 'Weakness / Neuropathy' },
  { id: 'cognitive', ar: 'تدهور معرفي', en: 'Cognitive decline' },
  { id: 'movement', ar: 'اضطراب حركة', en: 'Movement disorder' },
  { id: 'consciousness', ar: 'تغير مستوى الوعي', en: 'Altered consciousness' },
  { id: 'back', ar: 'ألم ظهر / اعتلال نخاعي', en: 'Back pain / Myelopathy' },
];

export function complaintLabel(id: string | null, language: Language): string | null {
  if (!id) return null;
  const found = complaintTemplates.find((template) => template.id === id);
  if (!found) return id;
  return language === 'ar' ? found.ar : found.en;
}

export interface PlannedScore {
  id: string;
  name: string;
}

/** FR-301 score list. Each becomes runnable only after verified content lands. */
export const plannedScores: readonly PlannedScore[] = [
  { id: 'nihss', name: 'NIHSS' },
  { id: 'gcs', name: 'GCS' },
  { id: 'mrs', name: 'mRS' },
  { id: 'abcd2', name: 'ABCD2' },
  { id: 'cha2ds2-vasc', name: 'CHA2DS2-VASc' },
  { id: 'has-bled', name: 'HAS-BLED' },
  { id: 'ich-score', name: 'ICH Score' },
  { id: 'hunt-hess', name: 'Hunt & Hess' },
  { id: 'wfns', name: 'WFNS' },
  { id: 'modified-fisher', name: 'Modified Fisher' },
  { id: 'aspects', name: 'ASPECTS (manual entry)' },
  { id: 'hoehn-yahr', name: 'Hoehn & Yahr' },
  { id: 'modified-ashworth', name: 'Modified Ashworth' },
  { id: 'mrc-sum', name: 'MRC sum score' },
  { id: 'alsfrs-r', name: 'ALSFRS-R' },
  { id: 'epworth', name: 'Epworth Sleepiness Scale' },
  { id: 'moca', name: 'MoCA (score entry)' },
  { id: 'rosier', name: 'ROSIER' },
];

export interface PlannedAlgorithm {
  id: string;
  name: string;
  priority: 1 | 2;
}

/** FR-401 algorithm roadmap. */
export const plannedAlgorithms: readonly PlannedAlgorithm[] = [
  { id: 'ais', name: 'Acute Ischemic Stroke', priority: 1 },
  { id: 'ich', name: 'Intracerebral Haemorrhage', priority: 1 },
  { id: 'sah', name: 'Subarachnoid Haemorrhage', priority: 1 },
  { id: 'status-epilepticus', name: 'Status Epilepticus', priority: 1 },
  { id: 'tia-workup', name: 'TIA / ABCD2 workup', priority: 1 },
  { id: 'first-seizure', name: 'First seizure', priority: 2 },
  { id: 'gbs', name: 'Guillain–Barré syndrome', priority: 2 },
  { id: 'myasthenic-crisis', name: 'Myasthenic crisis', priority: 2 },
  { id: 'cns-infection', name: 'Meningitis / Encephalitis', priority: 2 },
  { id: 'raised-icp', name: 'Raised intracranial pressure', priority: 2 },
  { id: 'cvst', name: 'Cerebral venous sinus thrombosis', priority: 2 },
  { id: 'headache-red-flags', name: 'Acute headache red flags', priority: 2 },
  { id: 'vertigo-hints', name: 'Acute vertigo (HINTS)', priority: 2 },
  { id: 'cord-compression', name: 'Cord compression', priority: 2 },
  { id: 'brain-death', name: 'Brain death protocol', priority: 2 },
];

export interface PlannedDrugClass {
  id: string;
  name: string;
}

/** FR-502 drug classes for Phase 2. */
export const plannedDrugClasses: readonly PlannedDrugClass[] = [
  { id: 'thrombolytics', name: 'Thrombolytics (alteplase / tenecteplase)' },
  { id: 'antiplatelets', name: 'Antiplatelets' },
  { id: 'anticoagulants', name: 'DOACs / warfarin / heparins + reversal' },
  { id: 'lipids', name: 'Statins and lipid-lowering' },
  { id: 'antiepileptics', name: 'Antiepileptics' },
  { id: 'acute-htn', name: 'Acute antihypertensives' },
  { id: 'osmotherapy', name: 'Osmotherapy' },
  { id: 'immunotherapy', name: 'Steroids / IVIG / PLEX' },
  { id: 'antiparkinsonian', name: 'Antiparkinsonian' },
  { id: 'migraine', name: 'Migraine (acute & preventive)' },
];

export interface PlannedSource {
  id: string;
  org: string;
  scope: string;
}

/**
 * Suggested verification bodies from the spec (§7.5). These are planning rows,
 * NOT registered sources — a real Source row is created only when a value is
 * extracted from the actual text.
 */
export const plannedSources: readonly PlannedSource[] = [
  { id: 'aha-asa-stroke', org: 'AHA / ASA', scope: 'Acute ischemic stroke' },
  { id: 'eso-stroke', org: 'ESO', scope: 'Stroke' },
  { id: 'ncs-ich-sah', org: 'AHA/ASA + Neurocritical Care Society', scope: 'ICH / SAH' },
  { id: 'ilae-aes-nice', org: 'ILAE / AES / NICE', scope: 'Epilepsy & status epilepticus' },
  { id: 'esc-af', org: 'ESC + AHA/ACC/HRS', scope: 'AF & anticoagulation' },
  { id: 'esc-eas-lipids', org: 'ESC/EAS + ACC/AHA', scope: 'Lipids' },
  { id: 'ihs-headache', org: 'IHS (ICHD) / AHS', scope: 'Headache' },
  { id: 'aan-ean-pns', org: 'AAN / EAN-PNS / ECTRIMS', scope: 'Neuroimmunology, MG, GBS, MS' },
  { id: 'mds-dementia', org: 'MDS / AAN / EAN', scope: 'Movement disorders & dementia' },
  { id: 'drug-labels', org: 'FDA / EMA / EDA / BNF', scope: 'Drug labels & interactions' },
];

/** Registered, reviewed sources. Filled in Phase 2 from pasted source text. */
export const sources: readonly Source[] = [];
