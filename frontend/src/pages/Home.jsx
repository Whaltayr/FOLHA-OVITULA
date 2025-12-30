// frontend/src/pages/Home.jsx
import { useEffect, useState } from 'react';
import { getPosts, getCategories } from '../services/api';
import { Link } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'; // base da API

function PostCard({ p }) {
  // Se featured_url for relativa (ex: "/uploads/abc.jpg") prefixamos com a API
  const src = p.featured_url && (p.featured_url.startsWith('http') ? p.featured_url : `${API}${p.featured_url}`);
  const fallback = '/fallback-image.png'; // ficheiro na pasta public do frontend

  return (
    <article className="bg-white rounded-lg shadow-sm overflow-hidden">
      <Link to={`/post/${p.slug}`} className="block">
        <div className="h-44 md:h-56 w-full overflow-hidden bg-gray-100">
          <img
            src={src || fallback}
            alt={p.title}
            className="w-full h-full object-cover transition-transform transform hover:scale-105"
            loading="lazy"
            // onError: evita loop definindo um flag data-fallback-set
            onError={(e) => {
              const img = e.currentTarget;
              if (!img.dataset.fallbackSet) {
                img.dataset.fallbackSet = '1';
                img.src = fallback;
              }
            }}
          />
        </div>

        <div className="p-4">
          <div className="text-xs text-gray-500 mb-1">
            {p.category || 'Sem categoria'} • {p.slug}
          </div>
          <h2 className="text-lg font-semibold leading-tight">{p.title}</h2>
          <p className="text-sm text-gray-600 mt-2">
            {p.lead || (p.content ? (p.content.replace(/<\/?[^>]+(>|$)/g, "").slice(0, 140) + '…') : '')}
          </p>
        </div>
      </Link>
    </article>
  );
}

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 9 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    getCategories()
      .then(arr => { if (!mounted) return; setCategories(Array.isArray(arr) ? arr : []); })
      .catch(() => { /* falha nas categorias não bloqueia a home */ });

    getPosts(meta.page, meta.pageSize, category || null)
      .then(json => { if (!mounted) return; setPosts(json.data || []); })
      .catch(err => { if (!mounted) return; setError(err.message || 'Falha ao carregar posts'); })
      .finally(() => { if (!mounted) return; setLoading(false); });

    return () => { mounted = false; };
  }, [meta.page, meta.pageSize, category]);

  if (loading) return <div className="p-6">Carregando posts…</div>;
  if (error) return <div className="p-6 text-red-600">Erro: {error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold">Folha Ovitula</h1>
        <div className="flex items-center gap-3">
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setMeta(m => ({ ...m, page: 1 })); }}
            className="px-3 py-2 border rounded bg-white"
          >
            <option value="">Todas as categorias</option>
            {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map(p => <PostCard key={p.id} p={p} />)}
        </div>

        <aside className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="font-semibold mb-3">Mais lidos</h3>
          <div className="text-sm text-gray-600">Espaço para destaques, tags, ou listagem manual.</div>
        </aside>
      </div>

      <div className="flex items-center justify-between mt-8">
        <button className="px-4 py-2 border rounded" disabled={meta.page <= 1} onClick={() => setMeta(m => ({ ...m, page: m.page - 1 }))}>← Anterior</button>
        <div className="text-sm text-gray-600">Página {meta.page}</div>
        <button className="px-4 py-2 border rounded" onClick={() => setMeta(m => ({ ...m, page: m.page + 1 }))}>Seguinte →</button>
      </div>
    </div>
  );
}
