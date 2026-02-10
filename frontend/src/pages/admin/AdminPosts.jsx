// frontend/src/pages/admin/AdminPosts.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowLeft, FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import { getAdminPosts, deletePost, getCategories } from "../../services/api";
const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

const STATUS_LABEL = {
  published: "Publicado",
  draft: "Rascunho",
  pending: "Agendado",
};
const STATUS_COLOR = {
  published: "bg-emerald-50 text-emerald-700 border-emerald-100",
  draft: "bg-gray-50 text-gray-600 border-gray-100",
  pending: "bg-yellow-50 text-yellow-700 border-yellow-100",
};

export default function AdminPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [cats, adminPosts] = await Promise.all([
          getCategories(),
          getAdminPosts(),
        ]);
        if (!mounted) return;
        setCategories(Array.isArray(cats) ? cats : []);
        setPosts(Array.isArray(adminPosts) ? adminPosts : []);
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

  // filtered + sorted
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = posts.slice();

    if (statusFilter !== "all")
      result = result.filter((p) => (p.status || "draft") === statusFilter);
    if (categoryFilter !== "all")
      result = result.filter(
        (p) => String(p.category_id) === String(categoryFilter)
      );
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
  }, [posts, query, statusFilter, categoryFilter, sort]);

  // pagination
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  async function handleDelete(id) {
    if (!confirm("Tem certeza que deseja deletar este artigo?")) return;
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

  function formatDate(d) {
    if (!d) return "-";
    try {
      return new Date(d).toLocaleString();
    } catch {
      return d;
    }
  }

  if (loading) return <div className="p-6">Carregando...</div>;
  if (error) return <div className="p-6 text-red-600">Erro: {error}</div>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      

       {/* === BOTÃO VOLTAR === */}
    <Link to="/admin" className="inline-flex items-center text-gray-500 hover:text-blue-600 mb-6 transition font-medium">
      <FaArrowLeft className="mr-2" /> Voltar ao Painel
    </Link>

    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold text-gray-800 mr-3">Gerir Artigos</h1>
      <Link to="/admin/posts/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition">
        <FaPlus /> Novo Artigo
      </Link>
    </div>
      </header>

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
              <option value="pending">Agendados</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border rounded"
            >
              <option value="all">Todas categorias</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
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
              <div className="flex-1 flex gap-3">
                {/* mini-preview da imagem */}
                <div className="w-28 h-20 bg-gray-100 overflow-hidden rounded">
                  <img
                    src={
                      post.featured_url
                        ? post.featured_url.startsWith("http")
                          ? post.featured_url
                          : `${API}${post.featured_url}`
                        : "/fallback-image.png"
                    }
                    alt={post.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (!img.dataset.fallbackSet) {
                        img.dataset.fallbackSet = "1";
                        img.src = "/fallback-image.png";
                      }
                    }}
                  />
                </div>

                <div>
                  <div className="text-lg font-semibold">
                    <Link to={`/post/${post.slug}`} className="hover:underline">
                      {post.title || "Sem título"}
                    </Link>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {post.lead ||
                      (post.content ? post.content.slice(0, 160) + "…" : "")}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    <span>
                      Autor:{" "}
                      {post.author_name || post.author_id || "Desconhecido"}
                    </span>
                    <span className="mx-2">•</span>
                    <span>{post.slug}</span>
                    {post.category && (
                      <>
                        <span className="mx-2">•</span>
                        <span>{post.category}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-4">
                <div
                  className={`px-2 py-1 border rounded text-sm ${
                    STATUS_COLOR[post.status] || STATUS_COLOR.draft
                  }`}
                >
                  {STATUS_LABEL[post.status] || post.status}
                </div>

                <div className="text-xs text-gray-500 text-right">
                  {post.published_at
                    ? formatDate(post.published_at)
                    : "Não publicado"}
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
                  >
                    {deletingId === post.id ? "Removendo…" : "Remover"}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Mostrando {Math.min((page - 1) * pageSize + 1, total)}–
          {Math.min(page * pageSize, total)} de {total}
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
