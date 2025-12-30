// frontend/src/pages/admin/AdminPostForm.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createPost, updatePost, getAdminPosts, uploadFile, getCategories } from '../../services/api';

/* util: transforma ISO <-> input datetime-local */
function isoToInputLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [lead, setLead] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('draft'); // draft | published | pending
  const [publishedAtInput, setPublishedAtInput] = useState(''); // datetime-local value
  const [featuredUrl, setFeaturedUrl] = useState('');
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState(null);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // carregar categorias
  useEffect(() => {
    getCategories().then(arr => setCategories(Array.isArray(arr) ? arr : [])).catch(()=>{});
  }, []);

  // se edição: buscar post (simples: getAdminPosts e find by id)
  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    getAdminPosts()
      .then(data => {
        const post = (Array.isArray(data) ? data : []).find(p => String(p.id) === String(id));
        if (!post) throw new Error('Artigo não encontrado');
        setTitle(post.title || '');
        setSlug(post.slug || '');
        setLead(post.lead || '');
        setContent(post.content || '');
        setStatus(post.status || 'draft');
        setFeaturedUrl(post.featured_url || '');
        setCategoryId(post.category_id || null);
        setPublishedAtInput(post.published_at ? isoToInputLocal(post.published_at) : '');
      })
      .catch(err => setError(err.message || 'Falha ao carregar artigo'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  // file input handler (preview)
  function handleFileChange(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) {
      setFile(null); setFilePreview(''); return;
    }
    if (!f.type.startsWith('image/')) { setError('Apenas imagens são permitidas'); return; }
    if (f.size > 5 * 1024 * 1024) { setError('Imagem muito grande (máx 5MB)'); return; }
    setFile(f);
    const reader = new FileReader();
    reader.onload = ev => setFilePreview(ev.target.result);
    reader.readAsDataURL(f);
  }

  function handleStatusChange(e) {
    const newStatus = e.target.value;
    setStatus(newStatus);
    if (newStatus === 'published') {
      if (!publishedAtInput) setPublishedAtInput(isoToInputLocal(new Date().toISOString())); // publicar agora
    } else if (newStatus === 'pending') {
      // clear to require user to choose date
      setPublishedAtInput('');
    } else {
      setPublishedAtInput('');
    }
  }

  async function onSave(e) {
    e.preventDefault();
    setError(null);

    if (!title || title.trim().length < 3) { setError('Título obrigatório (3+ caracteres).'); return; }
    if (!slug || slug.trim().length < 3) { setError('Slug obrigatório (3+ caracteres).'); return; }

    // se pending: precisa de data futura
    if (status === 'pending') {
      if (!publishedAtInput) { setError('Para agendar, escolha data e hora'); return; }
      const iso = inputLocalToIso(publishedAtInput);
      if (!iso) { setError('Data inválida'); return; }
      if (new Date(iso).getTime() <= Date.now()) { setError('Para agendar, escolha data/hora no futuro'); return; }
    }

    setSaving(true);

    try {
      // se há ficheiro novo: subir primeiro e obter featuredUrl
      let finalFeatured = featuredUrl || null;
      if (file) {
        const up = await uploadFile(file); // retorna { ok:true, url }
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
      };
      if (publishedAtInput) payload.published_at = inputLocalToIso(publishedAtInput); // enviar ISO
      // se não enviar published_at e status==='published', backend decidirá NOW()

      if (isEdit) {
        await updatePost(id, payload);
      } else {
        await createPost(payload);
      }
      nav: nav('/admin/posts'); // redirect
      nav('/admin/posts');
    } catch (err) {
      setError(err.message || 'Falha ao salvar');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6">Carregando artigo…</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">{isEdit ? 'Editar artigo' : 'Novo artigo'}</h1>

      <form onSubmit={onSave} className="space-y-4 bg-white p-6 rounded shadow">
        <div>
          <label className="block text-sm font-medium text-gray-700">Título</label>
          <input name="title" value={title} onChange={e=>setTitle(e.target.value)} className="mt-1 w-full p-2 border rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Slug (URL)</label>
          <input name="slug" value={slug} onChange={e=>setSlug(e.target.value)} className="mt-1 w-full p-2 border rounded" />
          <div className="text-xs text-gray-500 mt-1">Somente minúsculas e hífens — será parte da URL.</div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Resumo (excerpt)</label>
          <textarea name="lead" value={lead} onChange={e=>setLead(e.target.value)} rows="3" className="mt-1 w-full p-2 border rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Categoria</label>
          <select value={categoryId || ''} onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : null)} className="mt-1 w-full p-2 border rounded">
            <option value=''>Sem categoria</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Conteúdo (HTML ou texto)</label>
          <textarea name="content" value={content} onChange={e=>setContent(e.target.value)} rows="10" className="mt-1 w-full p-2 border rounded font-mono" />
          <div className="text-xs text-gray-500 mt-1">Pode colar HTML simples; depois adicionamos editor WYSIWYG.</div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Imagem de destaque</label>
          {filePreview ? <img src={filePreview} alt="Preview" className="w-full max-h-64 object-cover rounded mt-2 mb-2" /> :
            featuredUrl ? <img src={featuredUrl} alt="Featured" className="w-full max-h-64 object-cover rounded mt-2 mb-2" /> : null}
          <input type="file" accept="image/*" onChange={handleFileChange} className="mt-2" />
          <div className="text-xs text-gray-500 mt-1">PNG/JPG/WEBP até 5MB. Preview será exibido antes do upload.</div>
        </div>

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
            <input name="publishedAtInput" type="datetime-local" value={publishedAtInput} onChange={e=>setPublishedAtInput(e.target.value)} className="p-2 border rounded" />
            <div className="text-xs text-gray-500">Se vazio e escolher "Publicar", será publicado agora.</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded" disabled={saving}>
            {saving ? 'Gravando…' : (isEdit ? 'Salvar alterações' : 'Criar artigo')}
          </button>
          <button type="button" onClick={() => history.back()} className="px-4 py-2 bg-gray-100 rounded">Cancelar</button>
        </div>

        {error && <div className="text-red-600">{error}</div>}
      </form>
    </div>
  );
}
