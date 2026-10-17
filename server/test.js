// Run with: npm test  (uses a temporary DB, no external deps)
process.env.DB_FILE = require('path').join(require('os').tmpdir(), `ats-test-${Date.now()}.db`);
const assert = require('assert');
const app = require('./index');
const { seedIfEmpty } = require('./seed');

(async () => {
  seedIfEmpty();
  const server = app.listen(0);
  const base = `http://localhost:${server.address().port}/api`;
  const call = async (method, url, body) => {
    const r = await fetch(base + url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await r.text();
    return { status: r.status, data: text ? JSON.parse(text) : null };
  };
  let passed = 0;
  const t = async (name, fn) => { await fn(); passed++; console.log('  ✓', name); };

  await t('lists seeded candidates', async () => {
    const r = await call('GET', '/candidates');
    assert.equal(r.status, 200);
    assert.equal(r.data.length, 12);
    assert(Array.isArray(r.data[0].skills));
  });

  await t('search by name / skill / email', async () => {
    assert.equal((await call('GET', '/candidates?q=priya')).data.length, 1);
    assert((await call('GET', '/candidates?q=react')).data.length >= 3);
    assert.equal((await call('GET', '/candidates?q=divya.rao@')).data.length, 1);
  });

  await t('filter by stage, position and experience', async () => {
    const st = await call('GET', '/candidates?stage=Applied');
    assert(st.data.every((c) => c.stage === 'Applied'));
    const pos = await call('GET', '/candidates?position=' + encodeURIComponent('Data Analyst'));
    assert.equal(pos.data.length, 2);
    const exp = await call('GET', '/candidates?minExp=3');
    assert(exp.data.every((c) => c.experience_years >= 3));
  });

  await t('sorting works', async () => {
    const r = await call('GET', '/candidates?sort=experience_years&order=asc');
    const xs = r.data.map((c) => c.experience_years);
    assert.deepEqual(xs, [...xs].sort((a, b) => a - b));
  });

  let id;
  await t('creates a candidate and records history', async () => {
    const r = await call('POST', '/candidates', {
      name: 'Test User', email: 'Test.User@Example.com', position: 'Backend Developer',
      skills: 'Go, gRPC', experience_years: 2,
    });
    assert.equal(r.status, 201);
    assert.equal(r.data.stage, 'Applied');
    assert.equal(r.data.email, 'test.user@example.com');
    assert.deepEqual(r.data.skills, ['Go', 'gRPC']);
    id = r.data.id;
    const d = await call('GET', `/candidates/${id}`);
    assert.equal(d.data.history.length, 1);
  });

  await t('rejects invalid input and duplicate email', async () => {
    const bad = await call('POST', '/candidates', { name: '', email: 'nope', position: '' });
    assert.equal(bad.status, 400);
    assert(bad.data.errors.name && bad.data.errors.email && bad.data.errors.position);
    const dup = await call('POST', '/candidates', { name: 'X', email: 'test.user@example.com', position: 'Y' });
    assert.equal(dup.status, 409);
  });

  await t('moves stage and logs transition', async () => {
    const r = await call('PATCH', `/candidates/${id}/stage`, { stage: 'Interview' });
    assert.equal(r.data.stage, 'Interview');
    const d = await call('GET', `/candidates/${id}`);
    assert.equal(d.data.history[0].from_stage, 'Applied');
    assert.equal(d.data.history[0].to_stage, 'Interview');
    const bad = await call('PATCH', `/candidates/${id}/stage`, { stage: 'Nonsense' });
    assert.equal(bad.status, 400);
  });

  await t('updates fields', async () => {
    const r = await call('PUT', `/candidates/${id}`, { rating: 4, phone: '12345', stage: 'Offer' });
    assert.equal(r.data.rating, 4);
    assert.equal(r.data.stage, 'Offer');
    assert.equal(r.data.name, 'Test User');
  });

  await t('adds and deletes notes', async () => {
    const n = await call('POST', `/candidates/${id}/notes`, { body: 'Great communicator' });
    assert.equal(n.status, 201);
    assert.equal((await call('POST', `/candidates/${id}/notes`, { body: '  ' })).status, 400);
    assert.equal((await call('DELETE', `/notes/${n.data.id}`)).status, 204);
  });

  await t('dashboard metrics are consistent', async () => {
    const r = await call('GET', '/dashboard');
    const d = r.data;
    assert.equal(d.total, 13);
    assert.equal(d.byStage.reduce((s, x) => s + x.count, 0), d.total);
    assert.equal(d.active + d.hired + d.rejected, d.total);
    assert.equal(d.funnel[0].stage, 'Applied');
    assert(d.funnel[0].count >= d.funnel[4].count);
    assert(d.recent.length > 0);
  });

  await t('deletes a candidate (cascades)', async () => {
    assert.equal((await call('DELETE', `/candidates/${id}`)).status, 204);
    assert.equal((await call('GET', `/candidates/${id}`)).status, 404);
    assert.equal((await call('DELETE', `/candidates/${id}`)).status, 404);
  });

  console.log(`\n${passed} tests passed`);
  server.close();
  process.exit(0);
})().catch((e) => { console.error('FAIL:', e); process.exit(1); });
