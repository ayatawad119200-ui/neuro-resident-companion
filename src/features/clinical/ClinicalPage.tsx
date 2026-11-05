import { useTranslation } from 'react-i18next';
import { navigate } from '../../app/router';
import { PageHeader, Segmented } from '../../ui/kit';
import { ScoresPanel } from './ScoresPanel';
import { AlgorithmsPanel } from './AlgorithmsPanel';

export function ClinicalPage({ tab }: { tab: 'scores' | 'algorithms' }) {
  const { t } = useTranslation();

  return (
    <div>
      <PageHeader title={t('clinical.title')} subtitle={t('clinical.subtitle')} />

      <div className="mb-4 overflow-x-auto">
        <Segmented
          value={tab}
          label={t('clinical.title')}
          onChange={(value) =>
            navigate(value === 'scores' ? '#/clinical/scores' : '#/clinical/algorithms')
          }
          options={[
            { value: 'scores', label: t('clinical.tabScores') },
            { value: 'algorithms', label: t('clinical.tabAlgorithms') },
          ]}
        />
      </div>

      {tab === 'scores' ? <ScoresPanel /> : <AlgorithmsPanel />}
    </div>
  );
}
