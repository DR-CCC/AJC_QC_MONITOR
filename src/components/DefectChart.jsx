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
        background: '#FBFAF4',
        border: '1px solid #A9A294',
        borderRadius: 0,
        padding: '8px 12px',
        fontSize: 12,
      }}
    >
      <div style={{ fontWeight: 700, color: '#1A1A18' }}>{data.code}</div>
      <div style={{ color: '#776F62' }}>{data.name}</div>
      <div style={{ color: data.safety ? '#A33028' : '#2F5D6E', marginTop: 4 }}>
        {data.count.toLocaleString()}건
      </div>
      {data.safety && (
        <div style={{ color: '#A33028', fontSize: 10, marginTop: 2, letterSpacing: '0.06em' }}>
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
        <span style={{ marginLeft: 12, fontSize: 10, color: '#A33028', letterSpacing: '0.06em' }}>
          SAFETY: {t('chartSafety')}
        </span>
        <span style={{ marginLeft: 8, fontSize: 10, color: '#2F5D6E', letterSpacing: '0.06em' }}>
          NORMAL: {t('chartNormal')}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 18, right: 8, left: -20, bottom: 24 }}>
          <XAxis
            dataKey="code"
            tick={{ fill: '#776F62', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
            angle={-40}
            textAnchor="end"
            interval={0}
          />
          <YAxis tick={{ fill: '#776F62', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(26,26,24,0.04)' }} />
          <Bar dataKey="count" radius={[0, 0, 0, 0]}>
            <LabelList
              dataKey="count"
              position="top"
              style={{ fill: '#776F62', fontSize: 9 }}
              formatter={value => (value > 0 ? value.toLocaleString() : '')}
            />
            {data.map(entry => (
              <Cell key={entry.code} fill={entry.safety ? '#A33028' : '#2F5D6E'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
