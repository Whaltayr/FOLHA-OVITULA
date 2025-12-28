// frontend/src/pages/admin/AdminPostForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createPost, updatePost, getAdminPosts } from '../../services/api';

/**
 * AdminPostForm
 * - cria e edita posts
 * - garante que published_at será preenchido quando o admin marcar "Published"
 * - usa getAdminPosts() para buscar o post no modo edição (simples workaround)
 */

export default function AdminPostForm() {
  const { id } = useParams();               // id da rota: /admin/posts/:id/edit
  const isEdit = Boolean(id);
  const nav = useNavigate();

  // form state — guardamos published_at explicitamente
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [lead, setLead] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('draft'); // 'draft' | 'published'
  const [publishedAt, setPublishedAt] = useState(null); // ISO string or null
  const [featuredUrl, setFeaturedUrl] = useState('');

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Load post when editing — simple approach: fetch admin list and find by id
  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    getAdminPosts()
      .then(data => {
        const post = data.find(p => String(p.id) === String(id));
        if (!post) throw new Error('Post not found');
        setTitle(post.title || '');
        setSlug(post.slug || '');
        setLead(post.lead || '');
        setContent(post.content || '');
        setStatus(post.status || 'draft');
        setFeaturedUrl(post.featured_url || '');
        setPublishedAt(post.published_at ? new Date(post.published_at).toISOString() : null);
      })
      .catch(err => setError(err.message || 'Failed to load post'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  // Handler for regular inputs
  function handleChange(e) {
    const { name, value } = e.target;
    if (name === 'title') setTitle(value);
    if (name === 'slug') setSlug(value);
    if (name === 'lead') setLead(value);
    if (name === 'content') setContent(value);
    if (name === 'featuredUrl') setFeaturedUrl(value);
  }

  /**
   * Handle status change:
   * - If admin selects "published" now and there is no publishedAt,
   *   we set publishedAt to the current time (ISO) so backend receives it.
   * - If admin selects "draft" we clear publishedAt (so post becomes unpublished).
   */
  function handleStatusChange(e) {
    const newStatus = e.target.value;
    setStatus(newStatus);

    if (newStatus === 'published') {
      // If already has a publishedAt keep it (preserve original publish time).
      // Otherwise set to now — this ensures published_at won't be null.
      setPublishedAt(prev => prev || new Date().toISOString());
    } else {
      // switching back to draft removes published_at
      setPublishedAt(null);
    }
  }

  async function onSave(e) {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!title || title.trim().length < 3) {
      setError('Title is required (3+ chars).');
      return;
    }
    if (!slug || slug.trim().length < 3) {
      setError('Slug is required (3+ chars).');
      return;
    }

    setSaving(true);
    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      content,
      categoryId: null,
      status,
      featuredUrl: featuredUrl || null,
      // publish time: send null or ISO string
      published_at: publishedAt || null
    };

    try {
      if (isEdit) {
        await updatePost(id, payload);
      } else {
        await createPost(payload);
      }
      nav('/admin/posts');
    } catch (err) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6">Loading post…</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">{isEdit ? 'Edit post' : 'New post'}</h1>

      <form onSubmit={onSave} className="space-y-4 bg-white p-6 rounded shadow">
        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input name="title" value={title} onChange={handleChange} className="mt-1 w-full p-2 border rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Slug</label>
          <input name="slug" value={slug} onChange={handleChange} className="mt-1 w-full p-2 border rounded" />
          <div className="text-xs text-gray-500 mt-1">URL-friendly: lowercase, hyphens.</div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Lead</label>
          <textarea name="lead" value={lead} onChange={handleChange} rows="3" className="mt-1 w-full p-2 border rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Featured image URL</label>
          <input name="featuredUrl" value={featuredUrl} onChange={handleChange} className="mt-1 w-full p-2 border rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Content (HTML allowed)</label>
          <textarea name="content" value={content} onChange={handleChange} rows="10" className="mt-1 w-full p-2 border rounded font-mono" />
          <div className="text-xs text-gray-500 mt-1">You can paste HTML or plain text. We'll add WYSIWYG later.</div>
        </div>

        <div className="flex items-center gap-4">
          <label className="text-sm">Status</label>
          <select value={status} onChange={handleStatusChange} className="p-2 border rounded">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>

          <div className="text-xs text-gray-500">
            Publish time: {publishedAt ? new Date(publishedAt).toLocaleString() : 'not set'}
          </div>

          <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded" disabled={saving}>
            {saving ? 'Saving…' : (isEdit ? 'Save changes' : 'Create post')}
          </button>

          <button type="button" onClick={() => history.back()} className="px-4 py-2 bg-gray-100 rounded">Cancel</button>
        </div>

        {error && <div className="text-red-600">{error}</div>}
      </form>
    </div>
  );
}
