import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Badge,
  Button,
  Card,
  DemoBadge,
  InlineAlert,
  SectionTitle,
  StatusBadge,
} from '../../ui/kit';
import {
  AlertTriangleIcon,
  CheckIcon,
  RotateIcon,
} from '../../ui/icons';
import { validateAlgorithm, walkAlgorithm } from '../../engine';
import { demoAlgorithm, plannedAlgorithms } from '../../content';

const DEMO_ISSUES = validateAlgorithm(demoAlgorithm);

const TONE_MAP = {
  ok: 'ok',
  warn: 'warn',
  danger: 'danger',
  info: 'info',
  neutral: 'info',
} as const;

export function AlgorithmsPanel() {
  const { t } = useTranslation();
  const [choices, setChoices] = useState<string[]>([]);
  const outcome = walkAlgorithm(demoAlgorithm, choices);

  return (
    <div className="space-y-4">
      <InlineAlert
        tone="warn"
        title={t('clinical.phaseTitle')}
        icon={<AlertTriangleIcon width={20} height={20} />}
      >
        {t('clinical.phaseBody')}
      </InlineAlert>

      {DEMO_ISSUES.length > 0 ? (
        <InlineAlert tone="danger" title="Content validation">
          <ul className="list-inside list-disc">
            {DEMO_ISSUES.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </InlineAlert>
      ) : null}

      <Card className="p-4 sm:p-5">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <DemoBadge />
          <StatusBadge status={demoAlgorithm.status} />
          <Badge tone="neutral">v{demoAlgorithm.version}</Badge>
        </div>
        <h2 className="text-lg font-extrabold">{demoAlgorithm.name}</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">
          {t('clinical.algoDemoNote')}
        </p>

        <div className="mt-4">
          {outcome.status === 'error' ? (
            <InlineAlert tone="danger" title={t('clinical.algoError')}>
              {outcome.error.message}
            </InlineAlert>
          ) : outcome.status === 'question' ? (
            <div>
              <h3 className="text-base font-extrabold">{outcome.node.prompt}</h3>
              {outcome.node.help ? (
                <p className="mt-1 text-xs text-[var(--muted)]">{outcome.node.help}</p>
              ) : null}
              <div className="mt-3 space-y-2">
                {(outcome.node.options ?? []).map((option) => (
                  <Button
                    key={option.id}
                    variant="secondary"
                    className="w-full justify-start text-start"
                    onClick={() => setChoices((previous) => [...previous, option.id])}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <InlineAlert
              tone={TONE_MAP[outcome.node.result?.tone ?? 'info']}
              title={t('clinical.algoResult')}
              icon={<CheckIcon width={20} height={20} />}
            >
              <p className="text-base font-extrabold">
                {outcome.node.result?.label ?? outcome.node.prompt}
              </p>
              {outcome.node.result?.actions.length ? (
                <ul className="mt-2 list-inside list-disc space-y-1">
                  {outcome.node.result.actions.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
              ) : null}
            </InlineAlert>
          )}
        </div>

        {outcome.path.length > 0 ? (
          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
              {t('clinical.algoPath')}
            </p>
            <ol className="mt-2 space-y-2">
              {outcome.path.map((step, index) => (
                <li key={`${step.nodeId}-${index}`} className="flex gap-2 text-xs">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--surface-3)] font-bold">
                    {index + 1}
                  </span>
                  <span className="leading-5">
                    <span className="text-[var(--muted)]">{step.prompt}</span>
                    <span className="mx-1">→</span>
                    <span className="font-bold">{step.choiceLabel}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        <div className="mt-4 flex items-center justify-between gap-2">
          <p className="text-[11px] text-[var(--muted)]">
            source: {demoAlgorithm.sourceId}
          </p>
          <Button variant="ghost" onClick={() => setChoices([])}>
            <RotateIcon width={16} height={16} />
            {t('clinical.algoRestart')}
          </Button>
        </div>
      </Card>

      <section>
        <SectionTitle>{t('clinical.pendingTitle')}</SectionTitle>
        <p className="mb-3 text-sm leading-6 text-[var(--muted)]">
          {t('clinical.pendingBody')}
        </p>
        <ul className="space-y-2">
          {plannedAlgorithms.map((algorithm) => (
            <li
              key={algorithm.id}
              className="card-flat flex items-center justify-between gap-2 px-3 py-3"
            >
              <span className="flex min-w-0 items-center gap-2">
                <Badge tone={algorithm.priority === 1 ? 'warn' : 'neutral'}>
                  P{algorithm.priority}
                </Badge>
                <span className="truncate text-sm font-semibold">{algorithm.name}</span>
              </span>
              <StatusBadge status="pending" />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
