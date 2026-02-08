// frontend/src/pages/Home.jsx
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getPosts } from "../services/api";
import HeroCarousel from "../components/HeroCarousel";
import MultimediaHub from "../components/MultimediaHub";

function resolveImageUrl(path) {
  if (!path) return "/fallback-image.png";
  if (path.startsWith("http")) return path;
  const base = import.meta.env.VITE_API_URL || "http://localhost:3001";
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

export default function Home() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q");
  const category = searchParams.get("category");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const resp = await getPosts(1, 12, category, q);
        const items = resp?.data ?? resp ?? [];
        setPosts(Array.isArray(items) ? items : []);
      } catch (err) {
        console.error("Erro ao carregar:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [category, q]);

  if (loading)
    return (
      <div className="p-12 text-center font-medium text-gray-400">
        Carregando conteúdo editorial...
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Seção Hero - Mantida conforme configuramos */}
      {!q && !category && <HeroCarousel />}

      <header className="flex items-end justify-between mb-10 border-b-2 border-black pb-2">
        <h2 className="text-3xl font-black uppercase tracking-tighter">
          {q ? `Busca: ${q}` : category ? category : "Explorar"}
        </h2>
        <span className="text-sm font-bold text-gray-400 pb-1">
          {posts.length} Artigos
        </span>
      </header>

      {/* O NOVO GRID HORIZONTAL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-16">
        {posts.length === 0 ? (
          <div className="col-span-full text-center py-20 text-gray-400 italic">
            Nenhum artigo encontrado.
          </div>
        ) : (
          posts.map((post) => (
            <Link
              to={`/post/${post.slug}`}
              key={post.id}
              className="group flex flex-col bg-white rounded-xl border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              {/* Container da Imagem */}
              <div className="relative aspect-video overflow-hidden bg-gray-50">
                <img
                  src={resolveImageUrl(post.featured_url)}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                {/* Overlay sutil para dar contraste à categoria */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {post.category?.name && (
                  <div className="absolute top-3 left-3">
                    <span className="bg-white/90 backdrop-blur-sm text-gray-900 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm">
                      {post.category.name}
                    </span>
                  </div>
                )}
              </div>

              {/* Conteúdo do Card */}
              <div className="p-5 flex flex-col flex-1">
                <h3 className="text-lg font-bold leading-tight text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {post.title}
                </h3>

                <p className="text-gray-500 text-sm line-clamp-3 mb-4 leading-relaxed">
                  {post.lead ??
                    (post.content ? post.content.slice(0, 100) + "..." : "")}
                </p>

                {/* Footer com separador sutil */}
                <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-blue-600">
                    Ler notícia
                  </span>
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                    <span className="text-gray-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5">
                      →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      <MultimediaHub/>

    </div>
  );
}
