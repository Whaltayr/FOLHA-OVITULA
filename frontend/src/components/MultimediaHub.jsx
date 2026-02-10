// frontend/src/components/MultimediaHub.jsx
import { useEffect, useState } from "react";
import { getMultimedia } from "../services/api"; 
import { FaVideo, FaPodcast, FaPlay, FaYoutube } from "react-icons/fa";

// --- HELPERS ---
function resolveMediaUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const base = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

function getYouTubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export default function MultimediaHub() {
  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState('video'); // 'video' | 'audio'
  
  // Estado Vídeo
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [embedLoaded, setEmbedLoaded] = useState(false);

  // Estado Áudio
  const [currentAudio, setCurrentAudio] = useState(null);

  useEffect(() => {
    getMultimedia().then(data => {
      if (Array.isArray(data) && data.length > 0) {
        const processed = data.map(item => ({
          ...item,
          mediaSrc: resolveMediaUrl(item.video_url),
          thumbnail: resolveMediaUrl(item.featured_url),
          ytId: getYouTubeId(item.video_url)
        }));
        setItems(processed);
        
        const firstVideo = processed.find(i => i.type === 'video');
        if (firstVideo) setActiveVideoId(firstVideo.id);
      }
    });
  }, []);

  const videos = items.filter(i => i.type === 'video');
  const audios = items.filter(i => i.type === 'audio');
  const activeVideo = videos.find(v => v.id === activeVideoId) || videos[0];

  if (items.length === 0) return null;

  return (
    <section className="mt-16 bg-black rounded-2xl shadow-2xl overflow-hidden border border-gray-800 font-sans">
      
      {/* 1. Header com Abas */}
      <div className="flex border-b border-gray-800 bg-gray-900">
        <button 
          onClick={() => setActiveTab('video')}
          className={`px-8 py-4 text-sm font-bold uppercase tracking-widest transition-all flex items-center gap-2
            ${activeTab === 'video' ? 'bg-black text-white border-t-4 border-red-600' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <FaVideo /> Vídeos
        </button>
        <button 
          onClick={() => setActiveTab('audio')}
          className={`px-8 py-4 text-sm font-bold uppercase tracking-widest transition-all flex items-center gap-2
            ${activeTab === 'audio' ? 'bg-black text-white border-t-4 border-yellow-500' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <FaPodcast /> Podcasts
        </button>
      </div>

      {/* 2. TAB VÍDEOS */}
      {activeTab === 'video' && activeVideo && (
        <div className="grid grid-cols-1 lg:grid-cols-3 animate-fadeIn">
          {/* Player Principal */}
          <div className="lg:col-span-2 bg-black relative">
            <div className="aspect-video w-full bg-black relative group">
              {activeVideo.ytId ? (
                /* YOUTUBE: Iframe */
                !embedLoaded || activeVideo.id !== embedLoaded ? (
                  <div 
                    className="absolute inset-0 bg-cover bg-center cursor-pointer"
                    style={{ backgroundImage: `url(${activeVideo.thumbnail})` }}
                    onClick={() => setEmbedLoaded(activeVideo.id)}
                  >
                     <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
                     <div className="absolute inset-0 flex items-center justify-center">
                       <FaYoutube className="text-red-600 text-6xl drop-shadow-lg group-hover:scale-110 transition-transform" />
                     </div>
                  </div>
                ) : (
                  <iframe
                    src={`https://www.youtube.com/embed/${activeVideo.ytId}?autoplay=1`}
                    className="w-full h-full"
                    frameBorder="0"
                    allowFullScreen
                  />
                )
              ) : (
                /* VÍDEO NATIVO (MP4 Upload) - Usa o player do navegador */
                <video 
                  controls 
                  autoPlay={false}
                  className="w-full h-full object-contain"
                  src={activeVideo.mediaSrc}
                  poster={activeVideo.thumbnail}
                >
                  O seu navegador não suporta a tag de vídeo.
                </video>
              )}
            </div>
            
            <div className="p-6 bg-gray-900 border-b border-gray-800 lg:border-none">
               <h2 className="text-white text-2xl font-bold mb-2">{activeVideo.title}</h2>
               <p className="text-gray-400 leading-relaxed text-sm">{activeVideo.lead || 'Sem descrição.'}</p>
            </div>
          </div>

          {/* Lista Lateral */}
          <div className="bg-gray-900 h-[400px] lg:h-auto overflow-y-auto border-l border-gray-800">
            <div className="p-3 text-gray-500 text-xs font-bold uppercase border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
              Playlist
            </div>
            {videos.map(v => (
              <div 
                key={v.id} 
                onClick={() => { setActiveVideoId(v.id); setEmbedLoaded(false); }}
                className={`p-3 flex gap-3 cursor-pointer hover:bg-gray-800 border-b border-gray-800/50 ${activeVideoId === v.id ? 'bg-gray-800 border-l-4 border-l-red-600' : ''}`}
              >
                <div className="w-24 h-14 bg-black rounded overflow-hidden flex-shrink-0">
                   <img src={v.thumbnail} className="w-full h-full object-cover opacity-80" alt="" />
                </div>
                <h4 className={`text-sm font-medium line-clamp-2 ${activeVideoId === v.id ? 'text-white' : 'text-gray-400'}`}>
                  {v.title}
                </h4>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. TAB PODCASTS */}
      {activeTab === 'audio' && (
        <div className="p-8 bg-gray-950 min-h-[400px] relative pb-32">
          
          {/* Grelha de Capas */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {audios.map(audio => {
               const isCurrent = currentAudio?.id === audio.id;
               return (
                 <div key={audio.id} className="group cursor-pointer" onClick={() => setCurrentAudio(audio)}>
                   <div className={`aspect-square bg-gray-800 rounded-lg overflow-hidden relative mb-2 transition-all ${isCurrent ? 'ring-4 ring-yellow-500' : 'hover:ring-2 hover:ring-gray-600'}`}>
                     <img src={audio.thumbnail} className="w-full h-full object-cover" alt="" />
                     
                     {/* Overlay Play */}
                     <div className={`absolute inset-0 flex items-center justify-center bg-black/40 ${isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                        <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-black shadow-lg">
                          <FaPlay className="ml-1" />
                        </div>
                     </div>
                   </div>
                   <h3 className={`font-bold text-sm leading-tight line-clamp-2 ${isCurrent ? 'text-yellow-500' : 'text-white'}`}>
                     {audio.title}
                   </h3>
                 </div>
               );
            })}
             {audios.length === 0 && <div className="col-span-full text-center text-gray-500 py-10">Nenhum podcast disponível.</div>}
          </div>

          {/* PLAYER FIXO - NATIVO DO BROWSER */}
          {currentAudio && (
            <div className="absolute bottom-0 left-0 w-full bg-yellow-500 p-4 animate-slideUp z-20 shadow-lg">
               <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-4">
                  
                  {/* Info do Episódio */}
                  <div className="flex items-center gap-3 w-full md:w-1/3">
                    <img src={currentAudio.thumbnail} className="w-12 h-12 rounded bg-black object-cover shadow border border-black/20" alt="" />
                    <div className="min-w-0">
                      <div className="text-black font-bold text-sm truncate">{currentAudio.title}</div>
                      <div className="text-black/70 text-[10px] uppercase font-bold">A ouvir agora</div>
                    </div>
                  </div>

                  {/* O Player Nativo (<audio controls>) */}
                  <div className="w-full md:w-2/3">
                    <audio 
                      controls 
                      autoPlay 
                      src={currentAudio.mediaSrc} 
                      className="w-full h-10 rounded-full shadow-sm"
                      style={{ filter: 'invert(0.9)' }} // Truque visual para ficar escuro/moderno se suportado
                    >
                      O seu navegador não suporta áudio.
                    </audio>
                  </div>
               </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}