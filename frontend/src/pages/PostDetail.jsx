// frontend/src/pages/PostDetail.jsx
import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getPostBySlug } from "../services/api";
import ReactPlayer from 'react-player'; // A nossa nova biblioteca
import DOMPurify from "dompurify";

// Helper para URL de imagem (igual à Home)
function resolveImageUrl(path) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = import.meta.env.VITE_API_URL || "http://localhost:3001";
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

function formatDate(dt) {
  try {
    return new Date(dt).toLocaleString('pt-PT', { 
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  } catch (e) { return "—"; }
}

function SocialShare({ url, title }) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title || "");
  const twitter = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  const whatsapp = `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`;
  return (
    <div className="flex gap-3 mt-8 border-t pt-6">
      <span className="text-sm font-semibold text-gray-500 py-2">Partilhar:</span>
      <a className="text-sm px-4 py-2 bg-gray-100 hover:bg-blue-50 text-blue-600 rounded transition" target="_blank" rel="noreferrer" href={fb}>Facebook</a>
      <a className="text-sm px-4 py-2 bg-gray-100 hover:bg-sky-50 text-sky-500 rounded transition" target="_blank" rel="noreferrer" href={twitter}>Twitter</a>
      <a className="text-sm px-4 py-2 bg-gray-100 hover:bg-green-50 text-green-600 rounded transition" target="_blank" rel="noreferrer" href={whatsapp}>WhatsApp</a>
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
        if (resolved?.title) document.title = `${resolved.title} — Folha Ovitula`;
      })
      .catch((err) => {
        console.error("getPostBySlug error", err);
        setError(err.message || "Failed to load post");
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="p-10 text-center text-gray-500">Carregando notícia...</div>;
  if (error) return <div className="p-10 text-center text-red-600">Erro: {error}</div>;
  if (!post) return <div className="p-10 text-center">Notícia não encontrada</div>;

  const safeHtml = DOMPurify.sanitize(post.content || "");
  const featuredImg = resolveImageUrl(post.featured_url);

  // Lógica de Renderização de Multimédia
  const renderMedia = () => {
    if (post.type === 'video' && post.video_url) {
      return (
        <div className="my-6 aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
          <ReactPlayer 
            url={post.video_url} 
            width="100%" 
            height="100%" 
            controls={true} // Mostra controlos nativos do YouTube/FB
            light={featuredImg} // Usa a imagem de capa como thumbnail antes de dar play!
            playIcon={
              <div className="bg-red-600 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-2xl cursor-pointer hover:scale-110 transition">
                <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" /></svg>
              </div>
            }
          />
        </div>
      );
    }

    if (post.type === 'audio' && post.video_url) {
      return (
        <div className="my-6 bg-gray-50 p-6 rounded-xl border border-gray-200">
          {featuredImg && (
            <img src={featuredImg} alt={post.title} className="w-32 h-32 rounded object-cover mx-auto mb-4 shadow-sm" />
          )}
          <div className="text-center font-semibold text-gray-700 mb-2">Ouvir Reportagem</div>
          <audio controls className="w-full">
            <source src={post.video_url} />
            O seu navegador não suporta áudio.
          </audio>
        </div>
      );
    }

    // Padrão: Imagem apenas (para artigos)
    if (featuredImg) {
      return (
        <img
          src={featuredImg}
          alt={post.title}
          className="w-full my-6 rounded-lg object-cover max-h-[500px] shadow-sm"
          onError={(e) => { e.currentTarget.src = '/fallback-image.png'; }}
        />
      );
    }
    return null;
  };

  return (
    <article className="max-w-4xl mx-auto p-6 bg-white min-h-screen">
      <Link to="/" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium mb-6 transition">
        ← Voltar para a Home
      </Link>

      <header className="mb-6">
        {post.category && (
          <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider mb-3 inline-block">
            {post.category.name}
          </span>
        )}
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-4">
          {post.title}
        </h1>
        
        <div className="flex items-center text-sm text-gray-500 border-b pb-6">
          <span className="font-medium text-gray-900 mr-2">{post.author_name || 'Redação Folha Ovitula'}</span>
          <span className="mx-2">•</span>
          <time>{post.published_at ? formatDate(post.published_at) : 'Rascunho'}</time>
        </div>
      </header>

      {/* LEAD / RESUMO */}
      {post.lead && (
        <p className="text-xl text-gray-600 leading-relaxed mb-6 font-serif italic border-l-4 border-blue-500 pl-4">
          {post.lead}
        </p>
      )}

      {/* MEDIA PLAYER (VÍDEO/ÁUDIO/IMAGEM) */}
      {renderMedia()}

      {/* CONTEÚDO */}
      <div
        className="prose prose-lg prose-blue max-w-none text-gray-800 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />

      <SocialShare url={window.location.href} title={post.title} />
    </article>
  );
}