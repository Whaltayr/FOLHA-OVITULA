// frontend/src/components/MultimediaHub.jsx
import { useEffect, useState, useRef } from "react";
import { getMultimedia } from "../services/api"; 
import { FaPlay, FaPause, FaYoutube, FaMicrophone, FaHeadphones } from "react-icons/fa";

// --- HELPERS ---
function getYouTubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

function resolveImageUrl(path) {
  if (!path) return '/fallback-image.png';
  if (path.startsWith('http')) return path;
  const base = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

function youtubeEmbedUrl(videoId) {
  return `https://www.youtube.com/embed/${videoId}?rel=0&showinfo=0&autoplay=1&modestbranding=1`;
}

export default function MultimediaHub() {
  const [items, setItems] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [embedLoaded, setEmbedLoaded] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(null);
  const audioRefs = useRef({});

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await getMultimedia();
        if (!mounted) return;

        if (Array.isArray(data) && data.length) {
          const adapted = data.map(item => {
            const isYoutube = item.video_url?.includes('youtube') || item.video_url?.includes('youtu.be');
            return {
              ...item,
              provider: isYoutube ? 'youtube' : 'other',
              videoId: isYoutube ? getYouTubeId(item.video_url) : null,
              src: item.video_url, 
              thumbnail: resolveImageUrl(item.featured_url),
              description: item.lead || item.title
            };
          });
          setItems(adapted);
          setActiveId(adapted[0].id);
        } else {
            setItems([]); 
        }
      } catch (err) {
        console.error("MultimediaHub load error", err);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  function toggleAudio(id) {
    const el = audioRefs.current[id];
    if (!el) return;
    if (playingAudio === id) {
      el.pause();
      setPlayingAudio(null);
    } else {
      if (playingAudio && audioRefs.current[playingAudio]) {
        audioRefs.current[playingAudio].pause();
      }
      el.play();
      setPlayingAudio(id);
    }
  }

  function onAudioEnded(id) {
    if (playingAudio === id) setPlayingAudio(null);
  }

  // Selecionar novo vídeo/audio da lista
  const handleSelect = (item) => {
    if (activeId === item.id) return;
    setActiveId(item.id);
    setEmbedLoaded(false); 
    setPlayingAudio(null);
    // Scroll to top of player smoothly (opcional, bom para mobile)
    // window.scrollTo({ top: ... }) 
  };

  if (!items || items.length === 0) return null;

  const active = items.find(i => i.id === activeId) || items[0];

  return (
    <section className="mt-12 bg-gray-900 rounded-xl shadow-2xl overflow-hidden border border-gray-800">
      {/* Cabeçalho Compacto */}
      <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between bg-black/20">
        <h2 className="text-white font-bold text-lg flex items-center gap-2">
          <FaYoutube className="text-red-600" /> 
          Multimédia
        </h2>
        <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
          {items.length} {items.length === 1 ? 'Item' : 'Itens'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3">
        
        {/* --- COLUNA ESQUERDA: PLAYER (Ocupa 2/3) --- */}
        <div className="lg:col-span-2 bg-black relative flex flex-col">
          
          {/* Área do Player (Aspect Ratio 16:9 fixo) */}
          <div className="relative aspect-video w-full bg-black">
            {active.type === "video" ? (
              <>
                {!embedLoaded || active.id !== embedLoaded ? (
                  <div 
                    className="w-full h-full bg-cover bg-center cursor-pointer group relative"
                    style={{ backgroundImage: `url(${active.thumbnail})` }}
                    onClick={() => setEmbedLoaded(active.id)}
                  >
                    {/* Overlay escuro ao passar o rato */}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
                    
                    {/* Botão Play Limpo (Sem texto extra) */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-red-600/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform backdrop-blur-sm">
                        <FaPlay className="text-white ml-1 text-2xl" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <iframe
                    title={active.title}
                    src={active.provider === "youtube" ? youtubeEmbedUrl(active.videoId) : active.video_url}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )}
              </>
            ) : (
              // Player de Áudio Otimizado
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 p-6 relative overflow-hidden">
                {/* Background desfocado para efeito visual */}
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-10 blur-xl scale-110"
                  style={{ backgroundImage: `url(${active.thumbnail})` }}
                ></div>

                <div className="relative z-10 flex flex-col items-center">
                   <img src={active.thumbnail} alt="" className="w-32 h-32 rounded-lg shadow-2xl mb-6 object-cover border border-gray-700" />
                   
                   <div className="flex items-center gap-6">
                      <button 
                        onClick={() => toggleAudio(active.id)}
                        className="w-14 h-14 bg-white text-gray-900 rounded-full flex items-center justify-center hover:bg-gray-200 transition shadow-lg"
                      >
                        {playingAudio === active.id ? <FaPause /> : <FaPlay className="ml-1" />}
                      </button>
                   </div>
                   
                   <audio
                     ref={el => { if (el) audioRefs.current[active.id] = el; }}
                     src={active.src}
                     onEnded={() => onAudioEnded(active.id)}
                   />
                </div>
              </div>
            )}
          </div>

          {/* Info do Video Ativo (Abaixo do Player) */}
          <div className="p-5">
            <h3 className="text-xl font-bold text-white leading-tight mb-2">{active.title}</h3>
            <p className="text-sm text-gray-400 line-clamp-2">{active.description}</p>
          </div>
        </div>

        {/* --- COLUNA DIREITA: LISTA/PLAYLIST (Ocupa 1/3) --- */}
        <div className="lg:col-span-1 bg-gray-800 border-l border-gray-700 flex flex-col h-[400px] lg:h-auto">
          <div className="p-3 bg-gray-800/90 backdrop-blur border-b border-gray-700 text-xs font-bold text-gray-400 uppercase tracking-wider sticky top-0 z-10">
            A seguir
          </div>
          
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            {items.map((item) => {
              const isActive = activeId === item.id;
              return (
                <div 
                  key={item.id} 
                  onClick={() => handleSelect(item)}
                  className={`flex gap-3 p-3 cursor-pointer transition-colors border-b border-gray-700/50 hover:bg-gray-700/50 ${isActive ? 'bg-gray-700 border-l-4 border-l-red-500' : 'border-l-4 border-l-transparent'}`}
                >
                  {/* Thumbnail Pequena */}
                  <div className="relative w-24 h-16 bg-gray-900 rounded overflow-hidden flex-shrink-0">
                    <img src={item.thumbnail} alt="" className={`w-full h-full object-cover ${isActive ? 'opacity-100' : 'opacity-70'}`} />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                       {item.type === 'audio' 
                         ? <FaHeadphones className="text-white text-xs drop-shadow" /> 
                         : (isActive && embedLoaded ? <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"/> : <FaPlay className="text-white text-xs drop-shadow" />)
                       }
                    </div>
                  </div>

                  {/* Texto */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h4 className={`text-sm font-medium leading-snug line-clamp-2 ${isActive ? 'text-white' : 'text-gray-300'}`}>
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-gray-500 mt-1 uppercase">
                      {item.type === 'video' ? 'Vídeo' : 'Áudio'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}