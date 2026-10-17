import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Avatar, StageBadge, Stars, fmtDate, timeAgo } from './shared.jsx';

export default function CandidateDetail({ id, stages, version, onClose, onChanged, onEdit, notify }) {
  const [c, setC] = useState(null);
  const [note, setNote] = useState('');
  const [confirmDel, setConfirmDel] = useState(false);

  const load = () => api.get(id).then(setC).catch(() => { notify('Candidate not found', 'err'); onClose(); });
  useEffect(() => { load(); }, [id, version]);

  if (!c) return null;

  const changeStage = async (stage) => {
    await api.moveStage(c.id, stage);
    notify(`${c.name} → ${stage}`);
    onChanged();
  };
  const addNote = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    await api.addNote(c.id, note.trim());
    setNote('');
    load();
  };
  const delNote = async (nid) => { await api.deleteNote(nid); load(); };
  const del = async () => {
    await api.remove(c.id);
    notify(`${c.name} deleted`);
    onChanged();
    onClose();
  };

  return (
    <div className="overlay right" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="drawer">
        <div className="modal-head">
          <div className="person big">
            <Avatar name={c.name} />
            <div>
              <h2>{c.name}</h2>
              <div className="muted">{c.position}</div>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="detail-row">
          <label className="field inline">
            <span>Stage</span>
            <select className="input" value={c.stage} onChange={(e) => changeStage(e.target.value)}>
              {stages.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          <Stars value={c.rating} />
        </div>

        <dl className="facts">
          <dt>Email</dt><dd><a href={`mailto:${c.email}`}>{c.email}</a></dd>
          <dt>Phone</dt><dd>{c.phone || '—'}</dd>
          <dt>Experience</dt><dd>{c.experience_years} yrs</dd>
          <dt>Source</dt><dd>{c.source || '—'}</dd>
          <dt>Applied</dt><dd>{fmtDate(c.created_at)}</dd>
          <dt>Resume</dt>
          <dd>{c.resume_url ? <a href={c.resume_url} target="_blank" rel="noreferrer">Open link ↗</a> : '—'}</dd>
          <dt>Skills</dt>
          <dd>
            <div className="chips">
              {c.skills.length ? c.skills.map((s) => <span key={s} className="chip">{s}</span>) : '—'}
            </div>
          </dd>
        </dl>

        <h3>Notes</h3>
        <form className="note-form" onSubmit={addNote}>
          <input className="input" placeholder="Add an interview note…" value={note} onChange={(e) => setNote(e.target.value)} />
          <button className="btn primary sm" disabled={!note.trim()}>Add</button>
        </form>
        <ul className="notes">
          {c.notes.length === 0 && <li className="muted small">No notes yet.</li>}
          {c.notes.map((n) => (
            <li key={n.id}>
              <div>{n.body}</div>
              <div className="muted small">
                {timeAgo(n.created_at)} · <button className="link danger" onClick={() => delNote(n.id)}>delete</button>
              </div>
            </li>
          ))}
        </ul>

        <h3>Stage history</h3>
        <ul className="timeline">
          {c.history.map((h) => (
            <li key={h.id}>
              {h.from_stage ? (<><StageBadge stage={h.from_stage} /> → <StageBadge stage={h.to_stage} /></>) : (<>Applied as <StageBadge stage={h.to_stage} /></>)}
              <span className="muted small"> · {timeAgo(h.changed_at)}</span>
            </li>
          ))}
        </ul>

        <div className="modal-foot spread">
          {confirmDel ? (
            <span>
              Delete this candidate?{' '}
              <button className="btn danger sm" onClick={del}>Yes, delete</button>{' '}
              <button className="btn ghost sm" onClick={() => setConfirmDel(false)}>Cancel</button>
            </span>
          ) : (
            <button className="btn ghost danger" onClick={() => setConfirmDel(true)}>Delete</button>
          )}
          <button className="btn primary" onClick={() => onEdit(c)}>Edit</button>
        </div>
      </aside>
    </div>
  );
}
