import { useMemo, useRef, useState } from 'react';
import { loadLineSession, saveLineSession } from '../data/lineSessionStorage';

const PROCESSES = Array.from({ length: 17 }, (_, i) => `공정 ${i + 1}`);

function defNumFromCode(code) {
  if (!code) return '';
  const m = (code || '').match(/DEF-(\d+)/i);
  return m ? String(parseInt(m[1], 10)) : '';
}

function defCodeFromNum(num) {
  const n = parseInt(num, 10);
  if (!n || n < 1) return null;
  return `DEF-${String(n).padStart(2, '0')}`;
}

const EMPTY_FORM = { process: PROCESSES[0], defCodeNum: '', inspection_qty: '', defect_count: '' };

function formFromEvent(evt) {
  return {
    process: PROCESSES.includes(evt.process) ? evt.process : PROCESSES[0],
    defCodeNum: defNumFromCode(evt.defect_code),
    inspection_qty: String(evt.inspection_qty || ''),
    defect_count: String(evt.defect_count ?? ''),
  };
}

const CAT_COLORS = {
  Stitching: '#2F5D6E',
  Material:  '#3D7A4A',
  Assembly:  '#A85E16',
  Finishing: '#776F62',
  Safety:    '#A33028',
};

export default function LineQCPage({
  line, allEvents, onAddEvent, onUpdateEvent, onDeleteEvent,
  catalog, lineAlerts, fromDashboard, onBack, now,
}) {
  const [session, setSession] = useState(() => loadLineSession(line));
  const [editingSession, setEditingSession] = useState(() => {
    const s = loadLineSession(line);
    return !s.product_code;
  });
  const [sessionDraft, setSessionDraft] = useState(() => loadLineSession(line));

  const [editingProcessWorkers, setEditingProcessWorkers] = useState(false);
  const [processWorkersDraft, setProcessWorkersDraft] = useState(
    () => ({ ...loadLineSession(line).processWorkers }),
  );

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showDefList, setShowDefList] = useState(false);
  const [toast, setToast] = useState('');
  const defListRef = useRef(null);

  const lineEvents = useMemo(
    () => allEvents
      .filter(e => (e.line || '').toUpperCase() === line.toUpperCase())
      .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [allEvents, line],
  );

  const resolvedDef = useMemo(() => {
    const code = defCodeFromNum(form.defCodeNum);
    if (!code) return null;
    return catalog.find(c => c.code === code) || null;
  }, [form.defCodeNum, catalog]);

  const defError = useMemo(() => {
    if (!form.defCodeNum) return null;
    const n = parseInt(form.defCodeNum, 10);
    if (isNaN(n) || n < 1 || n > 99) return '1~99 사이 숫자를 입력하세요';
    if (!resolvedDef) return `DEF-${String(n).padStart(2, '0')} 코드 없음`;
    return null;
  }, [form.defCodeNum, resolvedDef]);

  const catalogByCategory = useMemo(() => {
    const groups = {};
    for (const c of catalog) {
      const cat = c.category_label || c.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(c);
    }
    return groups;
  }, [catalog]);

  // 현재 공정의 담당 작업자 (공정별 배정 우선, 없으면 세션 기본값)
  const currentProcessWorker = session.processWorkers?.[form.process] || session.worker_id || '';

  // 배정된 공정 목록 (뷰 모드용)
  const assignedEntries = useMemo(
    () => PROCESSES
      .map(p => [p, session.processWorkers?.[p] || ''])
      .filter(([, w]) => w),
    [session.processWorkers],
  );

  const criticalCount = lineAlerts.filter(a => a.severity === 'critical').length;
  const warnCount = lineAlerts.filter(a => a.severity === 'warning').length;

  function setF(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function openSessionEdit() {
    setSessionDraft({ ...session });
    setEditingSession(true);
  }

  function saveSession() {
    const updated = { ...sessionDraft, processWorkers: session.processWorkers || {} };
    setSession(updated);
    saveLineSession(line, updated);
    setEditingSession(false);
  }

  function openProcessWorkersEdit() {
    setProcessWorkersDraft({ ...(session.processWorkers || {}) });
    setEditingProcessWorkers(true);
    setEditingSession(false);
  }

  function saveProcessWorkers() {
    const cleaned = Object.fromEntries(
      Object.entries(processWorkersDraft).filter(([, v]) => v.trim()),
    );
    const updated = { ...session, processWorkers: cleaned };
    setSession(updated);
    saveLineSession(line, updated);
    setEditingProcessWorkers(false);
  }

  function selectDefCode(code) {
    setF('defCodeNum', defNumFromCode(code));
    setShowDefList(false);
  }

  function startEdit(evt) {
    setEditingEvent(evt);
    setForm(formFromEvent(evt));
    setEditingSession(false);
    setEditingProcessWorkers(false);
    setShowDefList(false);
  }

  function cancelEdit() {
    setEditingEvent(null);
    setForm(EMPTY_FORM);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!resolvedDef || defError || !form.defect_count) return;

    const processWorker = session.processWorkers?.[form.process] || session.worker_id;

    if (editingEvent) {
      onUpdateEvent?.({
        ...editingEvent,
        process: form.process,
        defect_code: resolvedDef.code,
        defect_count: Number(form.defect_count),
        inspection_qty: Number(form.inspection_qty) || 0,
        updated_at: new Date().toISOString(),
      });
      setToast(`✓ 수정: ${resolvedDef.code} × ${form.defect_count}`);
      setEditingEvent(null);
      setForm(EMPTY_FORM);
    } else {
      onAddEvent({
        event_id: `evt-${Date.now()}`,
        created_at: new Date().toISOString(),
        line,
        process: form.process,
        worker_id: processWorker,
        product_code: session.product_code,
        item_name: session.item_name,
        defect_code: resolvedDef.code,
        defect_count: Number(form.defect_count),
        inspection_qty: Number(form.inspection_qty) || 0,
      });
      setForm(prev => ({ ...prev, defect_count: '', inspection_qty: '' }));
      setToast(`✓ ${resolvedDef.code} × ${form.defect_count}`);
    }
    setTimeout(() => setToast(''), 2500);
  }

  return (
    <div className="line-qc-page">
      <div className="lqc-header">
        <button className="lqc-back-btn" onClick={onBack}>
          {fromDashboard ? '← 생산 대시보드' : '← 전체 현황'}
        </button>
        <div className="lqc-title">
          <span className="lqc-line-badge-big">{line}</span>
          <span className="lqc-title-label">QC 모니터</span>
        </div>
        <div className="lqc-header-right">
          {criticalCount > 0 && (
            <span className="lqc-severity-badge crit">위험 {criticalCount}건</span>
          )}
          {warnCount > 0 && (
            <span className="lqc-severity-badge warn">경고 {warnCount}건</span>
          )}
          {criticalCount === 0 && warnCount === 0 && (
            <span className="lqc-severity-badge ok">정상</span>
          )}
          <span className="header-time">
            {now.toLocaleTimeString('en-US', { hour12: false })}
          </span>
        </div>
      </div>

      <div className="lqc-body">

        {/* Session info */}
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
                <span className="chip-lbl">기본 작업자</span>
                {session.worker_id || <span className="chip-empty">미설정</span>}
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
                <label>기본 작업자 ID</label>
                <input type="text" placeholder="W-1024" value={sessionDraft.worker_id}
                  onChange={e => setSessionDraft(p => ({ ...p, worker_id: e.target.value }))} />
              </div>
              <div className="lqc-session-actions">
                <button className="lqc-session-cancel" type="button" onClick={() => setEditingSession(false)}>취소</button>
                <button className="lqc-session-save" type="button" onClick={saveSession}>저장</button>
              </div>
            </div>
          )}
        </div>

        {/* 공정별 작업자 배정 */}
        <div className="lqc-session-card lqc-pw-card">
          <div className="lqc-session-hdr">
            <span className="lqc-section-label">공정별 작업자 배정</span>
            {!editingProcessWorkers && (
              <button className="lqc-session-edit-btn" onClick={openProcessWorkersEdit}>편집</button>
            )}
          </div>

          {!editingProcessWorkers ? (
            assignedEntries.length === 0 ? (
              <div className="lqc-pw-empty">배정된 작업자 없음 — 편집으로 공정별 작업자를 입력하세요</div>
            ) : (
              <div className="lqc-pw-chips">
                {assignedEntries.map(([proc, worker]) => (
                  <span key={proc} className="lqc-pw-chip">
                    <span className="lqc-pw-proc">{proc}</span>
                    <span className="lqc-pw-worker">{worker}</span>
                  </span>
                ))}
              </div>
            )
          ) : (
            <div>
              <div className="lqc-pw-grid">
                {PROCESSES.map(proc => (
                  <div key={proc} className="lqc-pw-row">
                    <label className="lqc-pw-label">{proc}</label>
                    <input
                      className="lqc-pw-input"
                      type="text"
                      placeholder="W-..."
                      value={processWorkersDraft[proc] || ''}
                      onChange={e => setProcessWorkersDraft(prev => ({ ...prev, [proc]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
              <div className="lqc-session-actions" style={{ marginTop: 12 }}>
                <button className="lqc-session-cancel" type="button" onClick={() => setEditingProcessWorkers(false)}>취소</button>
                <button className="lqc-session-save" type="button" onClick={saveProcessWorkers}>저장</button>
              </div>
            </div>
          )}
        </div>

        {/* Line alerts */}
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

        {/* Quick entry / edit form */}
        <div className="lqc-entry-card">
          {editingEvent ? (
            <div className="lqc-edit-banner">
              <span>
                수정 중: <strong>{editingEvent.defect_code}</strong> ·{' '}
                {new Date(editingEvent.created_at).toLocaleTimeString('ko-KR', {
                  hour: '2-digit', minute: '2-digit', hour12: false,
                })}
              </span>
              <button className="lqc-cancel-edit" type="button" onClick={cancelEdit}>취소</button>
            </div>
          ) : (
            <div className="lqc-section-label" style={{ marginBottom: 14 }}>불량 입력</div>
          )}

          <form className="lqc-quick-form" onSubmit={handleSubmit} autoComplete="off">

            {/* 공정 + 담당 작업자 힌트 */}
            <div className="lqc-qfield">
              <label>공정</label>
              <select value={form.process} onChange={e => setF('process', e.target.value)}>
                {PROCESSES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <span className="lqc-process-worker-hint">
                담당: <strong>{currentProcessWorker || '—'}</strong>
                {session.processWorkers?.[form.process]
                  ? null
                  : currentProcessWorker
                    ? <span className="lqc-pw-fallback"> (기본값)</span>
                    : null}
              </span>
            </div>

            {/* 불량코드 번호 + 목록 */}
            <div className="lqc-qfield lqc-qfield-def" style={{ position: 'relative' }}>
              <label>불량코드 (번호)</label>
              <div className="lqc-def-row">
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min="1" max="99"
                  placeholder="11"
                  value={form.defCodeNum}
                  onChange={e => setF('defCodeNum', e.target.value)}
                  required
                  className="lqc-defnum-input"
                />
                <div className="lqc-def-preview">
                  {resolvedDef ? (
                    <>
                      <span className="lqc-def-code">{resolvedDef.code}</span>
                      <span className="lqc-def-name">{resolvedDef.name}</span>
                      {resolvedDef.category_label && (
                        <span className="lqc-def-cat">[{resolvedDef.category_label}]</span>
                      )}
                    </>
                  ) : defError ? (
                    <span className="lqc-def-err">{defError}</span>
                  ) : (
                    <span className="lqc-def-hint">번호 입력</span>
                  )}
                </div>
                <button
                  type="button"
                  className={`lqc-deflist-toggle${showDefList ? ' open' : ''}`}
                  onClick={() => setShowDefList(p => !p)}
                  title="코드 목록"
                >
                  {showDefList ? '▲' : '목록 ▼'}
                </button>
              </div>

              {/* DEF 코드 목록 패널 */}
              {showDefList && (
                <div className="lqc-deflist-panel" ref={defListRef}>
                  {Object.entries(catalogByCategory).map(([cat, codes]) => (
                    <div key={cat} className="lqc-deflist-group">
                      <div
                        className="lqc-deflist-cat"
                        style={{ color: CAT_COLORS[cat] || '#776F62' }}
                      >
                        {cat}
                        {cat === 'Safety' && <span style={{ marginLeft: 6, fontSize: 10 }}>⚠ CRITICAL</span>}
                      </div>
                      <div className="lqc-deflist-items">
                        {codes.map(c => (
                          <button
                            key={c.code}
                            type="button"
                            className={`lqc-deflist-item${resolvedDef?.code === c.code ? ' selected' : ''}`}
                            onClick={() => selectDefCode(c.code)}
                          >
                            <span className="ldi-num">{parseInt(c.code.replace('DEF-', ''), 10)}</span>
                            <span className="ldi-name">{c.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 검사수량 */}
            <div className="lqc-qfield lqc-qfield-qty">
              <label>검사수량</label>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                min="0"
                placeholder="0"
                value={form.inspection_qty}
                onChange={e => setF('inspection_qty', e.target.value)}
                className="lqc-qty-input"
              />
            </div>

            {/* 불량수 */}
            <div className="lqc-qfield lqc-qfield-count">
              <label>불량수</label>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                min="1"
                placeholder="0"
                value={form.defect_count}
                onChange={e => setF('defect_count', e.target.value)}
                required
                className="lqc-count-input"
              />
            </div>

            <button
              type="submit"
              className={`lqc-submit-btn${editingEvent ? ' editing' : ''}`}
              disabled={!!defError || !resolvedDef}
            >
              {editingEvent ? '수정 완료' : '등록'}
            </button>
          </form>
          {toast && <div className="lqc-toast">{toast}</div>}
        </div>

        {/* Entry log */}
        <div className="lqc-log-card">
          <div className="lqc-section-label">
            오늘 입력 내역 · {line}
            {lineEvents.length > 0 && (
              <span style={{ marginLeft: 8, color: 'var(--ok)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                {lineEvents.length}건
              </span>
            )}
          </div>
          {lineEvents.length === 0 ? (
            <div className="lqc-empty">아직 입력된 데이터가 없습니다.</div>
          ) : (
            <div className="lqc-log-list">
              {lineEvents.map(e => (
                <div
                  key={e.event_id}
                  className={`lqc-log-row${editingEvent?.event_id === e.event_id ? ' editing' : ''}`}
                >
                  <span className="lqc-log-time">
                    {new Date(e.created_at).toLocaleTimeString('ko-KR', {
                      hour: '2-digit', minute: '2-digit', hour12: false,
                    })}
                  </span>
                  <span className="lqc-log-process">{e.process}</span>
                  <span className="lqc-log-def">{e.defect_code}</span>
                  <span className="lqc-log-count">× {e.defect_count}</span>
                  {Number(e.inspection_qty) > 0 && (
                    <span className="lqc-log-qty">/{Number(e.inspection_qty).toLocaleString()}</span>
                  )}
                  {e.worker_id && (
                    <span className="lqc-log-worker">{e.worker_id}</span>
                  )}
                  <button className="lqc-log-edit" type="button" onClick={() => startEdit(e)}>수정</button>
                  <button className="lqc-log-del" type="button" onClick={() => onDeleteEvent(e.event_id)}>삭제</button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
