import { loadAllStoredEvents } from '../data/storage';

function buildCSV(rows) {
  const headers = [
    'Date', 'Time', 'Line', 'Process', 'Worker ID',
    'Product Code', 'Item Name', 'DEF Code',
    'Defect Count', 'Inspection Qty', 'Note',
  ];
  const dataRows = rows.map(e => {
    const dt = new Date(e.created_at);
    return [
      dt.toLocaleDateString('en-CA'),
      dt.toLocaleTimeString('en-US', { hour12: false }),
      e.line, e.process || '', e.worker_id || '',
      e.product_code || '', e.item_name || '',
      e.defect_code || '', e.defect_count ?? '',
      e.inspection_qty ?? '', e.note || '',
    ];
  });
  return [headers, ...dataRows]
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\r\n');
}

function download(csv, filename) {
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportButton({ events }) {
  const today = new Date().toISOString().slice(0, 10);

  function handleExportToday() {
    if (!events.length) { alert('No entries to export for today.'); return; }
    download(buildCSV(events), `qc_${today}.csv`);
  }

  function handleExportAll() {
    const all = loadAllStoredEvents();
    if (!all.length) { alert('No stored entries found.'); return; }
    download(buildCSV(all), `qc_all_${today}.csv`);
  }

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      <button className="btn-export" onClick={handleExportToday} disabled={!events.length}>
        Export Today
      </button>
      <button className="btn-export" onClick={handleExportAll} style={{ opacity: 0.8 }}>
        All Data
      </button>
    </div>
  );
}
