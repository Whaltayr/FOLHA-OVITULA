import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getPosts } from "../services/api";

/*
  Home (cards minimalistas):
  - NÃO busca categorias (agora o header faz isso)
  - lê query param ?category=slug e passa para getPosts(page,pageSize,category)
  - mostra apenas: imagem de destaque, título, excerpt (lead) e badge da categoria
*/

// monta URL completa da imagem: aceita caminho relativo ("/uploads/xxx") ou nome
function resolveImageUrl(path) {
  if (!path) return "/fallback-image.png"; // sem imagem → fallback local
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = import.meta.env.VITE_API_URL || "http://localhost:3001";
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

export default function Home() {
  const loc = useLocation();
  const params = new URLSearchParams(loc.search);
  const categoryFromQuery = params.get('category') || null; // lê ?category=slug

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // paginação simples (pode expandir depois)
  const [page] = useState(1);
  const [pageSize] = useState(12);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);

        // passa o categorySlug (pode ser null)
        const postsResp = await getPosts(page, pageSize, categoryFromQuery);

        if (!mounted) return;
        const items = postsResp?.data ?? postsResp?.posts ?? postsResp ?? [];
        setPosts(Array.isArray(items) ? items : []);
      } catch (err) {
        if (!mounted) return;
        console.error("Home load error", err);
        setError(err.message || "Falha ao carregar conteúdo");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [page, pageSize, categoryFromQuery]); // re-executa quando a categoria muda

  // só para renderização (sem filtro client-side agora)
  const filtered = useMemo(() => posts, [posts]);

  if (loading) return <div className="p-6 text-center">Carregando…</div>;
  if (error) return <div className="p-6 text-center text-red-600">Erro: {error}</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
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
                      onError={(e) => {
                        // evitar loop: remover handler logo a seguir e trocar src
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/fallback-image.png";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">Sem imagem</div>
                  )}
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h2 className="font-semibold text-lg">{post.title || "Sem título"}</h2>
                    {post.category?.name && (
                      <div className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600">{post.category.name}</div>
                    )}
                  </div>

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
