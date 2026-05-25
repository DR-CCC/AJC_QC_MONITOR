import { useT } from '../data/i18n';

function rateClass(rate) {
  if (rate >= 0.08) return 'crit';
  if (rate >= 0.05) return 'warn';
  return 'ok';
}

export default function LineStatusTable({ lines, floor, onSelectLine }) {
  const t = useT();
  const showFloor2Notice =
    floor === 'floor2' && lines.every(row => !row.hasFgqcRecord && !row.hasLiveData);

  return (
    <div className="panel" style={{ flex: 1 }}>
      <div className="panel-title">
        {t('lineTableTitle')}
        <span className="panel-title-note">{t('lineTableSub')}</span>
      </div>

      {showFloor2Notice && (
        <div className="floor2-empty">
          <strong>{t('floor2Notice')}</strong>
          <br />
          {t('floor2NoticeHint')}
        </div>
      )}

      <table className="line-table">
        <thead>
          <tr>
            <th>{t('colLine')}</th>
            <th>{t('colFgqcSource')}</th>
            <th>{t('colProduct')}</th>
            <th>{t('colItem')}</th>
            <th style={{ textAlign: 'right' }}>{t('colInspected')}</th>
            <th style={{ textAlign: 'right' }}>{t('colDefective')}</th>
            <th>{t('colRate')}</th>
            {onSelectLine && <th style={{ width: 52 }} />}
          </tr>
        </thead>
        <tbody>
          {lines.map(row => {
            const cls = rateClass(row.defect_rate);
            const barWidth = Math.min(row.defect_rate * 500, 100);
            const noData = !row.hasFgqcRecord && !row.hasLiveData;

            return (
              <tr key={row.line} className={noData ? 'no-record' : ''}>
                <td>
                  <span className="line-badge">{row.line}</span>
                  {row.hasLiveData && <span className="live-badge">{t('liveTag')}</span>}
                </td>
                <td style={{ color: '#718096', fontSize: 11 }}>
                  {row.sourceLines?.length ? row.sourceLines.join(', ') : '-'}
                </td>
                <td style={{ color: '#a0aec0' }}>{row.product_code || '-'}</td>
                <td>
                  {noData ? (
                    <span style={{ color: '#4a5568', fontStyle: 'italic' }}>
                      {t('noFgqcRecord')}
                    </span>
                  ) : (
                    row.item_name || '-'
                  )}
                  {!noData && row.color ? (
                    <span style={{ color: '#4a5568', fontSize: 11 }}> - {row.color}</span>
                  ) : null}
                </td>
                <td style={{ fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
                  {noData ? '-' : row.inspection_qty.toLocaleString()}
                </td>
                <td
                  style={{
                    fontVariantNumeric: 'tabular-nums',
                    textAlign: 'right',
                    color: noData ? '#4a5568' : '#fc8181',
                  }}
                >
                  {noData ? '-' : row.defective_qty}
                </td>
                <td>
                  {noData ? (
                    <span style={{ color: '#4a5568' }}>-</span>
                  ) : (
                    <div className="rate-cell">
                      <span
                        className={`rate-${cls}`}
                        style={{ minWidth: 48, fontVariantNumeric: 'tabular-nums' }}
                      >
                        {(row.defect_rate * 100).toFixed(2)}%
                      </span>
                      <div className="rate-bar-bg">
                        <div
                          className={`rate-bar-fill bar-${cls}`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  )}
                </td>
                {onSelectLine && (
                  <td>
                    <button
                      className="qc-open-btn"
                      onClick={() => onSelectLine(row.line)}
                    >
                      QC →
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
