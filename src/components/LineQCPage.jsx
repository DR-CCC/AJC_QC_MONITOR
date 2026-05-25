import { useMemo, useState } from 'react';
import { loadLineSession, saveLineSession } from '../data/lineSessionStorage';

const PROCESSES = Array.from({ length: 17 }, (_, i) => `공정 ${i + 1}`);

export default function LineQCPage({
  line, allEvents, onAddEvent, onDeleteEvent,
  catalog, lineAlerts, onBack, now,
}) {
  const [session, setSession] = useState(() => loadLineSession(line));
  const [editingSession, setEditingSession] = useState(() => {
    const s = loadLineSession(line);
    return !s.product_code && !s.inspection_qty;
  });
  const [sessionDraft, setSessionDraft] = useState(() => loadLineSession(line));
  const [form, setForm] = useState({ process: PROCESSES[0], defect_code: '', defect_count: '' });
  const [toast, setToast] = useState('');

  const lineEvents = useMemo(
    () => allEvents
      .filter(e => (e.line || '').toUpperCase() === line.toUpperCase())
      .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [allEvents, line],
  );

  // inspection_qty is committed on the first entry; subsequent entries use 0
  const hasCommittedQty = useMemo(
    () => lineEvents.some(e => Number(e.inspection_qty || 0) > 0),
    [lineEvents],
  );

  const criticalCount = lineAlerts.filter(a => a.severity === 'critical').length;
  const warnCount = lineAlerts.filter(a => a.severity === 'warning').length;

  function openSessionEdit() {
    setSessionDraft({ ...session });
    setEditingSession(true);
  }

  function saveSession() {
    setSession({ ...sessionDraft });
    saveLineSession(line, sessionDraft);
    setEditingSession(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.defect_code || !form.defect_count) return;
    const inspQty = hasCommittedQty ? 0 : Number(session.inspection_qty || 0);
    const event = {
      event_id: `evt-${Date.now()}`,
      created_at: new Date().toISOString(),
      line,
      process: form.process,
      worker_id: session.worker_id,
      product_code: session.product_code,
      item_name: session.item_name,
      defect_code: form.defect_code,
      defect_count: Number(form.defect_count),
      inspection_qty: inspQty,
    };
    onAddEvent(event);
    setForm(prev => ({ ...prev, defect_count: '' }));
    setToast(`✓ ${form.defect_code} × ${form.defect_count}`);
    setTimeout(() => setToast(''), 2500);
  }

  return (
    <div className="line-qc-page">
      <div className="lqc-header">
        <button className="lqc-back-btn" onClick={onBack}>← 전체 현황</button>
        <div className="lqc-title">
          <span className="lqc-line-badge-big">{line}</span>
          <span className="lqc-title-label">QC Monitor</span>
        </div>
        <div className="lqc-header-right">
          {criticalCount > 0 && (
            <span className="lqc-severity-badge crit">● {criticalCount} CRITICAL</span>
          )}
          {warnCount > 0 && (
            <span className="lqc-severity-badge warn">▲ {warnCount} WARNING</span>
          )}
          {criticalCount === 0 && warnCount === 0 && (
            <span className="lqc-severity-badge ok">✓ 정상</span>
          )}
          <span className="header-time">
            {now.toLocaleTimeString('en-US', { hour12: false })}
          </span>
        </div>
      </div>

      <div className="lqc-body">

        {/* Session info card */}
        <div className="lqc-session-card">
          <div className="lqc-session-hdr">
            <span className="lqc-section-label">세션 정보</span>
            {!editingSession && (
              <button className="lqc-session-edit-btn" onClick={openSessionEdit}>수정</button>
            )}
          </div>

          {!editingSession ? (
            <div className="lqc-session-chips">
              <span className="lqc-chip">
                <span className="chip-lbl">제품코드</span>
                {session.product_code || <span className="chip-empty">미설정</span>}
              </span>
              <span className="lqc-chip">
                <span className="chip-lbl">품명</span>
                {session.item_name || <span className="chip-empty">미설정</span>}
              </span>
              <span className="lqc-chip">
                <span className="chip-lbl">작업자</span>
                {session.worker_id || <span className="chip-empty">미설정</span>}
              </span>
              <span className="lqc-chip">
                <span className="chip-lbl">검사수량</span>
                {session.inspection_qty
                  ? <>{Number(session.inspection_qty).toLocaleString()}{hasCommittedQty && <span className="chip-committed"> ✓반영</span>}</>
                  : <span className="chip-empty">미설정</span>
                }
              </span>
            </div>
          ) : (
            <div className="lqc-session-form">
              <div className="lqc-srow">
                <label>제품코드</label>
                <input type="text" placeholder="PKD-R1" value={sessionDraft.product_code}
                  onChange={e => setSessionDraft(p => ({ ...p, product_code: e.target.value }))} />
              </div>
              <div className="lqc-srow">
                <label>품명</label>
                <input type="text" placeholder="SLING 10L" value={sessionDraft.item_name}
                  onChange={e => setSessionDraft(p => ({ ...p, item_name: e.target.value }))} />
              </div>
              <div className="lqc-srow">
                <label>작업자 ID</label>
                <input type="text" placeholder="W-1024" value={sessionDraft.worker_id}
                  onChange={e => setSessionDraft(p => ({ ...p, worker_id: e.target.value }))} />
              </div>
              <div className="lqc-srow">
                <label>검사 수량</label>
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="240"
                  value={sessionDraft.inspection_qty}
                  onChange={e => setSessionDraft(p => ({ ...p, inspection_qty: e.target.value }))}
                />
              </div>
              <div className="lqc-session-actions">
                <button className="lqc-session-cancel" type="button" onClick={() => setEditingSession(false)}>취소</button>
                <button className="lqc-session-save" type="button" onClick={saveSession}>저장</button>
              </div>
            </div>
          )}
        </div>

        {/* Line-specific alerts */}
        {lineAlerts.length > 0 && (
          <div className="lqc-alerts-section">
            {lineAlerts.map(a => (
              <div key={a.alert_id} className={`lqc-alert-row ${a.severity}`}>
                <span className={`alert-badge ${a.severity}`}>{a.severity.toUpperCase()}</span>
                <span className="lqc-alert-msg">{a.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Quick entry form */}
        <div className="lqc-entry-card">
          <div className="lqc-section-label" style={{ marginBottom: 14 }}>불량 입력</div>
          <form className="lqc-quick-form" onSubmit={handleSubmit} autoComplete="off">
            <div className="lqc-qfield">
              <label>공정</label>
              <select
                value={form.process}
                onChange={e => setForm(p => ({ ...p, process: e.target.value }))}
              >
                {PROCESSES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="lqc-qfield lqc-qfield-def">
              <label>불량 코드</label>
              <select
                value={form.defect_code}
                onChange={e => setForm(p => ({ ...p, defect_code: e.target.value }))}
                required
              >
                <option value="">선택</option>
                {catalog.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.code} · {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="lqc-qfield lqc-qfield-count">
              <label>불량 수</label>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                min="1"
                placeholder="0"
                value={form.defect_count}
                onChange={e => setForm(p => ({ ...p, defect_count: e.target.value }))}
                required
                className="lqc-count-input"
              />
            </div>
            <button type="submit" className="lqc-submit-btn">+ 입력</button>
          </form>
          {toast && <div className="lqc-toast">{toast}</div>}
        </div>

        {/* Today's entry log */}
        <div className="lqc-log-card">
          <div className="lqc-section-label">
            오늘 입력 내역 · {line}
            {lineEvents.length > 0 && (
              <span style={{ marginLeft: 8, color: '#68d391', fontWeight: 700 }}>
                {lineEvents.length}건
              </span>
            )}
          </div>
          {lineEvents.length === 0 ? (
            <div className="lqc-empty">아직 입력된 데이터가 없습니다.</div>
          ) : (
            <div className="lqc-log-list">
              {lineEvents.map(e => (
                <div key={e.event_id} className="lqc-log-row">
                  <span className="lqc-log-time">
                    {new Date(e.created_at).toLocaleTimeString('ko-KR', {
                      hour: '2-digit', minute: '2-digit', hour12: false,
                    })}
                  </span>
                  <span className="lqc-log-process">{e.process}</span>
                  <span className="lqc-log-def">{e.defect_code}</span>
                  <span className="lqc-log-count">× {e.defect_count}</span>
                  {Number(e.inspection_qty) > 0 && (
                    <span className="lqc-log-qty">검사 {Number(e.inspection_qty).toLocaleString()}</span>
                  )}
                  <button
                    className="lqc-log-del"
                    type="button"
                    onClick={() => onDeleteEvent(e.event_id)}
                    aria-label="삭제"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
