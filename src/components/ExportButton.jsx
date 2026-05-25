import { loadAllStoredEvents } from '../data/storage';

function buildCSV(rows) {
  const headers = [
    '날짜', '시간', '라인', '공정', '작업자ID',
    '제품코드', '품명', '불량코드',
    '불량수', '검사수량', '비고',
  ];
  const dataRows = rows.map(e => {
    const dt = new Date(e.created_at);
    return [
      dt.toLocaleDateString('en-CA'),
      dt.toLocaleTimeString('ko-KR', { hour12: false }),
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
    if (!events.length) { alert('오늘 입력된 데이터가 없습니다.'); return; }
    download(buildCSV(events), `qc_${today}.csv`);
  }

  function handleExportAll() {
    const all = loadAllStoredEvents();
    if (!all.length) { alert('저장된 데이터가 없습니다.'); return; }
    download(buildCSV(all), `qc_전체_${today}.csv`);
  }

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      <button className="btn-export" onClick={handleExportToday} disabled={!events.length}>
        오늘 내보내기
      </button>
      <button className="btn-export" onClick={handleExportAll} style={{ opacity: 0.8 }}>
        전체 내보내기
      </button>
    </div>
  );
}
