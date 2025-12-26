// frontend/src/services/api.js
const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function fetchWithTimeout(url, opts = {}, timeout = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal, credentials: 'include' });
    clearTimeout(id);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status} ${res.statusText} - ${text}`);
    }
    return res.json();
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('Request timed out');
    throw err;
  }
}

export async function getPosts(page = 1, pageSize = 10) {
  const url = `${API}/posts?page=${page}&pageSize=${pageSize}`;
  return fetchWithTimeout(url, { method: 'GET' });
}

export async function getPostBySlug(slug) {


  const url = `${API}/posts/view/${encodeURIComponent(slug)}`;
  return fetchWithTimeout(url, { method: 'GET' });
}
