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
  const q = searchParams.get("q") || null;
  const category = searchParams.get("category") || null;

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // PAGINAÇÃO
  const [page, setPage] = useState(1);
  const pageSize = 20; // Limite de 20 artigos por página como pediste

  // Resetar a página para 1 se mudar a categoria ou a busca
  useEffect(() => {
    setPage(1);
  }, [category, q]);

  // Carregar notícias
  useEffect(() => {
    setLoading(true);
    // Scroll para o topo da lista de notícias quando muda a página
    if (page > 1) {
      const listElement = document.getElementById('news-list');
      if (listElement) listElement.scrollIntoView({ behavior: 'smooth' });
    }

    getPosts(page, pageSize, category, q).then(resp => {
      const items = resp?.data ?? resp ?? [];
      
      // Se não houver filtros, removemos os vídeos da lista principal para não repetir
      // (pois já aparecem no MultimediaHub)
      const filtered = (!q && !category) 
        ? items.filter(p => p.type === 'article') 
        : items;
        
      setPosts(filtered);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [page, category, q]);

  // Handler de Paginação
  const handleNextPage = () => setPage(p => p + 1);
  const handlePrevPage = () => setPage(p => Math.max(1, p - 1));

  const showComponents = !q && !category && page === 1; // Carousel só na página 1 e sem filtros

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 pb-20">
      
      {/* 1. CARROSSEL DE DESTAQUE (Só na Home principal e Página 1) */}
      {showComponents && <HeroCarousel />}

      {/* 2. LISTA DE ARTIGOS (Grid Clássico) */}
      <section id="news-list">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-800 border-l-4 border-blue-600 pl-4">
            {category ? `Categoria: ${category}` : (q ? `Resultados: ${q}` : 'Últimas Notícias')}
          </h2>
          <span className="text-sm text-gray-500 font-medium">Página {page}</span>
        </div>

        {loading ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
             {[...Array(8)].map((_, i) => (
               <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
             ))}
           </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {posts.map(post => (
                <Link 
                  to={`/post/${post.slug}`} 
                  key={post.id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full border border-gray-100 group"
                >
                  <div className="h-48 bg-gray-200 overflow-hidden relative">
                    {post.category?.name && (
                      <span className="absolute top-2 left-2 z-10 bg-white   text-black text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                        {post.category.name}
                      </span>
                    )}
                    <img 
                      src={resolveImageUrl(post.featured_url)} 
                      alt={post.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-base text-gray-900 leading-snug mb-2 line-clamp-3 group-hover:text-blue-700 transition-colors">
                      {post.title}
                    </h3>
                    <div className="text-xs text-gray-400 mt-auto pt-3 border-t flex justify-between items-center">
                       <span className="font-medium text-gray-500">{post.author?.name || 'Redação'}</span>
                       <span>{new Date(post.published_at || Date.now()).toLocaleDateString('pt-PT')}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {posts.length === 0 && (
              <div className="text-center py-20 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p className="text-gray-500 text-lg">Nenhum artigo encontrado.</p>
                {page > 1 && (
                  <button onClick={() => setPage(1)} className="mt-4 text-blue-600 hover:underline">
                    Voltar à primeira página
                  </button>
                )}
              </div>
            )}

            {/* CONTROLES DE PAGINAÇÃO */}
            <div className="mt-12 flex justify-center items-center gap-4">
              <button 
                onClick={handlePrevPage} 
                disabled={page === 1}
                className="px-6 py-2 rounded-full border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                ← Anterior
              </button>
              
              <div className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-semibold text-gray-600">
                Página {page}
              </div>

              {/* Só habilita 'Próxima' se tivermos recebido artigos suficientes para encher a página */}
              <button 
                onClick={handleNextPage}
                disabled={posts.length < pageSize} 
                className="px-6 py-2 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition"
              >
                Próxima →
              </button>
            </div>
          </>
        )}
      </section>

      {/* 3. SECÇÃO MULTIMÉDIA 
          Adicionei 'mt-32' (margin-top: 8rem / 128px) para dar a distância que pediste.
          Só aparece na página 1 e sem filtros de busca.
      */}
      {showComponents && (
        <div className="mt-32">
          <MultimediaHub />
        </div>
      )}
      
    </div>
  );
}