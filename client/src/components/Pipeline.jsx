import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Avatar, Empty, Skills, Stars, STAGE_COLORS } from './shared.jsx';

export default function Pipeline({ stages, version, onOpen, onChanged, notify }) {
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState('');
  const [dragId, setDragId] = useState(null);
  const [overStage, setOverStage] = useState(null);

  useEffect(() => { api.list().then(setRows); }, [version]);

  if (!rows) return <Empty>Loading…</Empty>;

  const needle = q.trim().toLowerCase();
  const visible = needle
    ? rows.filter((c) =>
        [c.name, c.email, c.position, c.skills.join(' ')].join(' ').toLowerCase().includes(needle))
    : rows;

  const move = async (id, stage) => {
    const c = rows.find((r) => r.id === id);
    if (!c || c.stage === stage) return;
    // optimistic update
    setRows(rows.map((r) => (r.id === id ? { ...r, stage } : r)));
    try {
      await api.moveStage(id, stage);
      notify(`${c.name} → ${stage}`);
      onChanged();
    } catch (e) {
      notify(e.message, 'err');
      onChanged();
    }
  };

  return (
    <div className="page wide">
      <div className="page-head">
        <h1>Pipeline</h1>
        <input className="input search" placeholder="Filter cards…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <p className="muted small">Drag a card to another column, or use the stage menu on a card.</p>

      <div className="board">
        {stages.map((stage) => {
          const col = visible.filter((c) => c.stage === stage);
          return (
            <div
              key={stage}
              className={'column' + (overStage === stage ? ' over' : '')}
              onDragOver={(e) => { e.preventDefault(); setOverStage(stage); }}
              onDragLeave={() => setOverStage((s) => (s === stage ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                setOverStage(null);
                if (dragId) move(dragId, stage);
                setDragId(null);
              }}
            >
              <div className="col-head" style={{ borderTopColor: STAGE_COLORS[stage] }}>
                <span>{stage}</span>
                <span className="count-pill">{col.length}</span>
              </div>
              <div className="col-body">
                {col.length === 0 && <div className="col-empty">Drop here</div>}
                {col.map((c) => (
                  <div
                    key={c.id}
                    className={'kcard' + (dragId === c.id ? ' dragging' : '')}
                    draggable
                    onDragStart={(e) => { setDragId(c.id); e.dataTransfer.effectAllowed = 'move'; }}
                    onDragEnd={() => { setDragId(null); setOverStage(null); }}
                    onClick={() => onOpen(c.id)}
                  >
                    <div className="person">
                      <Avatar name={c.name} />
                      <div>
                        <div className="strong">{c.name}</div>
                        <div className="muted small">{c.position}</div>
                      </div>
                    </div>
                    <Skills list={c.skills} max={2} />
                    <div className="kcard-foot">
                      <Stars value={c.rating} />
                      <select
                        className="stage-select"
                        value={c.stage}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => move(c.id, e.target.value)}
                        aria-label={`Move ${c.name} to stage`}
                      >
                        {stages.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
