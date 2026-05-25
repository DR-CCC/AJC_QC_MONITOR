const KEY_PREFIX = 'qc_line_session_';

export const EMPTY_SESSION = {
  product_code: '',
  item_name: '',
  worker_id: '',
};

export function loadLineSession(line) {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY_PREFIX + line));
    if (stored && typeof stored === 'object') return { ...EMPTY_SESSION, ...stored };
  } catch {}
  return { ...EMPTY_SESSION };
}

export function saveLineSession(line, session) {
  localStorage.setItem(KEY_PREFIX + line, JSON.stringify(session));
}
