import React, { useState } from 'react';
import { api } from '../api.js';

const SOURCES = ['LinkedIn', 'Naukri', 'Referral', 'Campus', 'Website', 'Other'];
const POSITIONS = [
  'Full Stack Developer', 'Frontend Developer', 'Backend Developer',
  'DevOps Engineer', 'Data Analyst', 'QA Engineer', 'Product Designer',
];

function Field({ label, name, children, full, errors }) {
  return (
    <label className={'field' + (full ? ' full' : '')}>
      <span>{label}</span>
      {children}
      {errors[name] && <em className="err">{errors[name]}</em>}
    </label>
  );
}

export default function CandidateForm({ initial, stages, onClose, onSaved }) {
  const editing = !!initial.id;
  const [f, setF] = useState({
    name: initial.name || '',
    email: initial.email || '',
    phone: initial.phone || '',
    position: initial.position || '',
    skills: (initial.skills || []).join(', '),
    experience_years: initial.experience_years ?? 0,
    source: initial.source || 'LinkedIn',
    stage: initial.stage || 'Applied',
    rating: initial.rating || '',
    resume_url: initial.resume_url || '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState('');

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setFormErr('');
    try {
      const payload = { ...f, experience_years: Number(f.experience_years) || 0, rating: f.rating ? Number(f.rating) : null };
      const saved = editing ? await api.update(initial.id, payload) : await api.create(payload);
      onSaved(saved, !editing);
    } catch (err) {
      if (err.fields && Object.keys(err.fields).length) setErrors(err.fields);
      else setFormErr(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal" onSubmit={submit} noValidate>
        <div className="modal-head">
          <h2>{editing ? 'Edit candidate' : 'Add candidate'}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="form-grid">
          <Field errors={errors} label="Full name *" name="name">
            <input className="input" value={f.name} onChange={set('name')} autoFocus />
          </Field>
          <Field errors={errors} label="Email *" name="email">
            <input className="input" type="email" value={f.email} onChange={set('email')} />
          </Field>
          <Field errors={errors} label="Phone" name="phone">
            <input className="input" value={f.phone} onChange={set('phone')} />
          </Field>
          <Field errors={errors} label="Position *" name="position">
            <input className="input" list="positions" value={f.position} onChange={set('position')} />
            <datalist id="positions">{POSITIONS.map((p) => <option key={p} value={p} />)}</datalist>
          </Field>
          <Field errors={errors} label="Skills (comma separated)" name="skills" full>
            <input className="input" value={f.skills} onChange={set('skills')} placeholder="React, Node.js, SQL" />
          </Field>
          <Field errors={errors} label="Experience (years)" name="experience_years">
            <input className="input" type="number" min="0" step="0.5" value={f.experience_years} onChange={set('experience_years')} />
          </Field>
          <Field errors={errors} label="Source" name="source">
            <select className="input" value={f.source} onChange={set('source')}>
              {SOURCES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field errors={errors} label="Stage" name="stage">
            <select className="input" value={f.stage} onChange={set('stage')}>
              {stages.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field errors={errors} label="Rating" name="rating">
            <select className="input" value={f.rating} onChange={set('rating')}>
              <option value="">Not rated</option>
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{'★'.repeat(n)}</option>)}
            </select>
          </Field>
          <Field errors={errors} label="Resume link" name="resume_url" full>
            <input className="input" value={f.resume_url} onChange={set('resume_url')} placeholder="https://…" />
          </Field>
        </div>

        {formErr && <div className="form-err">{formErr}</div>}

        <div className="modal-foot">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Add candidate'}</button>
        </div>
      </form>
    </div>
  );
}
