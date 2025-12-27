// frontend/src/pages/admin/AdminPostForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createPost, updatePost, getAdminPosts } from '../../services/api';

export default function AdminPostForm() {
  const { id } = useParams(); // id is string or undefined
  const isEdit = Boolean(id);
  const nav = useNavigate();

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // form fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [lead, setLead] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('draft'); // draft | published
  const [featuredUrl, setFeaturedUrl] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    // load single post - backend doesn't have GET /posts/admin/:id, so we fetch admin list and find (simple)
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
      })
      .catch(err => setError(err.message || 'Failed to load post'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  async function onSave(e) {
    e.preventDefault();
    setError(null);
    if (!title || title.trim().length < 3) return setError('Title is required (3+ chars)');
    setSaving(true);

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      content,
      categoryId: null,
      status,
      featuredUrl
    };

    try {
      if (isEdit) {
        await updatePost(id, payload);
        nav('/admin/posts');
      } else {
        await createPost(payload);
        nav('/admin/posts');
      }
    } catch (err) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">{isEdit ? 'Edit post' : 'New post'}</h1>

      <form onSubmit={onSave} className="space-y-4 bg-white p-6 rounded shadow">
        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input value={title} onChange={e=>setTitle(e.target.value)} className="mt-1 w-full p-2 border rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Slug</label>
          <input value={slug} onChange={e=>setSlug(e.target.value)} className="mt-1 w-full p-2 border rounded" />
          <div className="text-xs text-gray-500 mt-1">URL friendly string (lowercase, hyphens)</div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Lead</label>
          <textarea value={lead} onChange={e=>setLead(e.target.value)} rows="3" className="mt-1 w-full p-2 border rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Featured image URL</label>
          <input value={featuredUrl} onChange={e=>setFeaturedUrl(e.target.value)} className="mt-1 w-full p-2 border rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Content (HTML allowed)</label>
          <textarea value={content} onChange={e=>setContent(e.target.value)} rows="10" className="mt-1 w-full p-2 border rounded font-mono" />
          <div className="text-xs text-gray-500 mt-1">You can paste HTML or plain text. Later we will integrate a rich editor.</div>
        </div>

        <div className="flex items-center gap-4">
          <select value={status} onChange={e=>setStatus(e.target.value)} className="p-2 border rounded">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <button className="px-4 py-2 bg-green-600 text-white rounded" disabled={saving}>
            {saving ? 'Saving…' : (isEdit ? 'Save changes' : 'Create post')}
          </button>
          <button type="button" onClick={() => history.back()} className="px-4 py-2 bg-gray-100 rounded">Cancel</button>
        </div>

        {error && <div className="text-red-600">{error}</div>}
      </form>
    </div>
  );
}
