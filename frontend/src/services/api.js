// frontend/src/services/api.js
const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Base fetch com timeout e tratamento uniforme de erros.
 */
async function fetchWithTimeout(url, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP ${res.status}`);
    }
    return res.json();
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('Request timed out');
    throw err;
  }
}

/**
 * Lê token do localStorage (AuthContext deve gravar token lá)
 */
function getAuthHeaders() {
  const token = (() => {
    try { return localStorage.getItem('token'); } catch { return null; }
  })();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/* --------------------- PUBLIC --------------------- */

/** GET /categories */
export async function getCategories() {
  const url = `${API}/categories`;
  // reusa fetchWithTimeout se você definiu; se não, faça um fetch simples:
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to load categories');
  }
  return res.json();
}

// getPosts(page, pageSize, categorySlug = null, q = null)
export async function getPosts(page = 1, pageSize = 10, categorySlug = null, q = null) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (categorySlug) params.set('category', categorySlug);
  if (q) params.set('q', q);
  const url = `${API}/posts?${params.toString()}`;
  return fetchWithTimeout(url, { method: 'GET' });
}

/** GET /posts/view/:slug */
export async function getPostBySlug(slug) {
  const url = `${API}/posts/view/${encodeURIComponent(slug)}`;
  return fetchWithTimeout(url, { method: 'GET', headers: { ...getAuthHeaders() } });
}

/* --------------------- ADMIN --------------------- */

/** GET /posts/admin */
export async function getAdminPosts() {
  const url = `${API}/posts/admin`;
  return fetchWithTimeout(url, { method: 'GET', headers: { ...getAuthHeaders() } });
}

/** POST /posts/admin */
export async function createPost(data) {
  const url = `${API}/posts/admin`;
  return fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data)
  });
}

/** PUT /posts/admin/:id */
export async function updatePost(id, data) {
  const url = `${API}/posts/admin/${id}`;
  return fetchWithTimeout(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data)
  });
}

/** DELETE /posts/admin/:id */
export async function deletePost(id) {
  const url = `${API}/posts/admin/${id}`;
  return fetchWithTimeout(url, { method: 'DELETE', headers: { ...getAuthHeaders() } });
}

/** POST /uploads (multipart) -> returns { ok:true, url } */
export async function uploadFile(file) {
  const url = `${API}/uploads`;
  const fd = new FormData();
  fd.append('file', file);

  const res = await fetch(url, {
    method: 'POST',
    headers: { ...getAuthHeaders() }, // do not set Content-Type for FormData
    body: fd
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Upload failed');
  }
  return res.json();
}
