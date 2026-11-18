import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Badge,
  Button,
  Card,
  DemoBadge,
  InlineAlert,
  SectionTitle,
  Select,
  StatusBadge,
} from '../../ui/kit';
import { AlertTriangleIcon } from '../../ui/icons';
import {
  calculateScore,
  EngineError,
  type ScoreDef,
  type ScoreResult,
} from '../../engine';
import { clinicalScores, demoScore, plannedScores } from '../../content';

function ScoreCard({ def }: { def: ScoreDef }) {
  const { t } = useTranslation();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const isDemo = def.id === demoScore.id;

  let result: ScoreResult | null = null;
  let error: string | null = null;
  try {
    result = calculateScore(def, answers);
  } catch (caught) {
    error =
      caught instanceof EngineError ? caught.message : t('errors.engine');
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        {isDemo ? <DemoBadge /> : null}
        <StatusBadge status={def.status} />
        <Badge tone="neutral">v{def.version}</Badge>
      </div>
      <h2 className="text-lg font-extrabold">{def.name}</h2>
      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
        {isDemo ? t('clinical.demoNote') : t('clinical.draftSourceNote')}
      </p>

      <div className="mt-4 space-y-4">
        {def.items.map((item, index) => (
          <div key={item.id}>
            <label
              className="field-label"
              htmlFor={`score-${def.id}-${item.id}`}
            >
              {index + 1}. {item.label}
            </label>
            <Select
              id={`score-${def.id}-${item.id}`}
              value={answers[item.id] ?? ''}
              onChange={(event) => {
                const value = event.target.value;
                setAnswers((previous) => {
                  const next = { ...previous };
                  if (value === '') delete next[item.id];
                  else next[item.id] = value;
                  return next;
                });
              }}
            >
              <option value="">—</option>
              {item.options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </Select>
            {item.help ? <p className="field-hint">{item.help}</p> : null}
          </div>
        ))}
      </div>

      {error ? (
        <div className="mt-4">
          <InlineAlert tone="danger" title={t('errors.engine')}>
            {error}
          </InlineAlert>
        </div>
      ) : result ? (
        <div className="mt-4">
          <div className="rounded-xl bg-[var(--surface-2)] p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
              {t('clinical.scoreResult')}
            </p>
            <div className="mt-0.5 flex flex-wrap items-end gap-2">
              <span className="stat text-4xl font-extrabold leading-none">
                {result.score}
              </span>
              <span className="pb-1 text-sm text-[var(--muted)]">
                {t('clinical.scoreMax', { max: result.max })}
              </span>
              {result.band ? (
                <Badge tone={result.band.tone} className="mb-1">
                  {result.band.label}
                </Badge>
              ) : null}
            </div>
            {!result.complete ? (
              <p className="mt-2 text-xs font-semibold text-[var(--warn)]">
                {t('clinical.scoreIncomplete')}
              </p>
            ) : null}
          </div>

          {answeredCount > 0 ? (
            <ul className="mt-3 divide-y divide-[var(--line)] text-xs">
              {result.items
                .filter((item) => item.answered)
                .map((item) => (
                  <li
                    key={item.itemId}
                    className="flex items-start justify-between gap-3 py-1.5"
                  >
                    <span>{item.label}</span>
                    <span className="stat shrink-0 text-end font-bold">
                      {item.optionLabel} ({item.value})
                    </span>
                  </li>
                ))}
            </ul>
          ) : null}

          <div className="mt-3 flex items-center justify-between gap-2">
            <p className="text-[11px] text-[var(--muted)]">
              source: {def.sourceId}
            </p>
            <Button variant="ghost" onClick={() => setAnswers({})}>
              {t('clinical.scoreReset')}
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

export function ScoresPanel() {
  const { t } = useTranslation();
  const pending = plannedScores.filter(
    (score) => !clinicalScores.some((entry) => entry.id === score.id),
  );

  return (
    <div className="space-y-4">
      <InlineAlert
        tone="warn"
        title={t('clinical.phaseTitle')}
        icon={<AlertTriangleIcon width={20} height={20} />}
      >
        {t('clinical.phaseBody')}
      </InlineAlert>

      {clinicalScores.map((def) => (
        <ScoreCard key={def.id} def={def} />
      ))}

      <section className="pt-2">
        <SectionTitle>{t('clinical.demoSectionTitle')}</SectionTitle>
        <p className="mb-3 text-sm leading-6 text-[var(--muted)]">
          {t('clinical.demoSectionBody')}
        </p>
        <ScoreCard def={demoScore} />
      </section>

      <section>
        <SectionTitle>{t('clinical.pendingTitle')}</SectionTitle>
        <p className="mb-3 text-sm leading-6 text-[var(--muted)]">
          {t('clinical.pendingBody')}
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {pending.map((score) => (
            <li
              key={score.id}
              className="card-flat flex items-center justify-between gap-2 px-3 py-3"
            >
              <span className="text-sm font-semibold">{score.name}</span>
              <StatusBadge status="pending" />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
