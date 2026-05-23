const CUSTOM_DEF_KEY = 'qc_custom_defcodes';
const CUSTOM_PROCESS_KEY = 'qc_custom_processes';

export function loadCustomDefCodes() {
  try { return JSON.parse(localStorage.getItem(CUSTOM_DEF_KEY) || '[]'); }
  catch { return []; }
}

export function saveCustomDefCodes(codes) {
  localStorage.setItem(CUSTOM_DEF_KEY, JSON.stringify(codes));
}

export function loadCustomProcesses() {
  try { return JSON.parse(localStorage.getItem(CUSTOM_PROCESS_KEY) || '[]'); }
  catch { return []; }
}

export function saveCustomProcesses(procs) {
  localStorage.setItem(CUSTOM_PROCESS_KEY, JSON.stringify(procs));
}

export function nextCustomDefNumber(catalog, customCodes) {
  const all = [...catalog, ...customCodes];
  const nums = all
    .map(c => c.code?.match(/^DEF-(\d+)$/)?.[1])
    .filter(Boolean)
    .map(Number);
  return nums.length > 0 ? Math.max(...nums) + 1 : 1;
}
