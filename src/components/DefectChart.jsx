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
        background: '#0E1520',
        border: '1px solid #243050',
        borderRadius: 3,
        padding: '8px 12px',
        fontSize: 12,
      }}
    >
      <div style={{ fontWeight: 700, color: '#BED0EA' }}>{data.code}</div>
      <div style={{ color: '#6A8AAE' }}>{data.name}</div>
      <div style={{ color: data.safety ? '#D83A3A' : '#1A90C8', marginTop: 4 }}>
        {data.count.toLocaleString()}건
      </div>
      {data.safety && (
        <div style={{ color: '#D83A3A', fontSize: 10, marginTop: 2, letterSpacing: '0.06em' }}>
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
        <span style={{ marginLeft: 12, fontSize: 10, color: '#D83A3A', letterSpacing: '0.06em' }}>
          SAFETY: {t('chartSafety')}
        </span>
        <span style={{ marginLeft: 8, fontSize: 10, color: '#1A90C8', letterSpacing: '0.06em' }}>
          NORMAL: {t('chartNormal')}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 18, right: 8, left: -20, bottom: 24 }}>
          <XAxis
            dataKey="code"
            tick={{ fill: '#4E6888', fontSize: 10, fontFamily: 'IBM Plex Mono, monospace' }}
            angle={-40}
            textAnchor="end"
            interval={0}
          />
          <YAxis tick={{ fill: '#4E6888', fontSize: 10, fontFamily: 'IBM Plex Mono, monospace' }} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="count" radius={[2, 2, 0, 0]}>
            <LabelList
              dataKey="count"
              position="top"
              style={{ fill: '#4E6888', fontSize: 9 }}
              formatter={value => (value > 0 ? value.toLocaleString() : '')}
            />
            {data.map(entry => (
              <Cell key={entry.code} fill={entry.safety ? '#D83A3A' : '#1A90C8'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
