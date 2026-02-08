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

  // Estados do Formulário
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [lead, setLead] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('draft'); 
  const [publishedAtInput, setPublishedAtInput] = useState(''); 
  const [featuredUrl, setFeaturedUrl] = useState('');
  
  // NOVOS ESTADOS (Multimédia)
  const [type, setType] = useState('article'); // 'article', 'video', 'audio'
  const [videoUrl, setVideoUrl] = useState(''); // Link do YouTube/Facebook

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

  // carregar dados do post se for edição
  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    getAdminPosts()
      .then(data => {
        const post = (Array.isArray(data) ? data : []).find(p => String(p.id) === String(id));
        if (!post) throw new Error('Artigo não encontrado');
        
        // Preencher o formulário
        setTitle(post.title || '');
        setSlug(post.slug || '');
        setLead(post.lead || '');
        setContent(post.content || '');
        setStatus(post.status || 'draft');
        setFeaturedUrl(post.featured_url || '');
        setCategoryId(post.category_id || null);
        setPublishedAtInput(post.published_at ? isoToInputLocal(post.published_at) : '');
        
        // Preencher novos campos
        setType(post.type || 'article');
        setVideoUrl(post.video_url || '');
      })
      .catch(err => setError(err.message || 'Falha ao carregar artigo'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  // Handler de Imagem
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

  // Handler de Status
  function handleStatusChange(e) {
    const newStatus = e.target.value;
    setStatus(newStatus);
    if (newStatus === 'published' && !publishedAtInput) {
       setPublishedAtInput(isoToInputLocal(new Date().toISOString())); 
    }
  }

  // Salvar
  async function onSave(e) {
    e.preventDefault();
    setError(null);

    if (!title || title.trim().length < 3) { setError('Título obrigatório (3+ caracteres).'); return; }
    if (!slug || slug.trim().length < 3) { setError('Slug obrigatório (3+ caracteres).'); return; }

    if (status === 'pending') {
      if (!publishedAtInput) { setError('Para agendar, escolha data e hora'); return; }
      const iso = inputLocalToIso(publishedAtInput);
      if (new Date(iso).getTime() <= Date.now()) { setError('Para agendar, escolha data/hora no futuro'); return; }
    }

    setSaving(true);

    try {
      // Upload de imagem se houver
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
        // Novos campos enviados ao backend
        type, 
        video_url: videoUrl || null 
      };

      if (publishedAtInput) payload.published_at = inputLocalToIso(publishedAtInput);

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
    <div className="max-w-4xl mx-auto p-6 pb-20">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
        {isEdit ? 'Editar Artigo' : 'Novo Artigo'}
      </h1>

      <form onSubmit={onSave} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Coluna Principal (Esquerda) */}
        <div className="md:col-span-2 space-y-5 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          
          {/* Título */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Título</label>
            <input 
              name="title" 
              value={title} 
              onChange={e=> {
                 setTitle(e.target.value);
                 // Auto-slug simples se for criação
                 if (!isEdit) setSlug(e.target.value.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, ''));
              }} 
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="Digite o título da notícia..."
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Slug (URL amigável)</label>
            <input 
              name="slug" 
              value={slug} 
              onChange={e=>setSlug(e.target.value)} 
              className="w-full p-2 bg-gray-50 border border-gray-300 rounded text-sm font-mono text-gray-600" 
            />
          </div>

          {/* Tipo de Post e Link de Vídeo */}
          <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
            <label className="block text-sm font-semibold text-blue-800 mb-2">Formato do Post</label>
            <div className="flex gap-4 mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="type" value="article" checked={type === 'article'} onChange={() => setType('article')} />
                <span>📰 Artigo Padrão</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="type" value="video" checked={type === 'video'} onChange={() => setType('video')} />
                <span>🎬 Vídeo</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="type" value="audio" checked={type === 'audio'} onChange={() => setType('audio')} />
                <span>🎧 Áudio</span>
              </label>
            </div>

            {/* Input Condicional: Só aparece se for Video ou Audio */}
            {(type === 'video' || type === 'audio') && (
              <div>
                <label className="block text-sm font-medium text-blue-800 mb-1">
                  Link do {type === 'video' ? 'Vídeo (YouTube/Facebook)' : 'Áudio (MP3/SoundCloud)'}
                </label>
                <input 
                  value={videoUrl} 
                  onChange={e => setVideoUrl(e.target.value)}
                  placeholder={type === 'video' ? "https://youtube.com/watch?v=..." : "https://..."}
                  className="w-full p-2 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* Resumo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lead / Resumo</label>
            <textarea name="lead" value={lead} onChange={e=>setLead(e.target.value)} rows="3" className="w-full p-2 border border-gray-300 rounded" />
          </div>

          {/* Conteúdo Principal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Conteúdo (HTML)</label>
            <textarea name="content" value={content} onChange={e=>setContent(e.target.value)} rows="12" className="w-full p-2 border border-gray-300 rounded font-mono text-sm bg-gray-50" />
            <p className="text-xs text-gray-400 mt-1 text-right">Suporta HTML básico</p>
          </div>
        </div>

        {/* Coluna Lateral (Direita) */}
        <div className="space-y-6">
          
          {/* Publicação */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-700 mb-3 border-b pb-2">Publicação</h3>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">Status</label>
              <select name="status" value={status} onChange={handleStatusChange} className="w-full p-2 border rounded bg-white">
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
                onChange={e=>setPublishedAtInput(e.target.value)} 
                className="w-full p-2 border rounded text-sm" 
              />
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <button 
                onClick={onSave} 
                disabled={saving}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors flex justify-center items-center"
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                ) : null}
                {isEdit ? 'Atualizar Post' : 'Publicar Post'}
              </button>
            </div>
          </div>

          {/* Categoria e Imagem */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-700 mb-3 border-b pb-2">Detalhes</h3>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">Categoria</label>
              <select value={categoryId || ''} onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : null)} className="w-full p-2 border rounded bg-white">
                <option value=''>-- Sem categoria --</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Imagem de Capa</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 text-center bg-gray-50 hover:bg-gray-100 transition cursor-pointer relative">
                
                {filePreview || featuredUrl ? (
                  <img src={filePreview || featuredUrl} alt="Capa" className="w-full h-40 object-cover rounded" />
                ) : (
                  <div className="py-8 text-gray-400 text-sm">
                    Clique para upload<br/>ou arraste
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
            <div className="bg-red-50 text-red-600 p-3 rounded text-sm border border-red-200">
              🚨 {error}
            </div>
          )}

        </div>
      </form>
    </div>
  );
}