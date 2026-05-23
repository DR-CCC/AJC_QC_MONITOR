import { useEffect, useMemo, useState } from 'react';
import SummaryCards from './components/SummaryCards';
import AlertPanel from './components/AlertPanel';
import LineStatusTable from './components/LineStatusTable';
import DefectChart from './components/DefectChart';
import DefectInputForm from './components/DefectInputForm';
import DataCoveragePanel from './components/DataCoveragePanel';
import EntryList from './components/EntryList';
import ExportButton from './components/ExportButton';
import { fetchDashboardPayload, fetchDefectCatalog } from './data/mockApi';
import {
  buildExpectedLineRows,
  buildFloorSummary,
  filterAlertsByFloor,
  filterLinesByFloor,
  getCoverageStats,
  FLOOR2_LINES,
  normalizeLineGroup,
} from './data/lineMaster';
import { buildLiveAlerts } from './data/alertUtils';
import { eventsToLiveRows } from './data/liveRows';
import { loadEventsForDate, saveEventsForDate } from './data/storage';
import { loadThresholds, saveThresholds } from './data/thresholdStorage';
import ThresholdSettings from './components/ThresholdSettings';

const TAB_DASHBOARD = 'dashboard';
const TAB_INPUT = 'input';
const FLOOR_ALL = 'all';
const FLOOR_1 = 'floor1';
const FLOOR_2 = 'floor2';

