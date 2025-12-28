// frontend/src/pages/admin/AdminPosts.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminPosts, deletePost } from "../../services/api";

/**
 * AdminPosts — versão corrigida com UI em português
 */

const STATUS_COLORS = {
  published: "bg-emerald-50 text-emerald-700 border-emerald-100",
  draft: "bg-gray-50 text-gray-600 border-gray-100",
};

export default function AdminPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Controles UI (valores consistentes)
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | published | draft
  const [sort, setSort] = useState("newest"); // newest | oldest
  const [page, setPage] = useState(1); // number
  const [pageSize, setPageSize] = useState(8);
  const [deletingId, setDeletingId] = useState(null);

  // carregar posts do backend
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await getAdminPosts(); // espera array
        if (!mounted) return; // set state apenas se ainda montado
        setPosts(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || "Falha ao carregar posts");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // lista filtrada + ordenada
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = posts.slice();

    if (statusFilter !== "all") {
      result = result.filter((p) => (p.status || "draft") === statusFilter);
    }

    if (q) {
      result = result.filter(
        (p) =>
          (p.title || "").toLowerCase().includes(q) ||
          (p.slug || "").toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      const ad = a.published_at ? new Date(a.published_at).getTime() : 0;
      const bd = b.published_at ? new Date(b.published_at).getTime() : 0;
      return sort === "newest" ? bd - ad : ad - bd;
    });
    return result;
  }, [posts, query, statusFilter, sort]);

  // paginação
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  // deletar post — confirmação + UI otimista
  async function handleDelete(id) {
    if (!confirm("Tem certeza que deseja deletar este artigo? Esta ação é irreversível.")) return;
    setDeletingId(id);
    try {
      await deletePost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert("Falha ao deletar: " + (err.message || ""));
    } finally {
      setDeletingId(null);
    }
  }

  // helper de formatação de data
  function formatDate(d) {
    if (!d) return "-";
    try {
      return new Date(d).toLocaleString();
    } catch {
      return d;
    }
  }

  /*--------------------RENDER--------------------- */
  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }
  if (error) {
    return <div className="p-6 text-red-600">Erro: {error}</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-bold text-2xl">Artigos • Admin</h1>
          <div className="text-sm text-gray-500 mt-1">
            Gerir artigos: criar, editar, publicar e remover.
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            to="/admin/posts/new"
            className="px-3 py-2 rounded bg-blue-600 text-white"
          >
            Novo artigo
          </Link>
          <Link
            to="/"
            className="px-3 py-2 bg-white shadow border rounded text-sm text-gray-700"
          >
            Ver site
          </Link>
        </div>
      </header>

      {/* Controles */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:gap-4">
          <div className="flex-1">
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Pesquisar por título ou slug..."
              className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-sky-300"
              aria-label="Pesquisar artigos"
            />
          </div>

          <div className="mt-3 md:mt-0 flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border rounded"
            >
              <option value="all">Todos</option>
              <option value="published">Publicados</option>
              <option value="draft">Rascunhos</option>
            </select>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-2 border rounded"
            >
              <option value="newest">Mais recentes</option>
              <option value="oldest">Mais antigos</option>
            </select>

            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="px-3 py-2 border rounded"
            >
              <option value={6}>6 / página</option>
              <option value={8}>8 / página</option>
              <option value={12}>12 / página</option>
            </select>
          </div>
        </div>
      </div>

      {/* ÁREA DE LISTAGEM */}
      <div className="space-y-4">
        {paged.length === 0 ? (
          <div className="p-6 bg-white rounded text-gray-600">
            Nenhum artigo encontrado para os filtros selecionados.
          </div>
        ) : (
          paged.map((post) => (
            <div
              key={post.id}
              className="bg-white p-4 rounded-lg border flex flex-col md:flex-row md:items-start md:justify-between gap-4"
            >
              <div className="flex-1">
                <div className="flex items-start gap-3">
                  <div>
                    <div className="text-lg font-semibold">
                      <Link to={`/post/${post.slug}`} className="hover:underline">
                        {post.title || "Sem título"}
                      </Link>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {post.lead || (post.content ? post.content.slice(0, 160) + "…" : "")}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      <span>Autor: {post.author_name || "Desconhecido"}</span>
                      <span className="mx-2">•</span>
                      <span>{post.slug}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-4">
                <div
                  className={`px-2 py-1 border rounded text-sm ${
                    STATUS_COLORS[post.status] || STATUS_COLORS.draft
                  }`}
                >
                  {post.status || "rascunho"}
                </div>

                <div className="text-xs text-gray-500 text-right">
                  {post.published_at ? formatDate(post.published_at) : "Não publicado"}
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/admin/posts/${post.id}/edit`}
                    className="px-2 py-1 border rounded text-sm hover:bg-yellow-50"
                  >
                    Editar
                  </Link>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="px-2 py-1 border rounded text-sm text-red-600 hover:bg-red-50"
                    disabled={deletingId === post.id}
                    aria-label={`Remover artigo ${post.title}`}
                  >
                    {deletingId === post.id ? "Removendo…" : "Remover"}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* rodapé de paginação */}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Mostrando {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} de {total}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Anterior
          </button>
          <div className="text-sm">
            Página {page} / {totalPages}
          </div>
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Seguinte
          </button>
        </div>
      </div>
    </div>
  );
}
