// frontend/src/pages/admin/AdminPostForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createPost, updatePost, getAdminPosts } from '../../services/api';

/**
 * AdminPostForm — cria/edita posts com opção de "Agendar" (status = 'pending').
 * Comentários inline (ao lado das linhas) explicam o porquê.
 */

function isoToInputLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function inputLocalToIso(input) {
  if (!input) return null;
  const d = new Date(input); // trata input como local time
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

export default function AdminPostForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const nav = useNavigate();

  // campos
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [lead, setLead] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('draft'); // pode ser 'draft'|'published'|'pending'
  const [publishedAtInput, setPublishedAtInput] = useState(''); // formato datetime-local para o input
  const [featuredUrl, setFeaturedUrl] = useState('');

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    getAdminPosts()
      .then(data => {
        const post = data.find(p => String(p.id) === String(id));
        if (!post) throw new Error('Artigo não encontrado');
        setTitle(post.title || '');
        setSlug(post.slug || '');
        setLead(post.lead || '');
        setContent(post.content || '');
        setStatus(post.status || 'draft');
        setFeaturedUrl(post.featured_url || '');
        setPublishedAtInput(post.published_at ? isoToInputLocal(post.published_at) : '');
      })
      .catch(err => setError(err.message || 'Falha ao carregar article'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  // handler único para inputs simples
  function handleChange(e) {
    const { name, value } = e.target;
    if (name === 'title') setTitle(value);
    if (name === 'slug') setSlug(value);
    if (name === 'lead') setLead(value);
    if (name === 'content') setContent(value);
    if (name === 'featuredUrl') setFeaturedUrl(value);
    if (name === 'publishedAtInput') setPublishedAtInput(value);
  }

  // Quando muda status:
  function handleStatusChange(e) {
    const newStatus = e.target.value;
    setStatus(newStatus);

    if (newStatus === 'published') {
      // publicar agora por padrão se não houver data: preencher com 'agora'
      if (!publishedAtInput) {
        setPublishedAtInput(isoToInputLocal(new Date().toISOString()));
      }
    } else if (newStatus === 'pending') {
      // ao escolher "Agendar", limpar o input para forçar o editor a escolher uma data
      // (se preferires preencher com agora, poderíamos preencher aqui)
      if (!publishedAtInput) setPublishedAtInput(''); // deixa vazio para o utilizador escolher
    } else {
      // rascunho: remove data
      setPublishedAtInput('');
    }
  }

  async function onSave(e) {
    e.preventDefault();
    setError(null);

    // validações mínimas
    if (!title || title.trim().length < 3) { setError('Título obrigatório (3+ caracteres).'); return; }
    if (!slug || slug.trim().length < 3) { setError('Slug obrigatório (3+ caracteres).'); return; }

    // Se o utilizador escolheu 'pending', deve fornecer uma data futura
    if (status === 'pending') {
      if (!publishedAtInput) {
        setError('Para agendar, escolha data e hora de publicação.');
        return;
      }
      const iso = inputLocalToIso(publishedAtInput);
      if (!iso) { setError('Data de publicação inválida.'); return; }
      const d = new Date(iso);
      if (d.getTime() <= Date.now()) {
        setError('Para agendar, escolha uma data/hora no futuro.');
        return;
      }
    }

    setSaving(true);

    // montamos payload; enviamos published_at apenas se user preencheu
    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      lead: lead || null,
      content,
      categoryId: null,
      status, // 'pending' se o usuário escolheu agendar
      featuredUrl: featuredUrl || null
    };

    if (publishedAtInput) {
      const iso = inputLocalToIso(publishedAtInput);
      payload.published_at = iso; // ISO enviado para backend
    } // se não enviou published_at, backend decide (publish now se status==='published')

    try {
      if (isEdit) {
        await updatePost(id, payload);
      } else {
        await createPost(payload);
      }
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

        {/* content */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Conteúdo</label>
          <textarea name="content" value={content} onChange={handleChange} rows="10" className="mt-1 w-full p-2 border rounded font-mono" />
        </div>

        {/* status + agendamento */}
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-3">
            <label className="text-sm">Status</label>
            <select name="status" value={status} onChange={handleStatusChange} className="p-2 border rounded">
              <option value="draft">Rascunho</option>
              <option value="published">Publicar</option>
              <option value="pending">Agendar</option> {/* opcao nova */}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm">Data/hora de publicação</label>

            {/* input nativo que abre calendário/horário no browser */}
            <input
              name="publishedAtInput"
              type="datetime-local"
              value={publishedAtInput}
              onChange={handleChange}
              className="p-2 border rounded"
            />

            <div className="text-xs text-gray-500">
              Se deixar vazio e escolher "Publicar", o artigo é publicado agora.
            </div>
          </div>
        </div>

        {/* ações */}
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
