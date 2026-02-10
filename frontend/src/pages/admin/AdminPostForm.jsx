// frontend/src/pages/admin/AdminPostForm.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import RichTextEditor from "../../components/RichTextEditor";
import {
  createPost,
  updatePost,
  getAdminPosts,
  uploadFile,
  getCategories,
} from "../../services/api";

/* util: transforma ISO <-> input datetime-local */
function isoToInputLocal(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function inputLocalToIso(input) {
  if (!input) return null;
  const d = new Date(input);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

export default function AdminPostForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const nav = useNavigate();

  // Estados do Formulário
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [lead, setLead] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("draft");
  const [publishedAtInput, setPublishedAtInput] = useState("");
  const [featuredUrl, setFeaturedUrl] = useState("");

  // NOVOS ESTADOS (Multimédia)
  const [type, setType] = useState("article");
  const [videoUrl, setVideoUrl] = useState("");

  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState("");
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState(null);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Carregar categorias
  useEffect(() => {
    getCategories()
      .then((arr) => setCategories(Array.isArray(arr) ? arr : []))
      .catch(() => {});
  }, []);

  // Carregar dados do post se for edição
  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    getAdminPosts()
      .then((data) => {
        const post = (Array.isArray(data) ? data : []).find(
          (p) => String(p.id) === String(id),
        );
        if (!post) throw new Error("Artigo não encontrado");

        // Preencher o formulário
        setTitle(post.title || "");
        setSlug(post.slug || "");
        setLead(post.lead || "");
        setContent(post.content || "");
        setStatus(post.status || "draft");
        setFeaturedUrl(post.featured_url || "");
        setCategoryId(post.category_id || null);
        setPublishedAtInput(
          post.published_at ? isoToInputLocal(post.published_at) : "",
        );

        // Preencher novos campos
        setType(post.type || "article");
        setVideoUrl(post.video_url || "");
      })
      .catch((err) => setError(err.message || "Falha ao carregar artigo"))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  // Handler de Imagem
  function handleFileChange(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) {
      setFile(null);
      setFilePreview("");
      return;
    }
    if (!f.type.startsWith("image/")) {
      setError("Apenas imagens são permitidas");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("Imagem muito grande (máx 5MB)");
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setFilePreview(ev.target.result);
    reader.readAsDataURL(f);
  }

  // Handler de Status
  function handleStatusChange(e) {
    const newStatus = e.target.value;
    setStatus(newStatus);
    if (newStatus === "published" && !publishedAtInput) {
      setPublishedAtInput(isoToInputLocal(new Date().toISOString()));
    }
  }

  // Salvar
  async function onSave(e) {
    e.preventDefault();
    setError(null);

    if (!title || title.trim().length < 3) {
      setError("Título obrigatório (3+ caracteres).");
      return;
    }
    if (!slug || slug.trim().length < 3) {
      setError("Slug obrigatório (3+ caracteres).");
      return;
    }

    if (status === "pending") {
      if (!publishedAtInput) {
        setError("Para agendar, escolha data e hora");
        return;
      }
      const iso = inputLocalToIso(publishedAtInput);
      if (new Date(iso).getTime() <= Date.now()) {
        setError("Para agendar, escolha data/hora no futuro");
        return;
      }
    }

    setSaving(true);

    try {
      let finalFeatured = featuredUrl || null;
      if (file) {
        const up = await uploadFile(file);
        if (up && up.url) finalFeatured = up.url;
      }

      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        lead: lead || null,
        content,
        categoryId: categoryId || null,
        status,
        featuredUrl: finalFeatured || null,
        type,
        video_url: videoUrl || null,
      };

      if (publishedAtInput)
        payload.published_at = inputLocalToIso(publishedAtInput);

      if (isEdit) {
        await updatePost(id, payload);
      } else {
        await createPost(payload);
      }
      nav("/admin/posts");
    } catch (err) {
      setError(err.message || "Falha ao salvar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6">Carregando artigo…</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 pb-20">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
        {isEdit ? "Editar Artigo" : "Novo Artigo"}
      </h1>

      <form onSubmit={onSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* === COLUNA PRINCIPAL (ESQUERDA) === */}
        <div className="lg:col-span-2 space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          
          {/* Título */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Título
            </label>
            <input
              name="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!isEdit)
                  setSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/ /g, "-")
                      .replace(/[^\w-]/g, "")
                  );
              }}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-lg font-medium"
              placeholder="Digite o título da notícia..."
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Slug (URL amigável)
            </label>
            <input
              name="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full p-2 bg-gray-50 border border-gray-300 rounded text-sm font-mono text-gray-600"
            />
          </div>

          {/* Tipo de Post e Link de Vídeo/Áudio */}
          <div className="bg-blue-50 p-5 rounded-lg border border-blue-100">
            <label className="block text-sm font-bold text-blue-800 mb-3">
              Formato do Post
            </label>
            <div className="flex flex-wrap gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded border border-blue-200 hover:border-blue-400 transition">
                <input
                  type="radio"
                  name="type"
                  value="article"
                  checked={type === "article"}
                  onChange={() => setType("article")}
                />
                <span>📰 Artigo</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded border border-blue-200 hover:border-blue-400 transition">
                <input
                  type="radio"
                  name="type"
                  value="video"
                  checked={type === "video"}
                  onChange={() => setType("video")}
                />
                <span>🎬 Vídeo</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded border border-blue-200 hover:border-blue-400 transition">
                <input
                  type="radio"
                  name="type"
                  value="audio"
                  checked={type === "audio"}
                  onChange={() => setType("audio")}
                />
                <span>🎧 Áudio</span>
              </label>
            </div>

            {/* Input Condicional: Vídeo ou Áudio */}
            {(type === "video" || type === "audio") && (
              <div className="animate-fadeIn">
                <label className="block text-sm font-medium text-blue-800 mb-1">
                  {type === "video"
                    ? "Link do Vídeo (YouTube/Facebook)"
                    : "Áudio (Link ou Upload MP3)"}
                </label>
                
                <div className="flex gap-2">
                  <input
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder={type === "video" ? "https://youtube.com/..." : "https://... ou upload ao lado"}
                    className="flex-1 p-2 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  {/* Botão de Upload rápido para áudio */}
                  {type === "audio" && (
                    <div className="relative overflow-hidden">
                      <button type="button" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition text-sm font-medium">
                        Upload MP3
                      </button>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={async (e) => {
                          const f = e.target.files[0];
                          if (f) {
                            setSaving(true);
                            try {
                              const res = await uploadFile(f);
                              setVideoUrl(res.url);
                            } catch (err) {
                              setError("Falha no upload do áudio");
                            } finally {
                              setSaving(false);
                            }
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  )}
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  {type === "video" 
                    ? "Cole o link do YouTube para ativar o player." 
                    : "Cole um link externo ou faça upload do ficheiro MP3."}
                </p>
              </div>
            )}
          </div>

          {/* === AQUI ESTÁ O QUE FALTAVA: LEAD / RESUMO === */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Lead / Resumo (Aparece na Home)
            </label>
            <textarea
              name="lead"
              value={lead}
              onChange={(e) => setLead(e.target.value)}
              rows="3"
              className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Escreva um resumo curto e atrativo..."
            />
          </div>

          {/* Conteúdo Rico */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Conteúdo da Notícia
            </label>
            <div className="prose-editor">
              <RichTextEditor value={content} onChange={setContent} />
            </div>
            <p className="text-xs text-gray-400 mt-1 text-right">
              Arraste imagens para o editor ou use a barra de ferramentas.
            </p>
          </div>
        </div>

        {/* === COLUNA LATERAL (DIREITA) === */}
        <div className="space-y-6">
          
          {/* Publicação */}
          <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">
              Publicação
            </h3>

            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">Status</label>
              <select
                name="status"
                value={status}
                onChange={handleStatusChange}
                className="w-full p-2 border rounded bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="draft">📝 Rascunho</option>
                <option value="published">✅ Publicado</option>
                <option value="pending">📅 Agendado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Data</label>
              <input
                type="datetime-local"
                value={publishedAtInput}
                onChange={(e) => setPublishedAtInput(e.target.value)}
                className="w-full p-2 border rounded text-sm"
              />
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={onSave}
                disabled={saving}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow transition-all flex justify-center items-center"
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                ) : null}
                {isEdit ? "Atualizar Post" : "Publicar Post"}
              </button>
            </div>
          </div>

          {/* Categoria e Imagem */}
          <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">
              Detalhes
            </h3>

            <div className="mb-5">
              <label className="block text-sm text-gray-600 mb-1">
                Categoria
              </label>
              <select
                value={categoryId || ""}
                onChange={(e) =>
                  setCategoryId(e.target.value ? Number(e.target.value) : null)
                }
                className="w-full p-2 border rounded bg-white"
              >
                <option value="">-- Sem categoria --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Imagem de Capa
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 text-center bg-gray-50 hover:bg-gray-100 transition cursor-pointer relative group">
                {filePreview || featuredUrl ? (
                  <div className="relative">
                    <img
                      src={filePreview || featuredUrl}
                      alt="Capa"
                      className="w-full h-40 object-cover rounded"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs transition-opacity rounded">
                      Clique para alterar
                    </div>
                  </div>
                ) : (
                  <div className="py-10 text-gray-400 text-sm">
                    <span className="text-2xl block mb-2">📷</span>
                    Clique para upload
                    <br />
                    ou arraste
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded text-sm border border-red-200 shadow-sm animate-pulse">
              <strong>Erro:</strong> {error}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}