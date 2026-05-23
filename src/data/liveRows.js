export function eventsToLiveRows(events) {
  const rowsByLine = new Map();

  for (const event of events) {
    const line = (event.line || '').toUpperCase();
    if (!line) continue;

    const existing = rowsByLine.get(line) || {
      date: event.created_at?.split('T')[0] || '',
      line,
      brand: '',
      product_code: event.product_code || '',
      item_name: event.item_name || '',
      color: '',
      inspection_qty: 0,
      defective_qty: 0,
      defect_rate: 0,
      defects: {},
    };

    existing.product_code ||= event.product_code || '';
    existing.item_name ||= event.item_name || '';
    existing.inspection_qty += Number(event.inspection_qty || 0);
    existing.defective_qty += Number(event.defect_count || 0);

    if (event.defect_code) {
      existing.defects[event.defect_code] =
        (existing.defects[event.defect_code] || 0) + Number(event.defect_count || 0);
    }

    rowsByLine.set(line, existing);
  }

  return Array.from(rowsByLine.values()).map(row => ({
    ...row,
    defect_rate: row.inspection_qty > 0 ? row.defective_qty / row.inspection_qty : 0,
  }));
}
