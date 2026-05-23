const THRESHOLD_KEY = 'qc_thresholds';

export const DEFAULT_THRESHOLDS = { warningRate: 0.05, criticalRate: 0.08 };

export function loadThresholds() {
  try {
    const stored = JSON.parse(localStorage.getItem(THRESHOLD_KEY));
    if (
      stored &&
      typeof stored.warningRate === 'number' &&
      typeof stored.criticalRate === 'number'
    ) return stored;
  } catch {}
  return { ...DEFAULT_THRESHOLDS };
}

export function saveThresholds(thresholds) {
  localStorage.setItem(THRESHOLD_KEY, JSON.stringify(thresholds));
}
