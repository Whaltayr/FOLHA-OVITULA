// frontend/src/pages/Home.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getPosts, getCategories } from "../services/api";

/*
  Home (cards minimalistas):
  - mostra apenas: imagem de destaque, título, excerpt (lead) e categoria.
  - remove slug e autor da listagem; autor fica só no PostDetail.
  - trata featured_url que pode ser URL absoluta ou caminho relativo (uploads).
  - fallback seguro para evitar loop infinito no onError.
*/

// monta URL completa da imagem: aceita caminho relativo ("/uploads/xxx") ou nome
function resolveImageUrl(path) {
  if (!path) return "/fallback-image.png"; // sem imagem → fallback local
  // se já for uma URL absoluta, usa diretamente
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  // caso contrário monta com a base da API (ex.: "/uploads/xxx" ou "uploads/xxx")
  const base = import.meta.env.VITE_API_URL || "http://localhost:3001";
  // garante barra entre base e path
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // paginação simples (pode expandir depois)
  const [page] = useState(1);
  const [pageSize] = useState(12);

  useEffect(() => {
    let mounted = true;
    async function loadAll() {
      try {
        setLoading(true);
        setError(null);

        // buscar posts + categorias em paralelo para performance
        const [postsResp, catsResp] = await Promise.all([
          getPosts(page, pageSize),    // espera { page, pageSize, data: [...] }
          getCategories(),             // espera [ { id, name, slug } ]
        ]);

        if (!mounted) return;

        const items = postsResp?.data ?? postsResp?.posts ?? postsResp ?? [];
        setPosts(Array.isArray(items) ? items : []);
        setCategories(Array.isArray(catsResp) ? catsResp : []);
      } catch (err) {
        if (!mounted) return;
        console.error("Home load error", err);
        setError(err.message || "Falha ao carregar conteúdo");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }
    loadAll();
    return () => {
      mounted = false;
    };
  }, [page, pageSize]);

  // filtrar por categoria
  const filtered = useMemo(() => {
    if (categoryFilter === "all") return posts;
    return posts.filter((p) => (p.category?.slug ?? "") === categoryFilter);
  }, [posts, categoryFilter]);

  if (loading) return <div className="p-6 text-center">Carregando…</div>;
  if (error) return <div className="p-6 text-center text-red-600">Erro: {error}</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* filtros de categoria */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          className={`px-3 py-1 rounded ${categoryFilter === "all" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
          onClick={() => setCategoryFilter("all")}
        >
          Todas
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`px-3 py-1 rounded ${categoryFilter === cat.slug ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
            onClick={() => setCategoryFilter(cat.slug)}
            title={cat.name}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* grid de cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center text-gray-600">Nenhum artigo encontrado.</div>
        ) : (
          filtered.map((post) => {
            const imgUrl = resolveImageUrl(post.featured_url || "");
            return (
              <Link
                to={`/post/${post.slug}`}
                key={post.id}
                className="bg-white rounded-lg shadow hover:shadow-lg overflow-hidden flex flex-col"
                aria-label={post.title || "Artigo"}
              >
                <div className="h-48 bg-gray-100 overflow-hidden">
                  {post.featured_url ? (
                    <img
                      src={imgUrl}
                      alt={post.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      // onError: troca para fallback e remove handler para evitar loop
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/fallback-image.png";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      Sem imagem
                    </div>
                  )}
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h2 className="font-semibold text-lg">{post.title || "Sem título"}</h2>
                    {post.category?.name && (
                      <div className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600">{post.category.name}</div>
                    )}
                  </div>

                  {/* removido: slug e autor — exibimos só o excerpt */}
                  <p className="text-sm text-gray-700 flex-1">
                    {post.lead ?? (post.content ? (post.content.slice(0, 140) + "…") : "")}
                  </p>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}