import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Avatar, Empty, Skills, StageBadge, Stars, fmtDate } from './shared.jsx';

function useDebounced(value, ms = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

const COLUMNS = [
  ['name', 'Candidate'],
  ['position', 'Position'],
  ['stage', 'Stage'],
  ['experience_years', 'Exp.'],
  ['rating', 'Rating'],
  ['created_at', 'Applied'],
];

export default function CandidateList({ stages, version, onOpen, onEdit }) {
  const [q, setQ] = useState('');
  const [stage, setStage] = useState('All');
  const [position, setPosition] = useState('All');
  const [minExp, setMinExp] = useState('');
  const [sort, setSort] = useState('created_at');
  const [order, setOrder] = useState('desc');
  const [rows, setRows] = useState(null);
  const [positions, setPositions] = useState([]);
  const dq = useDebounced(q);

  useEffect(() => {
    api.list({ q: dq, stage, position, minExp, sort, order }).then(setRows);
  }, [dq, stage, position, minExp, sort, order, version]);

  // build the position filter from the full (unfiltered) list
  useEffect(() => {
    api.list().then((all) => setPositions([...new Set(all.map((c) => c.position))].sort()));
  }, [version]);

  const toggleSort = (key) => {
    if (sort === key) setOrder(order === 'asc' ? 'desc' : 'asc');
    else { setSort(key); setOrder(key === 'name' || key === 'position' ? 'asc' : 'desc'); }
  };

  const filtersActive = q || stage !== 'All' || position !== 'All' || minExp !== '';
  const clear = () => { setQ(''); setStage('All'); setPosition('All'); setMinExp(''); };

  return (
    <div className="page">
      <h1>Candidates {rows && <span className="count-pill">{rows.length}</span>}</h1>

      <div className="filters">
        <input
          className="input search"
          placeholder="Search name, email, position or skill…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="input" value={stage} onChange={(e) => setStage(e.target.value)}>
          <option value="All">All stages</option>
          {stages.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className="input" value={position} onChange={(e) => setPosition(e.target.value)}>
          <option value="All">All positions</option>
          {positions.map((p) => <option key={p}>{p}</option>)}
        </select>
        <input
          className="input narrow"
          type="number" min="0" step="0.5"
          placeholder="Min exp (yrs)"
          value={minExp}
          onChange={(e) => setMinExp(e.target.value)}
        />
        {filtersActive && <button className="btn ghost" onClick={clear}>Clear</button>}
      </div>

      {!rows ? (
        <Empty>Loading…</Empty>
      ) : rows.length === 0 ? (
        <Empty>No candidates match your filters.</Empty>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                {COLUMNS.map(([k, label]) => (
                  <th key={k} onClick={() => toggleSort(k)} className="sortable">
                    {label}{sort === k && <span className="arrow">{order === 'asc' ? ' ▲' : ' ▼'}</span>}
                  </th>
                ))}
                <th>Skills</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} onClick={() => onOpen(c.id)}>
                  <td>
                    <div className="person">
                      <Avatar name={c.name} />
                      <div>
                        <div className="strong">{c.name}</div>
                        <div className="muted small">{c.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{c.position}</td>
                  <td><StageBadge stage={c.stage} /></td>
                  <td>{c.experience_years} yrs</td>
                  <td><Stars value={c.rating} /></td>
                  <td className="muted">{fmtDate(c.created_at)}</td>
                  <td><Skills list={c.skills} /></td>
                  <td>
                    <button
                      className="btn ghost sm"
                      onClick={(e) => { e.stopPropagation(); onEdit(c); }}
                    >Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
