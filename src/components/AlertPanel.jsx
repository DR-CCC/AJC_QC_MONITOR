import { useState, useMemo } from 'react';
import { useT } from '../data/i18n';
import { sortLinesNatural } from '../data/lineMaster';

export default function AlertPanel({ alerts }) {
  const t = useT();
  const [severityFilter, setSeverityFilter] = useState('all');
  const [lineFilter, setLineFilter] = useState('');
  const [defFilter, setDefFilter] = useState('');

  const uniqueLines = useMemo(
    () => sortLinesNatural([...new Set(alerts.map(a => a.line))]),
    [alerts]
  );
  const uniqueDefs = useMemo(
    () => [...new Set(alerts.map(a => a.defect_code).filter(Boolean))].sort(),
    [alerts]
  );

  const sorted = useMemo(() => {
    return [...alerts]
      .filter(a => severityFilter === 'all' || a.severity === severityFilter)
      .filter(a => !lineFilter || a.line === lineFilter)
      .filter(a => !defFilter || a.defect_code === defFilter)
      .sort((a, b) => {
        if (a.isLive && !b.isLive) return -1;
        if (!a.isLive && b.isLive) return 1;
        return (b.created_at || '').localeCompare(a.created_at || '');
      });
  }, [alerts, severityFilter, lineFilter, defFilter]);

  const visible = sorted.slice(0, 200);
  const hiddenCount = Math.max(sorted.length - 200, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div className="alert-filters">
        <div className="filter-row">
          {[
            ['all', t('filterAll')],
            ['critical', t('filterCritical')],
            ['warning', t('filterWarning')],
          ].map(([val, label]) => (
            <button
              key={val}
              className={`filter-pill${severityFilter === val ? ` active-${val}` : ''}`}
              onClick={() => setSeverityFilter(val)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="filter-row">
          <select className="filter-select" value={lineFilter} onChange={e => setLineFilter(e.target.value)}>
            <option value="">{t('filterAllLines')}</option>
            {uniqueLines.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <select className="filter-select" value={defFilter} onChange={e => setDefFilter(e.target.value)}>
            <option value="">{t('filterAllDefs')}</option>
            {uniqueDefs.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div className="threshold-legend">
        임계값 — <span className="warn">경고: 불량률 5% 이상 또는 동일 코드 5회 이상</span>
        {' · '}
        <span className="crit">위험: 불량률 8% 이상 또는 안전 불량 (DEF-39~43)</span>
      </div>

      <div className="alert-list">
        {sorted.length === 0 && (
          <div style={{ color: '#8A93A0', textAlign: 'center', padding: '20px 0' }}>{t('noAlerts')}</div>
        )}
        {hiddenCount > 0 && (
          <div className="alert-overflow-note">
            {t('alertOverflow', { shown: visible.length, total: sorted.length, hidden: hiddenCount })}
          </div>
        )}
        {visible.map((alert, i) => (
          <div key={`${alert.alert_id}-${i}`} className={`alert-item ${alert.severity}${alert.isLive ? ' live' : ''}`}>
            {alert.isLive && <div className="live-tag">{t('liveAlertNote')}</div>}
            <div className="alert-header">
              <span className={`alert-badge ${alert.severity}`}>
                {alert.severity === 'critical' ? t('critical') : t('warning')}
              </span>
              <span className="alert-line">{alert.line}</span>
              {alert.defect_code && <span className="alert-def">{alert.defect_code}</span>}
            </div>
            <div className="alert-msg">{alert.message}</div>
            <div className="alert-meta">
              <span>{t('valLabel')}: <strong style={{ color: 'var(--text)' }}>{
                alert.metric === 'defect_rate'
                  ? `${(alert.current_value * 100).toFixed(2)}%`
                  : alert.current_value
              }</strong></span>
              <span>{t('thresholdLabel')}: <strong style={{ color: 'var(--text)' }}>{
                alert.metric === 'defect_rate'
                  ? `${(alert.threshold * 100).toFixed(2)}%`
                  : alert.threshold
              }</strong></span>
              <span style={{ marginLeft: 'auto', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 90 }}>
                {alert.item_name}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
