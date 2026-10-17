import React, { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';
import Dashboard from './components/Dashboard.jsx';
import CandidateList from './components/CandidateList.jsx';
import Pipeline from './components/Pipeline.jsx';
import CandidateForm from './components/CandidateForm.jsx';
import CandidateDetail from './components/CandidateDetail.jsx';

const TABS = [
  ['dashboard', 'Dashboard'],
  ['pipeline', 'Pipeline'],
  ['candidates', 'Candidates'],
];

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [stages, setStages] = useState([]);
  const [version, setVersion] = useState(0); // bump to refetch everywhere
  const [formState, setFormState] = useState(null); // null | {} (new) | candidate (edit)
  const [detailId, setDetailId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => { api.stages().then(setStages); }, []);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  const notify = useCallback((msg, type = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2600);
  }, []);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand"><span className="logo">◆</span> Mini ATS</div>
        <nav>
          {TABS.map(([k, label]) => (
            <button key={k} className={'tab' + (tab === k ? ' active' : '')} onClick={() => setTab(k)}>
              {label}
            </button>
          ))}
        </nav>
        <button className="btn primary" onClick={() => setFormState({})}>+ Add candidate</button>
      </header>

      <main>
        {tab === 'dashboard' && <Dashboard version={version} onOpen={setDetailId} />}
        {tab === 'pipeline' && (
          <Pipeline stages={stages} version={version} onOpen={setDetailId} onChanged={refresh} notify={notify} />
        )}
        {tab === 'candidates' && (
          <CandidateList stages={stages} version={version} onOpen={setDetailId} onEdit={setFormState} />
        )}
      </main>

      {formState && (
        <CandidateForm
          initial={formState}
          stages={stages}
          onClose={() => setFormState(null)}
          onSaved={(c, isNew) => {
            setFormState(null);
            refresh();
            notify(isNew ? `${c.name} added` : `${c.name} updated`);
          }}
        />
      )}

      {detailId && (
        <CandidateDetail
          id={detailId}
          stages={stages}
          version={version}
          onClose={() => setDetailId(null)}
          onChanged={refresh}
          onEdit={(c) => { setDetailId(null); setFormState(c); }}
          notify={notify}
        />
      )}

      {toast && <div className={'toast ' + toast.type}>{toast.msg}</div>}
    </div>
  );
}
