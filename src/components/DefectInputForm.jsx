import { useMemo, useState } from 'react';
import { SEWING_LINES } from '../data/lineMaster';
import { PROCESS_OPTIONS } from '../data/processMaster';
import { useT } from '../data/i18n';
import {
  loadCustomDefCodes, saveCustomDefCodes,
  loadCustomProcesses, saveCustomProcesses,
  nextCustomDefNumber,
} from '../data/customStorage';

const EMPTY = {
  line: '', process: '', worker_id: '', product_code: '',
  item_name: '', defect_code: '', defect_count: '', inspection_qty: '', note: '',
};

function eventToForm(evt) {
  return {
    line: evt.line || '',
    process: evt.process || '',
    worker_id: evt.worker_id || '',
    product_code: evt.product_code || '',
    item_name: evt.item_name || '',
    defect_code: evt.defect_code || '',
    defect_count: String(evt.defect_count ?? ''),
    inspection_qty: String(evt.inspection_qty ?? ''),
    note: evt.note || '',
  };
}

export default function DefectInputForm({ catalog, extraEvents, onSubmit, editingEvent, onUpdate, onCancelEdit }) {
  const t = useT();
  const [form, setForm] = useState(() => editingEvent ? eventToForm(editingEvent) : EMPTY);
  const [toast, setToast] = useState('');
  const [customDefCodes, setCustomDefCodes] = useState(() => loadCustomDefCodes());
  const [customProcesses, setCustomProcesses] = useState(() => loadCustomProcesses());
  const [showAddDef, setShowAddDef] = useState(false);
  const [newDefName, setNewDefName] = useState('');

  const allDefCodes = useMemo(() => [...catalog, ...customDefCodes], [catalog, customDefCodes]);
  const allProcesses = useMemo(() => [...PROCESS_OPTIONS, ...customProcesses], [customProcesses]);

  const productCodes = useMemo(
    () => [...new Set((extraEvents || []).map(e => e.product_code).filter(Boolean))],
    [extraEvents],
  );
  const itemNames = useMemo(
    () => [...new Set((extraEvents || []).map(e => e.item_name).filter(Boolean))],
    [extraEvents],
  );

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function handleAddDefCode() {
    const name = newDefName.trim();
    if (!name) return;
    const num = nextCustomDefNumber(catalog, customDefCodes);
    const newCode = { code: `DEF-${num}`, name, category: 'custom', category_label: 'Custom' };
    const updated = [...customDefCodes, newCode];
    setCustomDefCodes(updated);
    saveCustomDefCodes(updated);
    set('defect_code', newCode.code);
    setNewDefName('');
    setShowAddDef(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (form.process && !allProcesses.includes(form.process)) {
      const updated = [...customProcesses, form.process];
      setCustomProcesses(updated);
      saveCustomProcesses(updated);
    }
    if (editingEvent) {
      const updated = {
        ...editingEvent,
        line: form.line,
        process: form.process,
        worker_id: form.worker_id,
        product_code: form.product_code,
        item_name: form.item_name,
        defect_code: form.defect_code,
        defect_count: Number(form.defect_count),
        inspection_qty: Number(form.inspection_qty),
        note: form.note,
        updated_at: new Date().toISOString(),
      };
      onUpdate?.(updated);
      setToast(`Updated: ${form.line} · ${form.defect_code}`);
    } else {
      const event = {
        event_id: `evt-${Date.now()}`,
        created_at: new Date().toISOString(),
        line: form.line,
        process: form.process,
        worker_id: form.worker_id,
        product_code: form.product_code,
        item_name: form.item_name,
        defect_code: form.defect_code,
        defect_count: Number(form.defect_count),
        inspection_qty: Number(form.inspection_qty),
        note: form.note,
      };
      onSubmit?.(event);
      setToast(`${form.line} · ${form.defect_code}`);
      setForm(EMPTY);
    }
    setTimeout(() => setToast(''), 3000);
  }

  const isEditing = !!editingEvent;
  const nextDefNum = nextCustomDefNumber(catalog, customDefCodes);

  return (
    <div>
      {isEditing && (
        <div className="edit-banner">
          <span>
            수정 중: {editingEvent.line} · {editingEvent.defect_code}
            {' '}
            <span style={{ color: 'var(--text-3)' }}>
              ({new Date(editingEvent.created_at).toLocaleTimeString('ko-KR', { hour12: false })})
            </span>
          </span>
          <button className="btn-cancel-edit" type="button" onClick={onCancelEdit}>취소</button>
        </div>
      )}
      <form className="input-form-panel" onSubmit={handleSubmit} autoComplete="off">
        <div className="panel-title" style={{ marginBottom: 12 }}>{t('formTitle')}</div>
        <div className="form-grid">
          <div className="form-field">
            <label>{t('formLine')}</label>
            <select value={form.line} onChange={e => set('line', e.target.value)} required>
              <option value="">{t('formSelectLine')}</option>
              {SEWING_LINES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>{t('formProcess')}</label>
            <input
              type="text"
              list="process-datalist"
              value={form.process}
              onChange={e => set('process', e.target.value)}
              placeholder={t('formSelectProcess')}
              required
            />
            <datalist id="process-datalist">
              {allProcesses.map(p => <option key={p} value={p} />)}
            </datalist>
          </div>
          <div className="form-field">
            <label>{t('formWorkerId')}</label>
            <input type="text" placeholder="W-1024" value={form.worker_id}
              onChange={e => set('worker_id', e.target.value)} required />
          </div>
          <div className="form-field">
            <label>{t('formProductCode')}</label>
            <input type="text" list="product-datalist" placeholder="PKD-R1" value={form.product_code}
              onChange={e => set('product_code', e.target.value)} required />
            <datalist id="product-datalist">
              {productCodes.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div className="form-field full">
            <label>{t('formItemName')}</label>
            <input type="text" list="item-datalist" placeholder="SLING 10L" value={form.item_name}
              onChange={e => set('item_name', e.target.value)} />
            <datalist id="item-datalist">
              {itemNames.map(n => <option key={n} value={n} />)}
            </datalist>
          </div>
          <div className="form-field full">
            <label>{t('formDefCode')}</label>
            <div className="def-code-row">
              <select value={form.defect_code} onChange={e => set('defect_code', e.target.value)} required>
                <option value="">{t('formSelectDef')}</option>
                {allDefCodes.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.code} · {c.name} [{c.category_label || c.category}]
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn-add-code"
                onClick={() => setShowAddDef(prev => !prev)}
              >
                {showAddDef ? '✕' : '+ DEF'}
              </button>
            </div>
            {showAddDef && (
              <div className="add-custom-def">
                <input
                  type="text"
                  placeholder={`Name for DEF-${nextDefNum}…`}
                  value={newDefName}
                  onChange={e => setNewDefName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddDefCode(); } }}
                />
                <button type="button" className="btn-add-code-confirm" onClick={handleAddDefCode}>
                  Add DEF-{nextDefNum}
                </button>
              </div>
            )}
          </div>
          <div className="form-field">
            <label>{t('formDefCount')}</label>
            <input type="number" min="1" placeholder="1" value={form.defect_count}
              onChange={e => set('defect_count', e.target.value)} required />
          </div>
          <div className="form-field">
            <label>{t('formInspQty')}</label>
            <input type="number" min="1" placeholder="50" value={form.inspection_qty}
              onChange={e => set('inspection_qty', e.target.value)} required />
          </div>
          <div className="form-field full">
            <label>{t('formNote')}</label>
            <textarea placeholder="…" value={form.note}
              onChange={e => set('note', e.target.value)} />
          </div>
        </div>
        <button type="submit" className="btn-submit">
          {isEditing ? '수정 완료' : t('formSubmit')}
        </button>
        {toast && <div className="toast">✓ {toast}</div>}
      </form>
    </div>
  );
}
