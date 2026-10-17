const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { db, STAGES } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const wrap = (fn) => (req, res) => {
  try {
    fn(req, res);
  } catch (e) {
    if (String(e.message).includes('UNIQUE constraint failed: candidates.email')) {
      return res.status(409).json({ error: 'A candidate with this email already exists' });
    }
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(body, partial = false) {
  const errors = {};
  const has = (k) => body[k] !== undefined;
  if (!partial || has('name')) {
    if (!body.name || !String(body.name).trim()) errors.name = 'Name is required';
  }
  if (!partial || has('email')) {
    if (!body.email || !EMAIL_RE.test(String(body.email).trim())) errors.email = 'Valid email is required';
  }
  if (!partial || has('position')) {
    if (!body.position || !String(body.position).trim()) errors.position = 'Position is required';
  }
  if (has('stage') && !STAGES.includes(body.stage)) errors.stage = `Stage must be one of: ${STAGES.join(', ')}`;
  if (has('experience_years') && (isNaN(Number(body.experience_years)) || Number(body.experience_years) < 0))
    errors.experience_years = 'Experience must be a non-negative number';
  if (has('rating') && body.rating !== null && body.rating !== '' &&
      (!Number.isInteger(Number(body.rating)) || Number(body.rating) < 1 || Number(body.rating) > 5))
    errors.rating = 'Rating must be an integer from 1 to 5';
  return errors;
}

const normSkills = (s) =>
  Array.isArray(s)
    ? s.map((x) => String(x).trim()).filter(Boolean).join(',')
    : String(s || '').split(',').map((x) => x.trim()).filter(Boolean).join(',');

const present = (row) => row && { ...row, skills: row.skills ? row.skills.split(',') : [] };

// ---------- Meta ----------
app.get('/api/stages', (req, res) => res.json(STAGES));

// ---------- Candidates ----------
app.get('/api/candidates', wrap((req, res) => {
  const { q, stage, position, minExp, maxExp, sort = 'created_at', order = 'desc' } = req.query;
  const where = [];
  const params = {};
  if (q && q.trim()) {
    where.push('(name LIKE @q OR email LIKE @q OR position LIKE @q OR skills LIKE @q)');
    params.q = `%${q.trim()}%`;
  }
  if (stage && stage !== 'All') { where.push('stage = @stage'); params.stage = stage; }
  if (position && position !== 'All') { where.push('position = @position'); params.position = position; }
  if (minExp !== undefined && minExp !== '') { where.push('experience_years >= @minExp'); params.minExp = Number(minExp); }
  if (maxExp !== undefined && maxExp !== '') { where.push('experience_years <= @maxExp'); params.maxExp = Number(maxExp); }

  const sortable = ['name', 'created_at', 'updated_at', 'experience_years', 'rating', 'stage', 'position'];
  const col = sortable.includes(sort) ? sort : 'created_at';
  const dir = String(order).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const sql = `SELECT * FROM candidates ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY ${col} ${dir}, id DESC`;
  res.json(db.prepare(sql).all(params).map(present));
}));

app.get('/api/candidates/:id', wrap((req, res) => {
  const c = db.prepare('SELECT * FROM candidates WHERE id = ?').get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Candidate not found' });
  const history = db.prepare('SELECT * FROM stage_history WHERE candidate_id = ? ORDER BY id DESC').all(c.id);
  const notes = db.prepare('SELECT * FROM notes WHERE candidate_id = ? ORDER BY id DESC').all(c.id);
  res.json({ ...present(c), history, notes });
}));

app.post('/api/candidates', wrap((req, res) => {
  const errors = validate(req.body);
  if (Object.keys(errors).length) return res.status(400).json({ error: 'Validation failed', errors });
  const b = req.body;
  const stage = b.stage || 'Applied';
  const tx = db.transaction(() => {
    const info = db.prepare(`
      INSERT INTO candidates (name, email, phone, position, skills, experience_years, source, stage, rating, resume_url)
      VALUES (@name, @email, @phone, @position, @skills, @experience_years, @source, @stage, @rating, @resume_url)`)
      .run({
        name: b.name.trim(),
        email: b.email.trim().toLowerCase(),
        phone: b.phone || null,
        position: b.position.trim(),
        skills: normSkills(b.skills),
        experience_years: Number(b.experience_years) || 0,
        source: b.source || null,
        stage,
        rating: b.rating ? Number(b.rating) : null,
        resume_url: b.resume_url || null,
      });
    db.prepare('INSERT INTO stage_history (candidate_id, from_stage, to_stage) VALUES (?, NULL, ?)')
      .run(info.lastInsertRowid, stage);
    return info.lastInsertRowid;
  });
  const id = tx();
  res.status(201).json(present(db.prepare('SELECT * FROM candidates WHERE id = ?').get(id)));
}));

app.put('/api/candidates/:id', wrap((req, res) => {
  const existing = db.prepare('SELECT * FROM candidates WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Candidate not found' });
  const errors = validate(req.body, true);
  if (Object.keys(errors).length) return res.status(400).json({ error: 'Validation failed', errors });
  const b = req.body;
  const merged = {
    name: b.name !== undefined ? b.name.trim() : existing.name,
    email: b.email !== undefined ? b.email.trim().toLowerCase() : existing.email,
    phone: b.phone !== undefined ? b.phone || null : existing.phone,
    position: b.position !== undefined ? b.position.trim() : existing.position,
    skills: b.skills !== undefined ? normSkills(b.skills) : existing.skills,
    experience_years: b.experience_years !== undefined ? Number(b.experience_years) || 0 : existing.experience_years,
    source: b.source !== undefined ? b.source || null : existing.source,
    stage: b.stage !== undefined ? b.stage : existing.stage,
    rating: b.rating !== undefined ? (b.rating ? Number(b.rating) : null) : existing.rating,
    resume_url: b.resume_url !== undefined ? b.resume_url || null : existing.resume_url,
    id: existing.id,
  };
  db.transaction(() => {
    db.prepare(`UPDATE candidates SET name=@name, email=@email, phone=@phone, position=@position, skills=@skills,
      experience_years=@experience_years, source=@source, stage=@stage, rating=@rating, resume_url=@resume_url,
      updated_at=datetime('now') WHERE id=@id`).run(merged);
    if (merged.stage !== existing.stage) {
      db.prepare('INSERT INTO stage_history (candidate_id, from_stage, to_stage) VALUES (?, ?, ?)')
        .run(existing.id, existing.stage, merged.stage);
    }
  })();
  res.json(present(db.prepare('SELECT * FROM candidates WHERE id = ?').get(existing.id)));
}));

app.patch('/api/candidates/:id/stage', wrap((req, res) => {
  const { stage } = req.body;
  if (!STAGES.includes(stage)) return res.status(400).json({ error: `Stage must be one of: ${STAGES.join(', ')}` });
  const existing = db.prepare('SELECT * FROM candidates WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Candidate not found' });
  if (existing.stage !== stage) {
    db.transaction(() => {
      db.prepare("UPDATE candidates SET stage = ?, updated_at = datetime('now') WHERE id = ?").run(stage, existing.id);
      db.prepare('INSERT INTO stage_history (candidate_id, from_stage, to_stage) VALUES (?, ?, ?)')
        .run(existing.id, existing.stage, stage);
    })();
  }
  res.json(present(db.prepare('SELECT * FROM candidates WHERE id = ?').get(existing.id)));
}));

