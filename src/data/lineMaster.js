export const SEWING_LINES = [
  'L1','L2','L3','L4','L5','L6','L7','L8',
  'L21','L22','L23','L24','L25','L26','L27','L28','L29',
];

export const FLOOR1_LINES = new Set(['L1','L2','L3','L4','L5','L6','L7','L8']);
export const FLOOR2_LINES = new Set(['L21','L22','L23','L24','L25','L26','L27','L28','L29']);

export const FGQC_LINE_ALIASES = {
  L3: ['L3-A', 'L3-C'],
  L4: ['L4-A', 'L4-B'],
  L8: ['L8-A', 'L8-B'],
};

export const KNOWN_NON_SEWING_FGQC_LINES = [
  'L9','L10','L10-A','L10-B',
  'L11','L11-A','L11-B','L11-C','L11-D',
  'L12','L13','LINBOUND','LIQC','LMTD','LPKD',
];

export function normalizeLineGroup(line) {
  const upper = (line || '').toUpperCase();
  for (const [base, aliases] of Object.entries(FGQC_LINE_ALIASES)) {
    if (upper === base || aliases.includes(upper)) return base;
  }
  return upper;
}

export function filterLinesByFloor(lines, floor) {
  if (floor === 'floor1') return lines.filter(r => FLOOR1_LINES.has(normalizeLineGroup(r.line)));
  if (floor === 'floor2') return lines.filter(r => FLOOR2_LINES.has(normalizeLineGroup(r.line)));
  return lines;
}

export function buildFloorSummary(fgqcRows, liveRows, floor, fullFgqcSummary) {
  if (floor === 'all') {
    if (fullFgqcSummary) return fullFgqcSummary;
    const rows = [...fgqcRows, ...liveRows];
    const total_inspection_qty = rows.reduce((s, r) => s + (Number(r.inspection_qty) || 0), 0);
    const total_defective_qty = rows.reduce((s, r) => s + (Number(r.defective_qty) || 0), 0);
    return {
      total_inspection_qty,
      total_defective_qty,
      defect_rate: total_inspection_qty > 0 ? total_defective_qty / total_inspection_qty : 0,
    };
  }
  const targetSet = floor === 'floor1' ? FLOOR1_LINES : FLOOR2_LINES;
  // Floor 2 has no historical FGQC — only live rows contribute
  const fgqcContrib = floor === 'floor1'
    ? fgqcRows.filter(r => targetSet.has(normalizeLineGroup(r.line)))
    : [];
  const liveContrib = liveRows.filter(r => targetSet.has(normalizeLineGroup(r.line)));
  const rows = [...fgqcContrib, ...liveContrib];
  const total_inspection_qty = rows.reduce((s, r) => s + (Number(r.inspection_qty) || 0), 0);
  const total_defective_qty = rows.reduce((s, r) => s + (Number(r.defective_qty) || 0), 0);
  return {
    total_inspection_qty,
    total_defective_qty,
    defect_rate: total_inspection_qty > 0 ? total_defective_qty / total_inspection_qty : 0,
  };
}

export function filterAlertsByFloor(alerts, floor) {
  if (floor === 'floor1') return alerts.filter(a => FLOOR1_LINES.has(normalizeLineGroup(a.line)));
  if (floor === 'floor2') return alerts.filter(a => FLOOR2_LINES.has(normalizeLineGroup(a.line)));
  return alerts;
}

export function buildExpectedLineRows(observedRows, liveRows = []) {
  const rowsByGroup = new Map();

  const addRow = (row, isLive) => {
    const group = normalizeLineGroup(row.line);
    const existing = rowsByGroup.get(group) || {
      line: group,
      sourceLines: new Set(),
      product_code: '',
      item_name: '',
      color: '',
      inspection_qty: 0,
      defective_qty: 0,
      defect_rate: 0,
      defects: {},
      hasFgqcRecord: false,
      hasLiveData: false,
    };
    existing.sourceLines.add(row.line.toUpperCase());
    existing.product_code ||= row.product_code;
    if (!existing.hasFgqcRecord) existing.item_name = row.item_name || existing.item_name;
    existing.color ||= row.color;
    existing.inspection_qty += Number(row.inspection_qty || 0);
    existing.defective_qty += Number(row.defective_qty || 0);
    if (isLive) existing.hasLiveData = true;
    else existing.hasFgqcRecord = true;
    for (const [code, count] of Object.entries(row.defects || {})) {
      existing.defects[code] = (existing.defects[code] || 0) + Number(count || 0);
    }
    rowsByGroup.set(group, existing);
  };

  for (const row of observedRows) addRow(row, false);
  for (const row of liveRows) addRow(row, true);

  return SEWING_LINES.map(line => {
    const row = rowsByGroup.get(line);
    if (!row) {
      return {
        line, sourceLines: [], product_code: '', item_name: '', color: '',
        inspection_qty: 0, defective_qty: 0, defect_rate: 0, defects: {},
        hasFgqcRecord: false, hasLiveData: false,
      };
    }
    return {
      ...row,
      sourceLines: Array.from(row.sourceLines).sort(),
      defect_rate: row.inspection_qty > 0 ? row.defective_qty / row.inspection_qty : 0,
    };
  });
}

export function getCoverageStats(rows) {
  const groupedObserved = new Set(rows.map(r => normalizeLineGroup(r.line)));
  const missingSewingLines = SEWING_LINES.filter(l => !groupedObserved.has(l));
  const observed = new Set(rows.map(r => r.line));
  const extraFgqcLines = Array.from(observed)
    .filter(l => !SEWING_LINES.includes(normalizeLineGroup(l)))
    .sort();
  const suspectLines = extraFgqcLines.filter(l => !/^L\d/.test(l));
  return {
    expectedSewingLineCount: SEWING_LINES.length,
    observedLineCount: groupedObserved.size,
    coveredSewingLineCount: SEWING_LINES.length - missingSewingLines.length,
    missingSewingLines,
    extraFgqcLines,
    suspectLines,
  };
}

const numericCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

export function sortLinesNatural(lines) {
  return [...lines].sort((a, b) => numericCollator.compare(a, b));
}

export function getLiveActivityStats(liveRows) {
  const activeSet = new Set(liveRows.map(r => normalizeLineGroup(r.line)));
  const activeLines = sortLinesNatural(SEWING_LINES.filter(l => activeSet.has(l)));
  const pendingLines = SEWING_LINES.filter(l => !activeSet.has(l));
  return {
    totalLines: SEWING_LINES.length,
    activeLines,
    pendingLines,
  };
}
