// frontend/src/pages/admin/AdminPostForm.jsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createPost,
  updatePost,
  getAdminPosts,
  uploadFile,
} from "../../services/api"; // função uploadFile deve existir no api.js

// helpers para converter datetime-local <-> ISO
function isoToInputLocal(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}
function inputLocalToIso(input) {
  if (!input) return null;
  const d = new Date(input); // trata input como local time do browser
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

export default function AdminPostForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const nav = useNavigate();

  // -------------- form state (hooks devem estar AQUI dentro do componente) --------------
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [lead, setLead] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("draft"); // 'draft'|'published'|'pending'
  const [publishedAtInput, setPublishedAtInput] = useState(""); // string para input datetime-local
  const [featuredUrl, setFeaturedUrl] = useState("");

  // estados para upload/preview (OBRIGATÓRIO dentro do componente)
  const [file, setFile] = useState(null); // File object selecionado
  const [filePreview, setFilePreview] = useState(""); // dataURL para mostrar preview

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // -------------- load post quando estamos em edição --------------
  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    getAdminPosts()
      .then((data) => {
        const post = data.find((p) => String(p.id) === String(id));
        if (!post) throw new Error("Artigo não encontrado");
        setTitle(post.title || "");
        setSlug(post.slug || "");
        setLead(post.lead || "");
        setContent(post.content || "");
        setStatus(post.status || "draft");
        setFeaturedUrl(post.featured_url || "");
        setPublishedAtInput(post.published_at ? isoToInputLocal(post.published_at) : "");
      })
      .catch((err) => setError(err.message || "Falha ao carregar artigo"))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  // -------------- file input handler (dentro do componente: tem acesso a setError) --------------
  function handleFileChange(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) {
      setFile(null);
      setFilePreview("");
      return;
    }

    // validação cliente (tipo e tamanho)
    if (!f.type.startsWith("image/")) {
      setError("Apenas imagens são permitidas.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("Imagem muito grande (máx 5MB).");
      return;
    }

    setError(null); // limpar erro anterior
    setFile(f);

    // criar preview (usamos FileReader para suportar mais browsers)
    const reader = new FileReader();
    reader.onload = (ev) => setFilePreview(ev.target.result);
    reader.readAsDataURL(f);
  }

  // handler genérico para inputs simples
  function handleChange(e) {
    const { name, value } = e.target;
    if (name === "title") setTitle(value);
    if (name === "slug") setSlug(value);
    if (name === "lead") setLead(value);
    if (name === "content") setContent(value);
    if (name === "featuredUrl") setFeaturedUrl(value);
    if (name === "publishedAtInput") setPublishedAtInput(value);
  }

  // status change: ajustar publishedAtInput conforme opção escolhida
  function handleStatusChange(e) {
    const newStatus = e.target.value;
    setStatus(newStatus);

    if (newStatus === "published") {
      // se não houver data definida, publica agora por padrão (preenche o input)
      if (!publishedAtInput) {
        setPublishedAtInput(isoToInputLocal(new Date().toISOString()));
      }
    } else if (newStatus === "pending") {
      // se agendar, limpamos para forçar escolha de data (UX)
      if (!publishedAtInput) setPublishedAtInput("");
    } else {
      // draft: remove data
      setPublishedAtInput("");
    }
  }

  // -------------- onSave: envia ficheiro (se houver) e depois cria/atualiza post --------------
  async function onSave(e) {
    e.preventDefault();
    setError(null);

    // validações básicas do form
    if (!title || title.trim().length < 3) {
      setError("Título obrigatório (3+ caracteres).");
      return;
    }
    if (!slug || slug.trim().length < 3) {
      setError("Slug obrigatório (3+ caracteres).");
      return;
    }

    // se escolher "pending" (agendar), obrigar data futura válida
    if (status === "pending") {
      if (!publishedAtInput) {
        setError("Para agendar, escolha data e hora de publicação.");
        return;
      }
      const iso = inputLocalToIso(publishedAtInput);
      if (!iso) {
        setError("Data de publicação inválida.");
        return;
      }
      if (new Date(iso).getTime() <= Date.now()) {
        setError("Para agendar, escolha uma data/hora no futuro.");
        return;
      }
    }

    setSaving(true);

    try {
      // 1) se existe ficheiro selecionado, faz upload primeiro e usa a URL retornada
      let featuredUrlToSend = featuredUrl || null;
      if (file) {
        // uploadFile faz POST /uploads e retorna { ok: true, url }
        const uploadResp = await uploadFile(file);
        if (!uploadResp || !uploadResp.url) {
          throw new Error("Falha no upload da imagem");
        }
        featuredUrlToSend = uploadResp.url;
      }

      // 2) montar payload com published_at se preenchido
      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        lead: lead || null,
        content,
        categoryId: null,
        status, // 'pending' se o usuário escolheu agendar
        featuredUrl: featuredUrlToSend || null,
      };

      if (publishedAtInput) {
        const iso = inputLocalToIso(publishedAtInput);
        payload.published_at = iso; // ISO enviado ao backend
      }

      // 3) chamar endpoint correto
      if (isEdit) {
        await updatePost(id, payload);
      } else {
        await createPost(payload);
      }

      // 4) navegar de volta para a lista admin
      nav("/admin/posts");
    } catch (err) {
      setError(err.message || "Falha ao salvar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6">Carregando artigo…</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">{isEdit ? "Editar artigo" : "Novo artigo"}</h1>

      <form onSubmit={onSave} className="space-y-4 bg-white p-6 rounded shadow">
        {/* título */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Título</label>
          <input name="title" value={title} onChange={handleChange} className="mt-1 w-full p-2 border rounded" />
        </div>

        {/* slug */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Slug (URL)</label>
          <input name="slug" value={slug} onChange={handleChange} className="mt-1 w-full p-2 border rounded" />
        </div>

        {/* lead / excerpt */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Resumo (excerpt)</label>
          <textarea name="lead" value={lead} onChange={handleChange} rows="3" className="mt-1 w-full p-2 border rounded" />
        </div>

        {/* conteúdo */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Conteúdo</label>
          <textarea name="content" value={content} onChange={handleChange} rows="10" className="mt-1 w-full p-2 border rounded font-mono" />
        </div>

        {/* imagem de destaque */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Imagem de destaque</label>

          {/* preview: primeiro o preview local (filePreview), se não, imagem já salva (featuredUrl) */}
          {filePreview ? (
            <img src={filePreview} alt="Preview" className="w-full max-h-64 object-cover rounded mt-2 mb-2" />
          ) : featuredUrl ? (
            <img src={featuredUrl} alt="Featured" className="w-full max-h-64 object-cover rounded mt-2 mb-2" />
          ) : null}

          <input type="file" accept="image/*" onChange={handleFileChange} className="mt-2" />
          <div className="text-xs text-gray-500 mt-1">PNG/JPG/WEBP até 5MB. Preview será exibido antes do upload.</div>
        </div>

        {/* status + agendamento */}
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-3">
            <label className="text-sm">Status</label>
            <select name="status" value={status} onChange={handleStatusChange} className="p-2 border rounded">
              <option value="draft">Rascunho</option>
              <option value="published">Publicar</option>
              <option value="pending">Agendar</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm">Data/hora de publicação</label>

            <input name="publishedAtInput" type="datetime-local" value={publishedAtInput} onChange={handleChange} className="p-2 border rounded" />

            <div className="text-xs text-gray-500">Se deixar vazio e escolher "Publicar", o artigo é publicado agora.</div>
          </div>
        </div>

        {/* ações */}
        <div className="flex items-center gap-3">
          <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded" disabled={saving}>
            {saving ? "Gravando…" : isEdit ? "Salvar alterações" : "Criar artigo"}
          </button>
          <button type="button" onClick={() => nav(-1)} className="px-4 py-2 bg-gray-100 rounded">Cancelar</button>
        </div>

        {error && <div className="text-red-600">{error}</div>}
      </form>
    </div>
  );
}
