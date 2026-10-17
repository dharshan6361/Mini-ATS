import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { STAGE_COLORS, timeAgo, StageBadge } from './shared.jsx';

function Stat({ label, value, sub, accent }) {
  return (
    <div className="stat" style={accent ? { borderTopColor: accent } : undefined}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

function BarList({ rows, labelKey, color = '#6366f1' }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="barlist">
      {rows.map((r) => (
        <div className="barrow" key={r[labelKey]}>
          <span className="bar-label">{r[labelKey]}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(r.count / max) * 100}%`, background: color }} />
          </div>
          <span className="bar-count">{r.count}</span>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard({ version, onOpen }) {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.dashboard().then(setD).catch((e) => setErr(e.message));
  }, [version]);

  if (err) return <div className="empty">Failed to load: {err}</div>;
  if (!d) return <div className="empty">Loading…</div>;

  const maxFunnel = Math.max(1, d.funnel[0].count);

  return (
    <div className="page">
      <h1>Hiring overview</h1>
      <div className="stats">
        <Stat label="Total candidates" value={d.total} sub={`${d.newThisWeek} new this week`} accent="#6366f1" />
        <Stat label="Active in pipeline" value={d.active} sub="Not yet hired or rejected" accent="#0ea5e9" />
        <Stat label="Hired" value={d.hired} sub={`${d.hireRate}% hire rate`} accent="#10b981" />
        <Stat label="Rejected" value={d.rejected} sub={`${d.rejectionRate}% of all candidates`} accent="#ef4444" />
        <Stat label="Avg. experience" value={`${d.avgExperience} yrs`} sub="Across all candidates" accent="#f59e0b" />
      </div>

      <div className="grid2">
        <section className="card">
          <h2>Candidates by stage</h2>
          <div className="barlist">
            {d.byStage.map((r) => (
              <div className="barrow" key={r.stage}>
                <span className="bar-label">{r.stage}</span>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ width: `${(r.count / Math.max(1, d.total)) * 100}%`, background: STAGE_COLORS[r.stage] }}
                  />
                </div>
                <span className="bar-count">{r.count}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <h2>Conversion funnel</h2>
          <p className="muted small">Candidates who have ever reached each stage</p>
          <div className="funnel">
            {d.funnel.map((f) => (
              <div className="funnel-row" key={f.stage}>
                <div
                  className="funnel-bar"
                  style={{ width: `${Math.max(14, (f.count / maxFunnel) * 100)}%`, background: STAGE_COLORS[f.stage] }}
                >
                  {f.stage}
                </div>
                <span className="funnel-count">
                  {f.count}
                  {f.stage !== 'Applied' && d.funnel[0].count > 0 && (
                    <em> · {Math.round((f.count / d.funnel[0].count) * 100)}%</em>
                  )}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <h2>Open positions</h2>
          <BarList rows={d.byPosition} labelKey="position" color="#6366f1" />
        </section>

        <section className="card">
          <h2>Sources</h2>
          <BarList rows={d.bySource} labelKey="source" color="#0ea5e9" />
        </section>
      </div>

      <section className="card">
        <h2>Recent activity</h2>
        {d.recent.length === 0 && <div className="muted">No activity yet.</div>}
        <ul className="activity">
          {d.recent.map((r) => (
            <li key={r.id}>
              <button className="link" onClick={() => onOpen(r.candidate_id)}>{r.name}</button>
              {r.from_stage ? (
                <> moved <StageBadge stage={r.from_stage} /> → <StageBadge stage={r.to_stage} /></>
              ) : (
                <> applied <StageBadge stage={r.to_stage} /></>
              )}
              <span className="muted small"> · {timeAgo(r.changed_at)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
