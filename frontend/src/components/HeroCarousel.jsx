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
    getPosts(1, 3).then(resp => {
      const arr = resp?.data ?? resp ?? [];
      setItems(Array.isArray(arr) ? arr : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!hoverRef.current && items.length) setIndex(i => (i + 1) % items.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [items.length]);

  if (loading || items.length === 0) return <div className="h-96 animate-pulse bg-gray-200 rounded-xl mb-8"></div>;

  const main = items[index];
  const sidePosts = items.filter((_, i) => i !== index).slice(0, 2);

  return (
    <section 
      className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-12"
      onMouseEnter={() => { hoverRef.current = true; }}
      onMouseLeave={() => { hoverRef.current = false; }}
    >
      {/* Lado Esquerdo: Carrossel Principal (Ocupa 8 de 12 colunas) */}
      <div className="lg:col-span-8 relative group h-[300px] md:h-[450px] overflow-hidden rounded-2xl shadow-lg">
        <Link to={`/post/${main.slug}`}>
          <img
            src={resolveImageUrl(main.featured_url)}
            alt={main.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
          <div className="absolute bottom-0 p-6 text-white">
            <span className="bg-blue-600 text-[10px] font-bold uppercase px-2 py-1 rounded mb-3 inline-block">
              {main.category?.name}
            </span>
            <h2 className="text-2xl md:text-4xl font-bold leading-tight line-clamp-2">{main.title}</h2>
          </div>
        </Link>
        
        {/* Navegação Simplificada */}
        <div className="absolute top-4 right-4 flex gap-1">
          {items.map((_, i) => (
            <button key={i} onClick={() => setIndex(i)} className={`h-1 transition-all ${i === index ? 'w-6 bg-white' : 'w-2 bg-white/40'}`} />
          ))}
        </div>
      </div>

      {/* Lado Direito: Stack Vertical (Ocupa 4 de 12 colunas) */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        {sidePosts.map(post => (
          <Link 
            key={post.id} 
            to={`/post/${post.slug}`} 
            className="flex-1 flex flex-col relative group overflow-hidden rounded-2xl shadow-md bg-white"
          >
            <div className="relative h-full">
               <img src={resolveImageUrl(post.featured_url)} className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105" alt="" />
               <div className="absolute inset-0 bg-black/60 group-hover:bg-black/50 transition-colors" />
               <div className="relative p-4 mt-auto text-white">
                  <span className="text-blue-400 text-[10px] font-bold uppercase">{post.category?.name}</span>
                  <h3 className="font-bold text-lg line-clamp-2 leading-snug">{post.title}</h3>
               </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}