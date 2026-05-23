import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useT } from '../data/i18n';

const SAFETY_CODES = new Set(['DEF-39', 'DEF-40', 'DEF-41', 'DEF-42', 'DEF-43']);

function buildChartData(lines, catalog) {
  const counts = {};
  for (const row of lines) {
    for (const [code, count] of Object.entries(row.defects || {})) {
      counts[code] = (counts[code] || 0) + count;
    }
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)
    .map(([code, count]) => {
      const meta = catalog.find(item => item.code === code);
      return { code, count, name: meta ? meta.name : code, safety: SAFETY_CODES.has(code) };
    });
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;

  return (
    <div
      style={{
        background: '#1a1f2e',
        border: '1px solid #2d3748',
        borderRadius: 5,
        padding: '8px 12px',
        fontSize: 12,
      }}
    >
      <div style={{ fontWeight: 700, color: '#e2e8f0' }}>{data.code}</div>
      <div style={{ color: '#a0aec0' }}>{data.name}</div>
      <div style={{ color: data.safety ? '#fc8181' : '#68d391', marginTop: 4 }}>
        Count: {data.count.toLocaleString()}
      </div>
      {data.safety && (
        <div style={{ color: '#fc8181', fontSize: 10, marginTop: 2 }}>
          SAFETY / REGULATION
        </div>
      )}
    </div>
  );
}

export default function DefectChart({ lines, catalog }) {
  const t = useT();
  const data = buildChartData(lines, catalog);

  return (
    <div className="panel chart-wrap">
      <div className="panel-title">
        {t('chartTitle')}
        <span style={{ marginLeft: 12, fontSize: 10, color: '#fc8181' }}>
          Safety: {t('chartSafety')}
        </span>
        <span style={{ marginLeft: 8, fontSize: 10, color: '#4299e1' }}>
          Normal: {t('chartNormal')}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 18, right: 8, left: -20, bottom: 24 }}>
          <XAxis
            dataKey="code"
            tick={{ fill: '#718096', fontSize: 10 }}
            angle={-40}
            textAnchor="end"
            interval={0}
          />
          <YAxis tick={{ fill: '#718096', fontSize: 10 }} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Bar dataKey="count" radius={[3, 3, 0, 0]}>
            <LabelList
              dataKey="count"
              position="top"
              style={{ fill: '#718096', fontSize: 9 }}
              formatter={value => (value > 0 ? value.toLocaleString() : '')}
            />
            {data.map(entry => (
              <Cell key={entry.code} fill={entry.safety ? '#e53e3e' : '#4299e1'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
