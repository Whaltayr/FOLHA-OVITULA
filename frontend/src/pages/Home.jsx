// frontend/src/pages/Home.jsx
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getPosts } from "../services/api";

/*
  Home — leitura única dos filtros via URL search params.
  - NÃO contém o input de busca nem os botões de categoria.
  - Lê `q` e `category` de useSearchParams() — estes são definidos pelo Header.
  - Mostra apenas: imagem de destaque, título e excerpt (lead).
*/

function resolveImageUrl(path) {
  if (!path) return "/fallback-image.png";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = import.meta.env.VITE_API_URL || "http://localhost:3001";
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

export default function Home() {
  // ler search params da URL (ex.: ?q=eleicoes&category=politica)
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") || null;
  const category = searchParams.get("category") || null;

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // paginação mínima (mantemos page/pageSize, podem ser passados por URL também)
  const [page] = useState(1);
  const [pageSize] = useState(12);

  // Sempre que mudar `q` ou `category` (ou page/pageSize) recarregamos os posts.
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);

        // chama backend com os filtros vindos da URL
        const resp = await getPosts(page, pageSize, category, q);
        // API retorna { page, pageSize, data: [...] } — normaliza
        const items = resp?.data ?? resp ?? [];
        if (!mounted) return;
        setPosts(Array.isArray(items) ? items : []);
      } catch (err) {
        if (!mounted) return;
        console.error("Home load error", err);
        setError(err.message || "Falha ao carregar artigos");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [category, q, page, pageSize]);

  if (loading) return <div className="p-6 text-center">Carregando…</div>;
  if (error) return <div className="p-6 text-center text-red-600">Erro: {error}</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* NOTE: filtros e busca foram movidos para o Header — aqui só mostramos resultados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {posts.length === 0 ? (
          <div className="col-span-full text-center text-gray-600">Nenhum artigo encontrado.</div>
        ) : (
          posts.map((post) => {
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
                        // Remove o handler e aplica fallback para evitar loop infinito
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
