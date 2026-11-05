import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Badge,
  Button,
  Card,
  DemoBadge,
  Field,
  InlineAlert,
  PageHeader,
  SectionTitle,
  Select,
  StatusBadge,
  TextInput,
} from '../../ui/kit';
import {
  AlertTriangleIcon,
  CheckIcon,
  RotateIcon,
} from '../../ui/icons';
import {
  calculateDose,
  checkInteractions,
  EngineError,
  formatDecimal,
  type DoseResult,
  type HepaticChildPugh,
} from '../../engine';
import {
  demoDoseRule,
  demoDrugs,
  demoInteractions,
  plannedDrugClasses,
} from '../../content';

type InteractionTone = 'danger' | 'warn' | 'neutral';

function interactionTone(severity: 'contraindicated' | 'major' | 'moderate' | 'minor'): InteractionTone {
  if (severity === 'contraindicated' || severity === 'major') return 'danger';
  if (severity === 'moderate') return 'warn';
  return 'neutral';
}

function optionalNumber(value: string): number | null {
  const trimmed = value.trim().replace(',', '.');
  if (!trimmed) return null;
  return Number(trimmed);
}

export function DrugsPage() {
  const { t } = useTranslation();

  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [egfr, setEgfr] = useState('');
  const [hepatic, setHepatic] = useState<HepaticChildPugh>('unknown');
  const [outcome, setOutcome] = useState<
    { result: DoseResult; error?: undefined } | { result?: undefined; error: string } | null
  >(null);

  const [selected, setSelected] = useState<string[]>([]);

  function calculate() {
    try {
      const result = calculateDose(demoDoseRule, {
        weightKg: optionalNumber(weight),
        ageYears: optionalNumber(age),
        egfr: optionalNumber(egfr),
        hepaticChildPugh: hepatic,
      });
      setOutcome({ result });
    } catch (caught) {
      setOutcome({
        error: caught instanceof EngineError ? caught.message : t('errors.engine'),
      });
    }
  }

  function toggleDrug(id: string) {
    setSelected((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id],
    );
  }

  const findings = checkInteractions(selected, demoInteractions);

  return (
    <div>
      <PageHeader title={t('drugs.title')} subtitle={t('drugs.subtitle')} />

      <InlineAlert
        tone="warn"
        title={t('clinical.phaseTitle')}
        icon={<AlertTriangleIcon width={20} height={20} />}
      >
        {t('clinical.phaseBody')}
      </InlineAlert>

      <div className="mt-4 space-y-4">
        <Card className="p-4 sm:p-5">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <DemoBadge />
            <StatusBadge status={demoDoseRule.status} />
            <Badge tone="neutral">v{demoDoseRule.version}</Badge>
          </div>
          <SectionTitle hint={t('drugs.doseRuleHint')}>{t('drugs.doseTitle')}</SectionTitle>
          <p className="mb-4 text-xs leading-5 text-[var(--muted)]">{t('drugs.doseNote')}</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('drugs.doseRule')} htmlFor="dose-rule">
              <Select id="dose-rule" value={demoDoseRule.id} disabled>
                <option value={demoDoseRule.id}>{demoDoseRule.label}</option>
              </Select>
            </Field>

            <Field label={t('drugs.doseWeight')} htmlFor="dose-weight" optional>
              <TextInput
                id="dose-weight"
                type="number"
                inputMode="decimal"
                min={0.5}
                max={400}
                step="any"
                value={weight}
                onChange={(event) => setWeight(event.target.value)}
              />
            </Field>

            <Field label={t('drugs.doseAge')} htmlFor="dose-age" optional>
              <TextInput
                id="dose-age"
                type="number"
                inputMode="decimal"
                min={0}
                max={120}
                step="any"
                value={age}
                onChange={(event) => setAge(event.target.value)}
              />
            </Field>

            <Field label={t('drugs.doseEgfr')} htmlFor="dose-egfr" optional>
              <TextInput
                id="dose-egfr"
                type="number"
                inputMode="decimal"
                min={0}
                max={300}
                step="any"
                value={egfr}
                onChange={(event) => setEgfr(event.target.value)}
              />
            </Field>

            <Field label={t('drugs.doseHepatic')} htmlFor="dose-hepatic" optional>
              <Select
                id="dose-hepatic"
                value={hepatic}
                onChange={(event) =>
                  setHepatic(event.target.value as HepaticChildPugh)
                }
              >
                <option value="unknown">{t('common.unknown')}</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </Select>
            </Field>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="primary" onClick={calculate}>
              {t('drugs.doseCalculate')}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setWeight('');
                setAge('');
                setEgfr('');
                setHepatic('unknown');
                setOutcome(null);
              }}
            >
              <RotateIcon width={16} height={16} />
              {t('common.reset')}
            </Button>
          </div>

          {outcome?.error ? (
            <div className="mt-4">
              <InlineAlert tone="danger" title={t('drugs.doseInvalid')}>
                <p className="mono text-xs">{outcome.error}</p>
              </InlineAlert>
            </div>
          ) : null}

          {outcome?.result ? (
            <div className="mt-4">
              <div className="rounded-xl bg-[var(--surface-2)] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
                  {t('drugs.doseResult')}
                </p>
                <p className="stat mt-0.5 text-4xl font-extrabold">
                  {formatDecimal(outcome.result.dose)}{' '}
                  <span className="text-base font-bold">{outcome.result.unit}</span>
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {outcome.result.capped ? (
                    <Badge tone="warn">{t('drugs.doseCapped')}</Badge>
                  ) : null}
                  {outcome.result.rounded ? (
                    <Badge tone="info">{t('drugs.doseRounded')}</Badge>
                  ) : null}
                </div>
              </div>

              <div className="mt-3">
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
                  {t('drugs.doseSteps')}
                </p>
                <ol className="mono mt-1 space-y-1 rounded-xl border border-[var(--line)] p-3 text-[11px] leading-5">
                  {outcome.result.steps.map((step) => (
                    <li key={step}>• {step}</li>
                  ))}
                </ol>
              </div>

              {outcome.result.warnings.length ? (
                <div className="mt-3">
                  <InlineAlert
                    tone="warn"
                    title={t('drugs.doseWarnings')}
                    icon={<AlertTriangleIcon width={20} height={20} />}
                  >
                    <ul className="list-inside list-disc space-y-1">
                      {outcome.result.warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  </InlineAlert>
                </div>
              ) : null}

              <p className="mt-3 text-[11px] text-[var(--muted)]">
                source: {demoDoseRule.sourceId} · {t('sources.sourceVersion')}{' '}
                {demoDoseRule.version}
              </p>
            </div>
          ) : null}
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <DemoBadge />
            <Badge tone="neutral">v0.0.0</Badge>
          </div>
          <SectionTitle>{t('drugs.interTitle')}</SectionTitle>
          <p className="mb-3 text-xs leading-5 text-[var(--muted)]">
            {t('drugs.interNote')}
          </p>

          <p className="field-label">{t('drugs.interSelect')}</p>
          <div className="flex flex-wrap gap-2">
            {demoDrugs.map((drug) => {
              const active = selected.includes(drug.id);
              return (
                <button
                  key={drug.id}
                  type="button"
                  className={`chip min-h-11 ${
                    active
                      ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]'
                      : ''
                  }`}
                  aria-pressed={active}
                  onClick={() => toggleDrug(drug.id)}
                >
                  {active ? <CheckIcon width={14} height={14} /> : null}
                  {drug.label}
                </button>
              );
            })}
          </div>

          <div className="mt-4">
            {selected.length < 2 ? (
              <p className="text-sm text-[var(--muted)]">{t('drugs.interNeedTwo')}</p>
            ) : findings.length === 0 ? (
              <InlineAlert tone="info">{t('drugs.interNone')}</InlineAlert>
            ) : (
              <>
                <p className="mb-2 text-sm font-bold">
                  {t('drugs.interFound', { n: findings.length })}
                </p>
                <ul className="space-y-2">
                  {findings.map((finding) => {
                    const names = finding.drugs
                      .map(
                        (id) =>
                          demoDrugs.find((drug) => drug.id === id)?.label ?? id,
                      )
                      .join('  +  ');
                    return (
                      <li key={finding.id} className="card-flat p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone={interactionTone(finding.severity)}>
                            {t(`drugs.severity.${finding.severity}`)}
                          </Badge>
                          <span className="text-sm font-bold">{names}</span>
                          <StatusBadge status={finding.status} />
                        </div>
                        {finding.mechanism ? (
                          <p className="mt-2 text-xs leading-5">
                            <span className="font-bold">
                              {t('drugs.interMechanism')}:
                            </span>{' '}
                            {finding.mechanism}
                          </p>
                        ) : null}
                        {finding.management ? (
                          <p className="mt-1 text-xs leading-5">
                            <span className="font-bold">
                              {t('drugs.interManagement')}:
                            </span>{' '}
                            {finding.management}
                          </p>
                        ) : null}
                        <p className="mt-1 text-[11px] text-[var(--muted)]">
                          source: {finding.sourceId} · {finding.version}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        </Card>

        <section>
          <SectionTitle>{t('drugs.plannedTitle')}</SectionTitle>
          <p className="mb-3 text-sm leading-6 text-[var(--muted)]">
            {t('drugs.plannedBody')}
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {plannedDrugClasses.map((drugClass) => (
              <li
                key={drugClass.id}
                className="card-flat flex items-center justify-between gap-2 px-3 py-3"
              >
                <span className="text-sm font-semibold">{drugClass.name}</span>
                <StatusBadge status="pending" />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
