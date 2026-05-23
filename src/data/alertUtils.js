const DEFAULT_WARNING_RATE = 0.05;
const DEFAULT_CRITICAL_RATE = 0.08;
const REPEATED_DEFECT_COUNT = 5;
const SAFETY_CODES = new Set(['DEF-39', 'DEF-40', 'DEF-41', 'DEF-42', 'DEF-43']);

export function buildLiveLineStats(events) {
  const map = {};
  for (const evt of events) {
    if (!map[evt.line]) {
      map[evt.line] = {
        line: evt.line,
        product_code: evt.product_code || '',
        item_name: evt.item_name || '',
        color: '',
        date: evt.created_at?.split('T')[0] || '',
        inspection_qty: 0,
        defective_qty: 0,
        defects: {},
      };
    }
    const s = map[evt.line];
    s.inspection_qty += Number(evt.inspection_qty) || 0;
    s.defective_qty += Number(evt.defect_count) || 0;
    if (evt.defect_code) {
      s.defects[evt.defect_code] = (s.defects[evt.defect_code] || 0) + (Number(evt.defect_count) || 0);
    }
  }
  return Object.values(map).map(row => ({
    ...row,
    defect_rate: row.inspection_qty > 0 ? row.defective_qty / row.inspection_qty : 0,
  }));
}

export function buildLiveAlerts(liveStats, catalog, thresholds) {
  const WARNING_RATE = thresholds?.warningRate ?? DEFAULT_WARNING_RATE;
  const CRITICAL_RATE = thresholds?.criticalRate ?? DEFAULT_CRITICAL_RATE;
  const ts = new Date().toISOString();
  const alerts = [];
  const defName = code => catalog.find(c => c.code === code)?.name || code;
  const criticalRateLines = new Set();

  for (const row of liveStats) {
    const rate = row.defect_rate;
    if (rate >= CRITICAL_RATE) {
      criticalRateLines.add(row.line);
      alerts.push({
        alert_id: `live-${row.line}-defect_rate`,
        created_at: ts,
        severity: 'critical',
        line: row.line,
        product_code: row.product_code,
        item_name: row.item_name,
        metric: 'defect_rate',
        defect_code: null,
        current_value: Math.round(rate * 10000) / 10000,
        threshold: CRITICAL_RATE,
        message: `${row.line} live defect rate ${(rate * 100).toFixed(2)}% exceeded critical threshold ${(CRITICAL_RATE * 100).toFixed(2)}%.`,
        isLive: true,
      });
    } else if (rate >= WARNING_RATE) {
      alerts.push({
        alert_id: `live-${row.line}-defect_rate`,
        created_at: ts,
        severity: 'warning',
        line: row.line,
        product_code: row.product_code,
        item_name: row.item_name,
        metric: 'defect_rate',
        defect_code: null,
        current_value: Math.round(rate * 10000) / 10000,
        threshold: WARNING_RATE,
        message: `${row.line} live defect rate ${(rate * 100).toFixed(2)}% exceeded threshold ${(WARNING_RATE * 100).toFixed(2)}%.`,
        isLive: true,
      });
    }
    for (const [code, count] of Object.entries(row.defects || {})) {
      if (SAFETY_CODES.has(code) && count > 0) {
        alerts.push({
          alert_id: `live-${row.line}-${code}`,
          created_at: ts,
          severity: 'critical',
          line: row.line,
          product_code: row.product_code,
          item_name: row.item_name,
          metric: 'safety_defect',
          defect_code: code,
          current_value: count,
          threshold: 0,
          message: `${row.line} live safety defect ${code} ${defName(code)} count ${count}.`,
          isLive: true,
        });
      } else if (!SAFETY_CODES.has(code) && count >= REPEATED_DEFECT_COUNT && !criticalRateLines.has(row.line)) {
        alerts.push({
          alert_id: `live-${row.line}-${code}`,
          created_at: ts,
          severity: 'warning',
          line: row.line,
          product_code: row.product_code,
          item_name: row.item_name,
          metric: 'repeated_defect',
          defect_code: code,
          current_value: count,
          threshold: REPEATED_DEFECT_COUNT,
          message: `${row.line} live repeated defect ${code} ${defName(code)} count ${count}.`,
          isLive: true,
        });
      }
    }
  }
  return alerts;
}
