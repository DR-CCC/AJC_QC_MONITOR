import { useT } from '../data/i18n';

export default function SummaryCards({ summary, alertCount }) {
  const t = useT();
  const { total_inspection_qty, total_defective_qty, defect_rate } = summary;
  const rateClass = defect_rate >= 0.05 ? 'rate' : 'ok';

  return (
    <div className="panel">
      <div className="panel-title">{t('summaryTitle')}</div>
      <div className="summary-grid">
        <div className="summary-card ok">
          <div className="label">{t('cardInspected')}</div>
          <div className="value">{total_inspection_qty.toLocaleString()}</div>
          <div className="sub">{t('cardUnitsTotal')}</div>
        </div>
        <div className="summary-card">
          <div className="label">{t('cardDefective')}</div>
          <div className="value" style={{ color: 'var(--bad)' }}>{total_defective_qty.toLocaleString()}</div>
          <div className="sub">{t('cardUnitsTotal')}</div>
        </div>
        <div className={`summary-card ${rateClass}`}>
          <div className="label">{t('cardDefectRate')}</div>
          <div className="value">{(defect_rate * 100).toFixed(2)}%</div>
          <div className="sub">{t('cardOverall')}</div>
        </div>
        <div className="summary-card alerts">
          <div className="label">{t('cardAlerts')}</div>
          <div className="value">{alertCount}</div>
          <div className="sub">{t('cardOpenIssues')}</div>
        </div>
      </div>
    </div>
  );
}
