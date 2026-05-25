import { useState } from 'react';

export default function EntryList({ events, onEdit, onDelete }) {
  const [expandedNote, setExpandedNote] = useState(null);

  if (!events.length) {
    return (
      <div style={{ padding: '12px 14px', color: '#8A93A0', fontSize: 12 }}>
        오늘 입력된 항목이 없습니다.
      </div>
    );
  }

  return (
    <div className="entry-list">
      <div className="entry-list-header">오늘 입력 내역 ({events.length}건)</div>
      {events.map(evt => (
        <div key={evt.event_id} className="entry-item">
          <div className="entry-meta">
            <span className="entry-time">
              {new Date(evt.created_at).toLocaleTimeString('ko-KR', { hour12: false })}
            </span>
            <span className="line-badge">{evt.line}</span>
            {evt.defect_code && <span className="alert-def">{evt.defect_code}</span>}
          </div>
          <div className="entry-details">
            <span>불량 {evt.defect_count}개</span>
            <span>검사 {evt.inspection_qty}개</span>
            {evt.product_code && <span>{evt.product_code}</span>}
          </div>
          <div className="entry-actions">
            <button className="btn-edit" onClick={() => onEdit(evt)}>수정</button>
            <button
              className={`btn-memo${evt.note ? ' has-note' : ''}`}
              onClick={() => {
                if (evt.note) setExpandedNote(expandedNote === evt.event_id ? null : evt.event_id);
              }}
            >
              메모
            </button>
            <button
              className="btn-delete"
              onClick={() => {
                if (window.confirm(`삭제하시겠습니까?\n${evt.line} · ${evt.defect_code}`)) {
                  onDelete(evt.event_id);
                }
              }}
            >
              삭제
            </button>
          </div>
          {expandedNote === evt.event_id && evt.note && (
            <div className="entry-note">{evt.note}</div>
          )}
        </div>
      ))}
    </div>
  );
}
