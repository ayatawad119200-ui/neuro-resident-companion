import { bmi } from './units';

export interface HandoverHistory {
  complaint?: string | null;
  hpi?: string | null;
  pmh?: string | null;
  drugs?: string | null;
  family?: string | null;
  social?: string | null;
}

export interface HandoverInput {
  ageYears?: number | null;
  sex?: string | null;
  weightKg?: number | null;
  heightCm?: number | null;
  pregnant?: boolean | null;
  creatinineMgDl?: number | null;
  egfr?: number | null;
  allergies?: readonly string[];
  lastKnownWell?: string | null;
  notes?: string | null;
  history?: HandoverHistory;
}

export interface ElapsedInfo {
  ms: number;
  text: string;
  future: boolean;
}

/** "2d 3h 5m" — compact, locale-independent clinical duration. */
export function formatElapsed(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '0m';
  const totalMinutes = Math.floor(ms / 60_000);
  const days = Math.floor(totalMinutes / 1_440);
  const hours = Math.floor((totalMinutes % 1_440) / 60);
  const minutes = totalMinutes % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (days === 0 && (minutes > 0 || parts.length === 0)) parts.push(`${minutes}m`);
  return parts.join(' ');
}

export function elapsedSince(
  iso: string | null | undefined,
  now: Date = new Date(),
): ElapsedInfo | null {
  if (!iso) return null;
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return null;
  const diff = now.getTime() - then.getTime();
  const clamped = Math.max(0, diff);
  return { ms: clamped, text: formatElapsed(clamped), future: diff < 0 };
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function formatLocal(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function clean(value: string | null | undefined): string {
  return (value ?? '').trim();
}

/**
 * Builds a copyable handover note from a case (M8 / FR-801). Clinical fields
 * are displayed exactly as entered — the builder never adds or infers values.
 */
export function buildHandoverNote(input: HandoverInput, now: Date = new Date()): string {
  const lines: string[] = [];

  lines.push('NEURO RESIDENT COMPANION — HANDOVER NOTE');
  lines.push('Decision-support only. The treating physician remains responsible.');
  lines.push(`Generated: ${formatLocal(now)}`);
  lines.push('');

  lines.push('DEMOGRAPHICS');
  const demo: string[] = [];
  if (input.ageYears !== null && input.ageYears !== undefined) {
    demo.push(`Age: ${input.ageYears} y`);
  }
  if (clean(input.sex)) demo.push(`Sex: ${clean(input.sex)}`);
  if (input.weightKg !== null && input.weightKg !== undefined) {
    demo.push(`Weight: ${input.weightKg} kg`);
  }
  if (input.heightCm !== null && input.heightCm !== undefined) {
    demo.push(`Height: ${input.heightCm} cm`);
  }
  if (
    input.weightKg !== null &&
    input.weightKg !== undefined &&
    input.heightCm !== null &&
    input.heightCm !== undefined &&
    input.weightKg > 0 &&
    input.heightCm > 0
  ) {
    demo.push(`BMI: ${bmi(input.weightKg, input.heightCm).toFixed(1)}`);
  }
  lines.push(demo.length ? demo.join(' | ') : 'Not recorded');

  if (input.pregnant !== null && input.pregnant !== undefined) {
    lines.push(`Pregnancy: ${input.pregnant ? 'yes' : 'no'}`);
  }

  const allergies = (input.allergies ?? []).map((item) => item.trim()).filter(Boolean);
  lines.push(`Allergies: ${allergies.length ? allergies.join(', ') : 'none recorded'}`);

  const labs: string[] = [];
  if (input.creatinineMgDl !== null && input.creatinineMgDl !== undefined) {
    labs.push(`Creatinine: ${input.creatinineMgDl} mg/dL`);
  }
  if (input.egfr !== null && input.egfr !== undefined) {
    labs.push(`eGFR: ${input.egfr} mL/min/1.73m2`);
  }
  if (labs.length) lines.push(labs.join(' | '));
  lines.push('');

  lines.push('LAST KNOWN WELL');
  const elapsed = elapsedSince(input.lastKnownWell, now);
  if (elapsed) {
    const when = new Date(input.lastKnownWell as string);
    lines.push(
      elapsed.future
        ? `${formatLocal(when)} (in the future — check the entry)`
        : `${formatLocal(when)} (${elapsed.text} ago)`,
    );
  } else {
    lines.push('Not recorded');
  }
  lines.push('');

  lines.push('PRESENTATION');
  const history = input.history ?? {};
  const complaint = clean(history.complaint);
  lines.push(`Complaint: ${complaint || 'not recorded'}`);
  const historyRows: Array<[string, string]> = [
    ['HPI', clean(history.hpi)],
    ['PMH', clean(history.pmh)],
    ['Drug history', clean(history.drugs)],
    ['Family history', clean(history.family)],
    ['Social history', clean(history.social)],
  ];
  let wroteHistory = false;
  for (const [label, value] of historyRows) {
    if (!value) continue;
    wroteHistory = true;
    lines.push(`${label}: ${value}`);
  }
  if (!wroteHistory) lines.push('History: not entered');
  lines.push('');

  const notes = clean(input.notes);
  if (notes) {
    lines.push('NOTES');
    lines.push(notes);
    lines.push('');
  }

  lines.push('— End of note. Verify every value against the approved source before acting.');
  return lines.join('\n');
}
