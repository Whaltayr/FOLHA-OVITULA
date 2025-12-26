// src/pages/PostDetail.jsx
import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getPostBySlug } from '../services/api';
import DOMPurify from 'dompurify';

export default function PostDetail() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(Boolean(slug));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);

    getPostBySlug(slug)
      .then(json => {
        // tolerate both shapes: { post: {...} } or {...}
        const resolved = json?.post ?? json;
        setPost(resolved || null);
      })
      .catch(err => {
        console.error('getPostBySlug error', err);
        setError(err.message || 'Failed to load post');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="p-6">Loading post…</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!post) return <div className="p-6">Post not found</div>;

  const safeHtml = DOMPurify.sanitize(post.content || '');

  return (
    <article className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
      <div className="text-sm text-gray-500 mb-4">
        {post.published_at ? new Date(post.published_at).toLocaleString() : 'Draft'}
      </div>

      {post.featured_url && (
        <img src={post.featured_url} alt={post.title} className="w-full rounded mb-6 object-cover" />
      )}

      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: safeHtml }} />

      <Link to="/" className="inline-block mt-6 text-sm text-gray-700 hover:underline">← Back</Link>
    </article>
  );
}
