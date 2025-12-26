// frontend/src/services/api.js

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Base fetch com timeout + erro padronizado
 */
async function fetchWithTimeout(url, options = {}, timeout = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    clearTimeout(id);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status} ${res.statusText} - ${text}`);
    }

    return res.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw err;
  }
}

/**
 * Lê o token salvo pelo AuthContext
 */
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/* =====================================================
   POSTS — PÚBLICO
===================================================== */

/**
 * Lista posts públicos (Home)
 * GET /posts
 */
export async function getPosts(page = 1, pageSize = 10) {
  const url = `${API}/posts?page=${page}&pageSize=${pageSize}`;
  return fetchWithTimeout(url, {
    method: 'GET'
  });
}

/**
 * Post público por slug
 * GET /posts/view/:slug
 */
export async function getPostBySlug(slug) {
  const url = `${API}/posts/view/${encodeURIComponent(slug)}`;
  return fetchWithTimeout(url, {
    method: 'GET',
    headers: {
      ...getAuthHeaders() // opcional → permite admin ver draft
    }
  });
}

/* =====================================================
   POSTS — ADMIN
===================================================== */

/**
 * Lista posts no painel admin
 * GET /posts/admin
 */
export async function getAdminPosts() {
  const url = `${API}/posts/admin`;
  return fetchWithTimeout(url, {
    method: 'GET',
    headers: {
      ...getAuthHeaders()
    }
  });
}

/**
 * Cria post (ADMIN)
 * POST /posts/admin
 */
export async function createPost(data) {
  const url = `${API}/posts/admin`;
  return fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(data)
  });
}

/**
 * Atualiza post (ADMIN)
 * PUT /posts/admin/:id
 */
export async function updatePost(id, data) {
  const url = `${API}/posts/admin/${id}`;
  return fetchWithTimeout(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(data)
  });
}

/**
 * Remove post (ADMIN)
 * DELETE /posts/admin/:id
 */
export async function deletePost(id) {
  const url = `${API}/posts/admin/${id}`;
  return fetchWithTimeout(url, {
    method: 'DELETE',
    headers: {
      ...getAuthHeaders()
    }
  });
}
