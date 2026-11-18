import {
  EngineError,
  type ScoreBand,
  type ScoreDef,
  type ScoreOption,
} from './types';

export interface ScoreItemResult {
  itemId: string;
  label: string;
  optionId: string;
  value: number;
  optionLabel: string;
  answered: boolean;
}

export interface ScoreResult {
  score: number;
  min: number;
  max: number;
  complete: boolean;
  items: ScoreItemResult[];
  band?: ScoreBand;
}

/** A numeric option value or the option's `id` (needed when values repeat). */
export type ScoreAnswer = number | string;

/**
 * Generic score calculator (FR-302). All item values, weights and bands come
 * from the ScoreDef content — nothing clinical lives in this file.
 *
 * Answers may be option values or option ids. Ids matter when two options share
 * a value (e.g. "untestable" scored 0), so the recorded label stays accurate.
 *
 * Missing answers contribute 0 to the running total but mark the result as
 * incomplete, so the UI can refuse to present it as final.
 */
export function calculateScore(
  def: ScoreDef,
  values: Readonly<Record<string, ScoreAnswer | null | undefined>>,
): ScoreResult {
  if (!def.items.length) {
    throw new EngineError('EMPTY_DEFINITION', 'Score definition has no items');
  }

  let score = 0;
  let min = 0;
  let max = 0;
  let complete = true;

  const items: ScoreItemResult[] = def.items.map((item) => {
    const itemValues = item.options.map((option) => option.value);
    min += Math.min(...itemValues);
    max += Math.max(...itemValues);

    const raw = values[item.id];
    if (raw === undefined || raw === null) {
      complete = false;
      return {
        itemId: item.id,
        label: item.label,
        optionId: '',
        value: 0,
        optionLabel: '',
        answered: false,
      };
    }

    let option: ScoreOption | undefined;
    if (typeof raw === 'number') {
      if (!Number.isFinite(raw)) {
        throw new EngineError(
          'INVALID_OPTION',
          `Item "${item.id}" received a non-finite value`,
          String(raw),
        );
      }
      option = item.options.find((candidate) => candidate.value === raw);
    } else if (typeof raw === 'string') {
      option = item.options.find((candidate) => candidate.id === raw);
    } else {
      throw new EngineError(
        'INVALID_OPTION',
        `Item "${item.id}" received an unsupported answer`,
        String(raw),
      );
    }

    if (!option) {
      throw new EngineError(
        'INVALID_OPTION',
        `Value ${String(raw)} is not a valid option for item "${item.id}"`,
        item.id,
      );
    }

    score += option.value;
    return {
      itemId: item.id,
      label: item.label,
      optionId: option.id,
      value: option.value,
      optionLabel: option.label,
      answered: true,
    };
  });

  const band = def.interpretation.find(
    (candidate) => score >= candidate.min && score <= candidate.max,
  );

  return { score, min, max, complete, items, band };
}
