import { useEffect, useRef, useState } from 'react';
import { DEFAULT_THRESHOLDS, saveThresholds } from '../data/thresholdStorage';

export default function ThresholdSettings({ thresholds, onSave }) {
  const [open, setOpen] = useState(false);
  const [warn, setWarn] = useState((thresholds.warningRate * 100).toFixed(1));
  const [crit, setCrit] = useState((thresholds.criticalRate * 100).toFixed(1));
  const [error, setError] = useState('');
  const panelRef = useRef(null);

  useEffect(() => {
    setWarn((thresholds.warningRate * 100).toFixed(1));
    setCrit((thresholds.criticalRate * 100).toFixed(1));
  }, [thresholds]);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  function handleSave() {
    const w = parseFloat(warn);
    const c = parseFloat(crit);
    if (isNaN(w) || isNaN(c) || w <= 0 || c <= 0) {
      setError('0보다 큰 값을 입력하세요.');
      return;
    }
    if (w >= c) {
      setError('WARNING은 CRITICAL보다 낮아야 합니다.');
      return;
    }
    const next = { warningRate: w / 100, criticalRate: c / 100 };
    saveThresholds(next);
    onSave(next);
    setError('');
    setOpen(false);
  }

  function handleReset() {
    setWarn((DEFAULT_THRESHOLDS.warningRate * 100).toFixed(1));
    setCrit((DEFAULT_THRESHOLDS.criticalRate * 100).toFixed(1));
    setError('');
  }

  const isModified =
    thresholds.warningRate !== DEFAULT_THRESHOLDS.warningRate ||
    thresholds.criticalRate !== DEFAULT_THRESHOLDS.criticalRate;

  return (
    <div style={{ position: 'relative' }} ref={panelRef}>
      <button
        className={`threshold-btn${isModified ? ' modified' : ''}`}
        onClick={() => setOpen(p => !p)}
        title="Alert threshold settings"
      >
        ⚙ {isModified
          ? `${(thresholds.warningRate * 100).toFixed(0)}% / ${(thresholds.criticalRate * 100).toFixed(0)}%`
          : 'Threshold'}
      </button>

      {open && (
        <div className="threshold-panel">
          <div className="threshold-panel-title">Alert Thresholds</div>
          <div className="threshold-row">
            <label className="threshold-label warn-label">WARNING ≥</label>
            <input
              type="number"
              className="threshold-input"
              value={warn}
              min="0.1"
              max="99"
              step="0.5"
              onChange={e => { setWarn(e.target.value); setError(''); }}
            />
            <span className="threshold-unit">%</span>
          </div>
          <div className="threshold-row">
            <label className="threshold-label crit-label">CRITICAL ≥</label>
            <input
              type="number"
              className="threshold-input"
              value={crit}
              min="0.1"
              max="99"
              step="0.5"
              onChange={e => { setCrit(e.target.value); setError(''); }}
            />
            <span className="threshold-unit">%</span>
          </div>
          {error && <div className="threshold-error">{error}</div>}
          <div className="threshold-actions">
            <button className="threshold-btn-reset" onClick={handleReset}>기본값</button>
            <button className="threshold-btn-save" onClick={handleSave}>저장</button>
          </div>
        </div>
      )}
    </div>
  );
}