function useTime() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export default function App() {
  const [sideTab, setSideTab] = useState(TAB_DASHBOARD);
  const [floor, setFloor] = useState(FLOOR_ALL);
  const [catalogData, setCatalogData] = useState([]);
  const [extraEvents, setExtraEvents] = useState(() => loadEventsForDate());
  const [editingEvent, setEditingEvent] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [thresholds, setThresholds] = useState(() => loadThresholds());
  const now = useTime();

  const demoLoading = isDemoMode && !dashboardData;

  useEffect(() => {
    fetchDefectCatalog().then(setCatalogData).catch(console.error);
  }, []);

  useEffect(() => {
    saveEventsForDate(extraEvents);
  }, [extraEvents]);

  useEffect(() => {
    if (isDemoMode && !dashboardData) {
      fetchDashboardPayload('full')
        .then(setDashboardData)
        .catch(console.error);
    }
  }, [isDemoMode, dashboardData]);

  const rawLines = useMemo(
    () => (isDemoMode ? dashboardData?.lines : null) || [],
    [isDemoMode, dashboardData],
  );
  const fgqcAlerts = useMemo(
    () => (isDemoMode ? dashboardData?.alerts : null) || [],
    [isDemoMode, dashboardData],
  );
  const fgqcSummary = useMemo(
    () => (isDemoMode ? dashboardData?.summary : null) || null,
    [isDemoMode, dashboardData],
  );

  const liveRows = useMemo(() => eventsToLiveRows(extraEvents), [extraEvents]);
  const liveAlerts = useMemo(() => buildLiveAlerts(liveRows, catalogData, thresholds), [catalogData, liveRows, thresholds]);
  const allAlerts = useMemo(() => [...liveAlerts, ...fgqcAlerts], [liveAlerts, fgqcAlerts]);

  const displayLines = useMemo(
    () => filterLinesByFloor(buildExpectedLineRows(rawLines, liveRows), floor),
    [floor, liveRows, rawLines],
  );

  const chartLines = useMemo(
    () => filterLinesByFloor([...rawLines, ...liveRows], floor),
    [floor, rawLines, liveRows],
  );

  const visibleAlerts = useMemo(
    () => filterAlertsByFloor(allAlerts, floor),
    [allAlerts, floor],
  );

  const summary = useMemo(
    () => buildFloorSummary(rawLines, liveRows, floor, fgqcSummary),
    [rawLines, liveRows, floor, fgqcSummary],
  );

  const coverageStats = useMemo(
    () => isDemoMode ? getCoverageStats(rawLines) : null,
    [isDemoMode, rawLines],
  );

  const hasFloor2Data = useMemo(
    () => liveRows.some(r => FLOOR2_LINES.has(normalizeLineGroup(r.line))),
    [liveRows],
  );

  const criticalCount = visibleAlerts.filter(a => a.severity === 'critical').length;
  const warnCount = visibleAlerts.filter(a => a.severity === 'warning').length;

  function handleNewEvent(event) {
    setExtraEvents(prev => [event, ...prev]);
    setEditingEvent(null);
    setSideTab(TAB_DASHBOARD);
  }

  function handleEditEvent(updatedEvent) {
    setExtraEvents(prev =>
      prev.map(e => e.event_id === updatedEvent.event_id ? updatedEvent : e),
    );
    setEditingEvent(null);
  }

  function handleDeleteEvent(eventId) {
    setExtraEvents(prev => prev.filter(e => e.event_id !== eventId));
  }

  function startEdit(event) {
    setEditingEvent(event);
    setSideTab(TAB_INPUT);
  }

  return (
    <div className="app">
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="live-dot" />
          <h1>AJS QC Monitor</h1>
          <span className={`badge${isDemoMode ? ' badge-demo' : ''}`}>
            {isDemoMode ? '2025 Demo Data' : 'Live Entry Mode'}
          </span>
        </div>
        <div className="header-right">
          {criticalCount > 0 && (
            <span style={{ fontSize: 12, color: '#fc8181', fontWeight: 700 }}>
              ● {criticalCount} CRITICAL
            </span>
          )}
          {warnCount > 0 && (
            <span style={{ fontSize: 12, color: '#f6ad55', fontWeight: 600 }}>
              ▲ {warnCount} WARNING
            </span>
          )}
          <ThresholdSettings thresholds={thresholds} onSave={setThresholds} />
          <button
            className={`demo-toggle${isDemoMode ? ' active' : ''}`}
            onClick={() => setIsDemoMode(prev => !prev)}
          >
            {isDemoMode ? '● Demo ON' : 'Demo OFF'}
          </button>
          <ExportButton events={extraEvents} />
          <span className="header-time">
            {now.toLocaleTimeString('en-US', { hour12: false })}
          </span>
        </div>
      </header>

      <div className="floor-filter">
        {[
          [FLOOR_ALL, 'All Lines'],
          [FLOOR_1, 'Floor 1 · L1-L8'],
          [FLOOR_2, 'Floor 2 · L21-L29'],
        ].map(([value, label]) => (
          <button
            key={value}
            className={`floor-btn${floor === value ? ' active' : ''}`}
            onClick={() => setFloor(value)}
          >
            {value === FLOOR_2 && hasFloor2Data ? `${label} ●` : label}
          </button>
        ))}
      </div>

      {isDemoMode && demoLoading && (
        <div className="loading-state">Loading 2025 demo data...</div>
      )}

      <div className="app-body">
        <div className="main-col">
          <SummaryCards summary={summary} alertCount={visibleAlerts.length} />
          <DataCoveragePanel liveRows={liveRows} coverageStats={coverageStats} />
          <DefectChart lines={chartLines} catalog={catalogData} />
          <LineStatusTable lines={displayLines} floor={floor} />
        </div>

        <div className="side-col">
          <div className="tab-bar">
            <button
              className={`tab-btn${sideTab === TAB_DASHBOARD ? ' active' : ''}`}
              onClick={() => setSideTab(TAB_DASHBOARD)}
            >
              Alerts
              {visibleAlerts.length > 0 && (
                <span className="alert-count-badge">{visibleAlerts.length}</span>
              )}
            </button>
            <button
              className={`tab-btn${sideTab === TAB_INPUT ? ' active' : ''}`}
              onClick={() => setSideTab(TAB_INPUT)}
            >
              + New Entry
            </button>
          </div>

          {sideTab === TAB_DASHBOARD && (
            <>
              {extraEvents.length > 0 && (
                <div style={{ padding: '7px 14px', borderBottom: '1px solid #2d3748', fontSize: 11, color: '#68d391' }}>
                  {extraEvents.length} event{extraEvents.length !== 1 ? 's' : ''} logged today
                </div>
              )}
              <AlertPanel alerts={visibleAlerts} />
            </>
          )}

          {sideTab === TAB_INPUT && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ overflowY: 'auto', flex: 1 }}>
                <DefectInputForm
                  key={editingEvent?.event_id ?? 'new'}
                  catalog={catalogData}
                  extraEvents={extraEvents}
                  onSubmit={handleNewEvent}
                  editingEvent={editingEvent}
                  onUpdate={handleEditEvent}
                  onCancelEdit={() => setEditingEvent(null)}
                />
                <EntryList
                  events={extraEvents}
                  onEdit={startEdit}
                  onDelete={handleDeleteEvent}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
