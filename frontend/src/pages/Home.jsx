// frontend/src/pages/Home.jsx
import { useEffect, useState } from 'react';
import { getPosts } from '../services/api';
import { Link } from 'react-router-dom';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    getPosts(meta.page, meta.pageSize)
      .then(json => {
        if (!mounted) return;
        setPosts(json.data || []);
      })
      .catch(err => {
        if (!mounted) return;
        console.error('getPosts error', err);
        setError(err.message || 'Failed to load posts');
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => { mounted = false; };
  }, [meta.page, meta.pageSize]);

  if (loading) {
    return <div className="p-6">Loading posts…</div>;
  }
  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600 font-semibold mb-2">Error</div>
        <div className="text-sm text-gray-700">{error}</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
      <div className="md:col-span-2 space-y-4">
        {posts.length === 0 && <div className="text-gray-600">No posts yet.</div>}
        {posts.map(p => (
          <article key={p.id} className="bg-white p-6 rounded-2xl shadow-sm border">
            <Link to={`/post/${p.slug}`} className="text-xl font-semibold hover:underline">
              {p.title}
            </Link>
            <div className="text-sm text-gray-500 mt-1">
              {p.published_at ? new Date(p.published_at).toLocaleString() : 'Draft'}
            </div>
            <p className="text-gray-700 mt-3">{p.lead || (p.content ? (p.content.slice(0, 160) + '…') : '')}</p>
          </article>
        ))}
      </div>

      <aside className="bg-white p-6 rounded-2xl shadow-sm border">
        <h3 className="font-semibold mb-3">Most read</h3>
        <div className="text-sm text-gray-600">Placeholder — implement backend read-count or analytics later.</div>
      </aside>
    </div>
  );
}
