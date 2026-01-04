
// frontend/src/pages/SearchResults.jsx
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getPosts, getCategories } from '../services/api';

// mesma função de resolução de imagem que usas no Home
function resolveImageUrl(path) {
  if (!path) return "/fallback-image.png";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = import.meta.env.VITE_API_URL || "http://localhost:3001";
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || null;
  const category = searchParams.get('category') || null;
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [page] = useState(1);
  const [pageSize] = useState(12);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [catsResp, postsResp] = await Promise.all([
          getCategories().catch(()=>[]),
          getPosts(page, pageSize, category, q)
        ]);
        if (!mounted) return;
        setCategories(Array.isArray(catsResp) ? catsResp : (catsResp?.data ?? []));
        const items = postsResp?.data ?? postsResp ?? [];
        setPosts(Array.isArray(items) ? items : []);
      } catch (err) {
        if (!mounted) return;
        console.error('SearchResults load error', err);
        setError(err.message || 'Falha ao carregar resultados');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [category, q, page, pageSize]);

  // Highlight simples do termo (não altera string original)
  function highlight(text = '') {
    if (!q) return text;
    const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'ig');
    return text.split(re).map((part, i) => re.test(part) ? <mark key={i} className="bg-yellow-200">{part}</mark> : part);
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Resultados</h1>
          <div className="text-sm text-gray-600">
            {q ? <>Buscando por <strong>{q}</strong></> : 'Resultados recentes'}
            {category ? <> — categoria: <strong>{category}</strong></> : null}
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => navigate(-1)} className="px-3 py-2 border rounded bg-white">Voltar</button>
          <Link to="/" className="px-3 py-2 border rounded bg-white">Início</Link>
        </div>
      </div>

      {loading ? (
        <div className="p-6">Carregando…</div>
      ) : error ? (
        <div className="p-6 text-red-600">Erro: {error}</div>
      ) : posts.length === 0 ? (
        <div className="p-6 bg-white rounded text-gray-600">Nenhum artigo encontrado.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {posts.map(post => {
            const imgUrl = resolveImageUrl(post.featured_url || '');
            return (
              <Link key={post.id} to={`/post/${post.slug}`} className="bg-white rounded-lg shadow hover:shadow-lg overflow-hidden flex flex-col">
                <div className="h-40 bg-gray-100 overflow-hidden">
                  {post.featured_url ? (
                    <img src={imgUrl} alt={post.title} className="w-full h-full object-cover" loading="lazy"
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/fallback-image.png'; }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">Sem imagem</div>
                  )}
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-semibold">{post.title || 'Sem título'}</h3>
                  {post.category?.name && <div className="text-xs text-gray-500 mt-1">{post.category.name}</div>}
                  <p className="text-sm text-gray-700 mt-2 flex-1">{ q ? highlight(post.lead ?? (post.content ? post.content.slice(0,140) + '…' : '')) : (post.lead ?? (post.content ? post.content.slice(0,140) + '…' : '')) }</p>
                  <div className="mt-3 text-xs text-gray-500">{post.published_at ? new Date(post.published_at).toLocaleString() : '—'}</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
