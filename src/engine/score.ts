import { EngineError, type ScoreBand, type ScoreDef } from './types';

export interface ScoreItemResult {
  itemId: string;
  label: string;
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

/**
 * Generic score calculator (FR-302). All item values, weights and bands come
 * from the ScoreDef content — nothing clinical lives in this file.
 *
 * Missing answers contribute 0 to the running total but mark the result as
 * incomplete, so the UI can refuse to present it as final.
 */
export function calculateScore(
  def: ScoreDef,
  values: Readonly<Record<string, number | null | undefined>>,
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
        value: 0,
        optionLabel: '',
        answered: false,
      };
    }

    if (typeof raw !== 'number' || !Number.isFinite(raw)) {
      throw new EngineError(
        'INVALID_OPTION',
        `Item "${item.id}" received a non-numeric value`,
        String(raw),
      );
    }

    const option = item.options.find((candidate) => candidate.value === raw);
    if (!option) {
      throw new EngineError(
        'INVALID_OPTION',
        `Value ${raw} is not a valid option for item "${item.id}"`,
        item.id,
      );
    }

    score += option.value;
    return {
      itemId: item.id,
      label: item.label,
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
