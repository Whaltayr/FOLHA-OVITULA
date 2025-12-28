// frontend/src/pages/PostDetail.jsx
import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getPostBySlug } from "../services/api";
import DOMPurify from "dompurify";

function formatDate(dt) {
  try {
    return new Date(dt).toLocaleString();
  } catch (e) {
    return "—";
  }
}

function SocialShare({ url, title }) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title || "");
  const twitter = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  const whatsapp = `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`;
  return (
    <div className="flex gap-3 mt-4">
      <a
        className="text-sm px-3 py-2 bg-sky-50 border rounded hover:bg-sky-100"
        target="_blank"
        rel="noreferrer"
        href={twitter}
      >
        Share Twitter
      </a>
      <a
        className="text-sm px-3 py-2 bg-blue-50 border rounded hover:bg-blue-100"
        target="_blank"
        rel="noreferrer"
        href={fb}
      >
        Share Facebook
      </a>
      <a
        className="text-sm px-3 py-2 bg-emerald-50 border rounded hover:bg-emerald-100"
        target="_blank"
        rel="noreferrer"
        href={whatsapp}
      >
        Share WhatsApp
      </a>
    </div>
  );
}

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
      .then((json) => {
        const resolved = json?.post ?? json;
        setPost(resolved || null);
        // set page title + meta
        if (resolved?.title)
          document.title = `${resolved.title} — Folha Ovitula`;
      })
      .catch((err) => {
        console.error("getPostBySlug error", err);
        setError(err.message || "Failed to load post");
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading)
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!post) return <div className="p-6">Post not found</div>;

  const safeHtml = DOMPurify.sanitize(post.content || "");

  return (
    <article className="max-w-3xl mx-auto p-6">
      <Link to="/" className="text-sm text-gray-600 hover:underline">
        ← Voltar
      </Link>

      <h1 className="text-3xl font-extrabold mt-4">{post.title}</h1>

      <div className="flex items-center gap-3 text-sm text-gray-500 mt-2">
        <div>{post.author_name || "Folha Ovitula"}</div>
        <div>•</div>
        <div>{post.published_at ? formatDate(post.published_at) : "Draft"}</div>
        {post.category && (
          <>
            <div>•</div>
            <div className="text-xs px-2 py-1 bg-gray-100 rounded">
              {post.category}
            </div>
          </>
        )}
      </div>

      {post.featured_url ? (
        <img
          src={post.featured_url}
          alt={post.title}
          className="w-full my-6 rounded object-cover max-h-105"
          onError={(e) => {
            e.currentTarget.src = "/fallback-image.png";
          }}
        />
      ) : null}

      {post.lead && <p className="text-lg text-gray-700 mt-2">{post.lead}</p>}

      <div
        className="prose max-w-none mt-6"
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />

      <SocialShare url={window.location.href} title={post.title} />

      <div className="mt-8 text-sm text-gray-500">
        Autor: {post.author_name || "Desconhecido"}
      </div>
    </article>
  );
}
