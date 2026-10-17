async function req(method, url, body) {
  const res = await fetch('/api' + url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Request failed');
    err.fields = data.errors || {};
    throw err;
  }
  return data;
}

export const api = {
  stages: () => req('GET', '/stages'),
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== 'All')
    ).toString();
    return req('GET', '/candidates' + (qs ? '?' + qs : ''));
  },
  get: (id) => req('GET', `/candidates/${id}`),
  create: (b) => req('POST', '/candidates', b),
  update: (id, b) => req('PUT', `/candidates/${id}`, b),
  moveStage: (id, stage) => req('PATCH', `/candidates/${id}/stage`, { stage }),
  remove: (id) => req('DELETE', `/candidates/${id}`),
  addNote: (id, body) => req('POST', `/candidates/${id}/notes`, { body }),
  deleteNote: (id) => req('DELETE', `/notes/${id}`),
  dashboard: () => req('GET', '/dashboard'),
};
