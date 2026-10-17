import React from 'react';

export const STAGE_COLORS = {
  Applied: '#6366f1',
  Screening: '#0ea5e9',
  Interview: '#f59e0b',
  Offer: '#8b5cf6',
  Hired: '#10b981',
  Rejected: '#ef4444',
};

export function StageBadge({ stage }) {
  const c = STAGE_COLORS[stage] || '#64748b';
  return (
    <span className="badge" style={{ color: c, background: c + '1a', borderColor: c + '40' }}>
      {stage}
    </span>
  );
}

export function Stars({ value }) {
  if (!value) return <span className="muted">—</span>;
  return <span className="stars" title={`${value}/5`}>{'★'.repeat(value)}<span className="dim">{'★'.repeat(5 - value)}</span></span>;
}

export function Avatar({ name }) {
  const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return <span className="avatar" style={{ background: `hsl(${h} 60% 46%)` }}>{initials}</span>;
}

export function Skills({ list, max = 3 }) {
  return (
    <div className="chips">
      {list.slice(0, max).map((s) => <span key={s} className="chip">{s}</span>)}
      {list.length > max && <span className="chip more">+{list.length - max}</span>}
    </div>
  );
}

// SQLite returns UTC 'YYYY-MM-DD HH:MM:SS'
export function parseDate(s) {
  return new Date(s.replace(' ', 'T') + 'Z');
}
export function fmtDate(s) {
  return parseDate(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
export function timeAgo(s) {
  const sec = Math.max(0, (Date.now() - parseDate(s).getTime()) / 1000);
  if (sec < 60) return 'just now';
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

export function Empty({ children }) {
  return <div className="empty">{children}</div>;
}