app.delete('/api/candidates/:id', wrap((req, res) => {
  const info = db.prepare('DELETE FROM candidates WHERE id = ?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Candidate not found' });
  res.status(204).end();
}));

// ---------- Notes ----------
app.post('/api/candidates/:id/notes', wrap((req, res) => {
  const body = (req.body.body || '').trim();
  if (!body) return res.status(400).json({ error: 'Note cannot be empty' });
  const c = db.prepare('SELECT id FROM candidates WHERE id = ?').get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Candidate not found' });
  const info = db.prepare('INSERT INTO notes (candidate_id, body) VALUES (?, ?)').run(c.id, body);
  res.status(201).json(db.prepare('SELECT * FROM notes WHERE id = ?').get(info.lastInsertRowid));
}));

app.delete('/api/notes/:id', wrap((req, res) => {
  const info = db.prepare('DELETE FROM notes WHERE id = ?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Note not found' });
  res.status(204).end();
}));

// ---------- Dashboard ----------
app.get('/api/dashboard', wrap((req, res) => {
  const total = db.prepare('SELECT COUNT(*) n FROM candidates').get().n;
  const byStageRows = db.prepare('SELECT stage, COUNT(*) n FROM candidates GROUP BY stage').all();
  const byStage = STAGES.map((s) => ({ stage: s, count: byStageRows.find((r) => r.stage === s)?.n || 0 }));
  const count = (s) => byStage.find((x) => x.stage === s).count;

  const byPosition = db.prepare('SELECT position, COUNT(*) count FROM candidates GROUP BY position ORDER BY count DESC').all();
  const bySource = db.prepare("SELECT COALESCE(source,'Unknown') source, COUNT(*) count FROM candidates GROUP BY source ORDER BY count DESC").all();
  const newThisWeek = db.prepare("SELECT COUNT(*) n FROM candidates WHERE created_at >= datetime('now','-7 days')").get().n;
  const avgExp = db.prepare('SELECT AVG(experience_years) a FROM candidates').get().a || 0;

  const active = total - count('Hired') - count('Rejected');
  const pct = (n) => (total ? Math.round((n / total) * 1000) / 10 : 0);

  // Funnel: how many candidates have ever reached each stage (excluding Rejected)
  const funnel = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired'].map((s) => ({
    stage: s,
    count: db.prepare('SELECT COUNT(DISTINCT candidate_id) n FROM stage_history WHERE to_stage = ?').get(s).n,
  }));

  const recent = db.prepare(`
    SELECT h.id, h.candidate_id, c.name, h.from_stage, h.to_stage, h.changed_at
    FROM stage_history h JOIN candidates c ON c.id = h.candidate_id
    ORDER BY h.id DESC LIMIT 8`).all();

  res.json({
    total, active, newThisWeek,
    hired: count('Hired'), rejected: count('Rejected'),
    hireRate: pct(count('Hired')), rejectionRate: pct(count('Rejected')),
    avgExperience: Math.round(avgExp * 10) / 10,
    byStage, byPosition, bySource, funnel, recent,
  });
}));

// ---------- Static client (production) ----------
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^\/(?!api).*/, (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

const PORT = process.env.PORT || 4000;
if (require.main === module) {
  require('./seed').seedIfEmpty();
  app.listen(PORT, () => console.log(`ATS API running on http://localhost:${PORT}`))
  .on('error', (e) => { console.error('Server failed to start:', e.message); process.exit(1); });
}

module.exports = app;
