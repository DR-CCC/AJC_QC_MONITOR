const PREFIX = 'qc_events_';

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function loadEventsForDate(dateStr = todayStr()) {
  try {
    return JSON.parse(localStorage.getItem(PREFIX + dateStr) || '[]');
  } catch {
    return [];
  }
}

export function saveEventsForDate(events, dateStr = todayStr()) {
  localStorage.setItem(PREFIX + dateStr, JSON.stringify(events));
}

export function loadAllStoredDates() {
  const dates = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(PREFIX)) dates.push(key.slice(PREFIX.length));
  }
  return dates.sort();
}

export function loadAllStoredEvents() {
  return loadAllStoredDates().flatMap(d => {
    try {
      return JSON.parse(localStorage.getItem(PREFIX + d) || '[]');
    } catch {
      return [];
    }
  });
}
