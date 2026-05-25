import { getLiveActivityStats } from '../data/lineMaster';

export default function DataCoveragePanel({ liveRows, coverageStats }) {
  if (coverageStats) {
    return (
      <div className="panel coverage-panel">
        <div className="panel-title">
          FGQC Line Coverage
          <span className="panel-title-note">2025 Demo Data</span>
        </div>
        <div className="coverage-grid">
          <div className="coverage-metric">
            <span>Expected</span>
            <strong>{coverageStats.expectedSewingLineCount}</strong>
          </div>
          <div className="coverage-metric ok">
            <span>Covered</span>
            <strong>{coverageStats.coveredSewingLineCount}</strong>
          </div>
          <div className="coverage-metric">
            <span>Observed</span>
            <strong>{coverageStats.observedLineCount}</strong>
          </div>
          <div className="coverage-metric warn">
            <span>Missing</span>
            <strong>{coverageStats.missingSewingLines.length}</strong>
          </div>
        </div>
        <div className="coverage-lists">
          <div>
            <span className="coverage-label">Missing lines</span>
            <p>{coverageStats.missingSewingLines.length ? coverageStats.missingSewingLines.join(', ') : 'None'}</p>
          </div>
          <div>
            <span className="coverage-label">
              Non-sewing FGQC ({coverageStats.extraFgqcLines.length})
              {coverageStats.suspectLines?.length > 0 && (
                <span style={{ color: 'var(--warn)', marginLeft: 6 }}>⚠ check typos</span>
              )}
            </span>
            <p>{coverageStats.extraFgqcLines.length ? coverageStats.extraFgqcLines.join(', ') : 'None'}</p>
          </div>
        </div>
      </div>
    );
  }

  const { totalLines, activeLines, pendingLines } = getLiveActivityStats(liveRows);
  return (
    <div className="panel coverage-panel">
      <div className="panel-title">Today&apos;s Line Activity</div>
      <div className="coverage-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <div className="coverage-metric ok">
          <span>Active Lines</span>
          <strong>{activeLines.length}/{totalLines}</strong>
        </div>
        <div className="coverage-metric warn">
          <span>Pending</span>
          <strong>{pendingLines.length}</strong>
        </div>
      </div>
      <div className="coverage-lists">
        <div>
          <span className="coverage-label">Active today</span>
          <p>{activeLines.length ? activeLines.join(', ') : 'None yet'}</p>
        </div>
        <div>
          <span className="coverage-label">No entries yet</span>
          <p>{pendingLines.join(', ')}</p>
        </div>
      </div>
    </div>
  );
}
