// frontend/src/components/HeroCarousel.jsx
import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getPosts } from '../services/api';

function resolveImageUrl(path) {
  if (!path) return '/fallback-image.png';
  if (path.startsWith('http')) return path;
  const base = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

export default function HeroCarousel() {
  const [items, setItems] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const hoverRef = useRef(false);

  useEffect(() => {
    // Busca apenas os 5 posts mais recentes para o destaque
    getPosts(1, 5).then(resp => {
      const arr = resp?.data ?? resp ?? [];
      // Filtra apenas posts que tenham imagem, para não ficar feio no carrossel
      const withImages = arr.filter(p => p.featured_url);
      setItems(withImages.slice(0, 3)); // Pega os top 3 com imagem
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!hoverRef.current && items.length) setIndex(i => (i + 1) % items.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [items.length]);

  if (loading) return <div className="h-96 animate-pulse bg-gray-200 rounded-xl mb-8"></div>;
  if (items.length === 0) return null;

  const main = items[index];
  const sidePosts = items.filter((_, i) => i !== index).slice(0, 2);

  return (
    <section 
      className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-12"
      onMouseEnter={() => { hoverRef.current = true; }}
      onMouseLeave={() => { hoverRef.current = false; }}
    >
      {/* Lado Esquerdo: Carrossel Principal */}
      <div className="lg:col-span-8 relative group h-[300px] md:h-[450px] overflow-hidden rounded-2xl shadow-lg">
        <Link to={`/post/${main.slug}`}>
          <img
            src={resolveImageUrl(main.featured_url)}
            alt={main.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
          <div className="absolute bottom-0 p-6 text-white max-w-2xl">
            {main.category?.name && (
              <span className="bg-blue-600 text-[10px] font-bold uppercase px-2 py-1 rounded mb-3 inline-block">
                {main.category.name}
              </span>
            )}
            <h2 className="text-2xl md:text-4xl font-bold leading-tight line-clamp-2 mb-2">{main.title}</h2>
            {main.lead && <p className="text-gray-300 line-clamp-2 text-sm md:text-base hidden md:block">{main.lead}</p>}
          </div>
        </Link>
        
        {/* Navegação (Dots) */}
        <div className="absolute top-4 right-4 flex gap-1 z-10">
          {items.map((_, i) => (
            <button 
              key={i} 
              onClick={(e) => { e.preventDefault(); setIndex(i); }} 
              className={`h-1 rounded-full transition-all duration-300 shadow-sm ${i === index ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'}`} 
            />
          ))}
        </div>
      </div>

      {/* Lado Direito: Stack Vertical */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        {sidePosts.map(post => (
          <Link 
            key={post.id} 
            to={`/post/${post.slug}`} 
            className="flex-1 flex flex-col relative group overflow-hidden rounded-2xl shadow-md bg-gray-100"
          >
            <div className="relative h-full">
               <img 
                 src={resolveImageUrl(post.featured_url)} 
                 className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                 alt="" 
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
               <div className="relative p-4 mt-auto text-white h-full flex flex-col justify-end">
                  <span className="text-blue-400 text-[10px] font-bold uppercase mb-1">{post.category?.name}</span>
                  <h3 className="font-bold text-lg leading-snug line-clamp-2 group-hover:text-blue-200 transition-colors">{post.title}</h3>
               </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}