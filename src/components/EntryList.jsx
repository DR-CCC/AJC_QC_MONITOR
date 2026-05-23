import { useState } from 'react';

export default function EntryList({ events, onEdit, onDelete }) {
  const [expandedNote, setExpandedNote] = useState(null);

  if (!events.length) {
    return (
      <div style={{ padding: '12px 14px', color: '#4a5568', fontSize: 12 }}>
        No entries logged today.
      </div>
    );
  }

  return (
    <div className="entry-list">
      <div className="entry-list-header">Today&apos;s Entries ({events.length})</div>
      {events.map(evt => (
        <div key={evt.event_id} className="entry-item">
          <div className="entry-meta">
            <span className="entry-time">
              {new Date(evt.created_at).toLocaleTimeString('en-US', { hour12: false })}
            </span>
            <span className="line-badge">{evt.line}</span>
            {evt.defect_code && <span className="alert-def">{evt.defect_code}</span>}
          </div>
          <div className="entry-details">
            <span>&times;{evt.defect_count} defects</span>
            <span>{evt.inspection_qty} inspected</span>
            {evt.product_code && <span>{evt.product_code}</span>}
          </div>
          <div className="entry-actions">
            <button className="btn-edit" onClick={() => onEdit(evt)}>Edit</button>
            <button
              className={`btn-memo${evt.note ? ' has-note' : ''}`}
              onClick={() => {
                if (evt.note) setExpandedNote(expandedNote === evt.event_id ? null : evt.event_id);
              }}
            >
              Memo
            </button>
            <button
              className="btn-delete"
              onClick={() => {
                if (window.confirm(`Delete entry: ${evt.line} · ${evt.defect_code}?`)) {
                  onDelete(evt.event_id);
                }
              }}
            >
              Delete
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
