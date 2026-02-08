// frontend/src/services/api.js

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * ============================================================
 * CORE: O "Motor" da nossa API
 * Substitui o antigo fetchWithTimeout e getAuthHeaders
 * ============================================================
 */
async function apiFetch(endpoint, options = {}) {
  // 1. Token automático
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 2. Configuração do Body
  // Se for FormData (upload), o browser define o Content-Type sozinho.
  // Nós removemos o 'application/json' para não dar conflito.
  let body = options.body;
  if (body instanceof FormData) {
    delete headers['Content-Type'];
  } else if (body && typeof body === 'object') {
    body = JSON.stringify(body);
  }

  // 3. Timeout padrão de 10s (para manter a robustez do teu código anterior)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      body,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // 4. Tratamento de Erros Centralizado
    if (!response.ok) {
      if (response.status === 401) {
        // Opcional: Auto-logout se o token for inválido
        // localStorage.removeItem('token');
        // window.location.href = '/login';
        console.warn('Sessão expirada ou inválida');
      }

      // Tenta pegar a mensagem de erro do backend ou usa o status text
      const errorData = await response.json().catch(() => null);
      const errorMessage = errorData?.message || response.statusText;
      throw new Error(errorMessage || `Erro HTTP ${response.status}`);
    }

    // 5. Retorno Inteligente (JSON ou null)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return null; // Para respostas 204 No Content

  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('O servidor demorou muito para responder (Timeout)');
    }
    throw error;
  }
}

/**
 * ============================================================
 * PUBLIC ENDPOINTS
 * Mantivemos os nomes exatos das funções
 * ============================================================
 */

export async function getCategories() {
  // Antes: 8 linhas de código. Agora: 1 linha.
  return apiFetch('/categories');
}

export async function getMultimedia() {
  try {
    const data = await getPosts(1, 20); // Busca os últimos 20
    const posts = data.data || [];
    // Filtra apenas o que tem type 'video' ou 'audio'
    return posts.filter(p => p.type === 'video' || p.type === 'audio');
  } catch (err) {
    console.error("Erro getMultimedia:", err);
    return [];
  }
}

// Mantivemos a lógica de Query Params aqui fora para clareza
export async function getPosts(page = 1, pageSize = 10, categorySlug = null, q = null) {
  const params = new URLSearchParams({ 
    page: String(page), 
    pageSize: String(pageSize) 
  });
  
  if (categorySlug) params.set('category', categorySlug);
  if (q) params.set('q', q);

  return apiFetch(`/posts?${params.toString()}`);
}

export async function getPostBySlug(slug) {
  return apiFetch(`/posts/view/${encodeURIComponent(slug)}`);
}


/**
 * ============================================================
 * ADMIN ENDPOINTS
 * Simplificação drástica graças ao apiFetch
 * ============================================================
 */

export async function getAdminPosts() {
  return apiFetch('/posts/admin');
}

export async function createPost(data) {
  return apiFetch('/posts/admin', { 
    method: 'POST', 
    body: data // apiFetch já faz o JSON.stringify
  });
}

export async function updatePost(id, data) {
  return apiFetch(`/posts/admin/${id}`, { 
    method: 'PUT', 
    body: data 
  });
}

export async function deletePost(id) {
  return apiFetch(`/posts/admin/${id}`, { 
    method: 'DELETE' 
  });
}

/**
 * Upload de Arquivos
 * O apiFetch detecta FormData e ajusta os headers sozinho.
 */
export async function uploadFile(file) {
  const fd = new FormData();
  fd.append('file', file);

  return apiFetch('/uploads', {
    method: 'POST',
    body: fd
  });
}