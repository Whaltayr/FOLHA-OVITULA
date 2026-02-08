// frontend/src/components/MultimediaHub.jsx
import { useEffect, useState, useRef } from "react";
import { getMultimedia } from "../services/api"; // opcional: se não existir, getMultimedia devolve fallback
import { FaMicrophone, FaYoutube, FaTwitter, FaInstagram } from "react-icons/fa";

/*
  MultimediaHub
  - Seção independente, responsiva, 75/25 (player principal à esquerda, lista à direita).
  - Player principal carrega on-demand (clique) para evitar bloqueio de carregamento.
  - Lista de áudios usa <audio> nativo; play/pause por cada card.
  - Topo com hub social em glassmorphism.
*/

// monta url de embed do youtube (aceita outros providers se quiseres depois)
function youtubeEmbedUrl(videoId) {
  return `https://www.youtube.com/embed/${videoId}?rel=0&showinfo=0&autoplay=1`;
}

// helper: transforma segundos em mm:ss (apenas UI)
function fmtDuration(sec = 0) {
  const s = Math.max(0, Math.floor(sec));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${mm}:${String(ss).padStart(2, "0")}`;
}

export default function MultimediaHub() {
  // dados carregados (do backend ou fallback)
  const [items, setItems] = useState([]);
  // id do item actualmente no player principal
  const [activeId, setActiveId] = useState(null);
  // flag para indicar que o embed (iframe) já foi carregado (evita reloads)
  const [embedLoaded, setEmbedLoaded] = useState(false);
  // estado de reprodução de um audio (id)
  const [playingAudio, setPlayingAudio] = useState(null);
  // refs para gerir players de audio
  const audioRefs = useRef({});

  // fetch inicial: tenta API, senão usa fallback local
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await getMultimedia(); // tenta buscar /multimedia
        if (!mounted) return;
        if (Array.isArray(data) && data.length) {
          setItems(data);
          setActiveId(data[0].id); // por padrão, escolhe o primeiro
        } else {
          // fallback local (se API não existir)
          const fallback = [
            {
              id: "vid-1",
              type: "video",
              provider: "youtube",
              videoId: "ysz5S6PUM-U", // sample youtube id (substitui se quiser)
              title: "Reportagem Especial — Panorama da Semana",
              description: "Uma síntese em vídeo das notícias que importam.",
              thumbnail: "/fallback-image.png",
            },
            {
              id: "aud-1",
              type: "audio",
              src: "/uploads/sample-podcast-1.mp3",
              title: "Podcast: Entrevista com X",
              description: "20 min — conversa sobre temas atuais.",
              duration: 1200
            },
            {
              id: "aud-2",
              type: "audio",
              src: "/uploads/sample-podcast-2.mp3",
              title: "Reportagem sonora — Regiões",
              description: "Reportagem em áudio sobre as regiões.",
              duration: 540
            }
          ];
          setItems(fallback);
          setActiveId(fallback[0].id);
        }
      } catch (err) {
        console.error("MultimediaHub load error", err);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  // play/pause para audio cards
  function toggleAudio(id) {
    const el = audioRefs.current[id];
    if (!el) return;
    if (playingAudio === id) {
      el.pause();
      setPlayingAudio(null);
    } else {
      // pause outro audio se existir
      if (playingAudio && audioRefs.current[playingAudio]) {
        audioRefs.current[playingAudio].pause();
      }
      el.play();
      setPlayingAudio(id);
    }
  }

  // quando um audio termina, limpa estado
  function onAudioEnded(id) {
    if (playingAudio === id) setPlayingAudio(null);
  }

  if (!items || items.length === 0) {
    return null; // nada para mostrar
  }

  const active = items.find(i => i.id === activeId) || items[0];
  const rightList = items.filter(i => i.id !== active.id);

  return (
    <section className="mt-12 bg-white rounded-lg shadow overflow-hidden">
      {/* HUB SOCIAL no topo com glassmorphism */}
      <div className="p-3 bg-white/30 backdrop-blur-sm border-b">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold">Multimédia</div>
            <div className="text-xs text-gray-600">Ver, ouvir e explorar conteúdos especiais</div>
          </div>

          {/* links sociais — colocar links reais conforme tua presença */}
          <div className="flex items-center gap-3">
            <a href="https://youtube.com" target="_blank" rel="noreferrer" className="p-2 rounded hover:bg-gray-100" aria-label="YouTube">
              <FaYoutube />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="p-2 rounded hover:bg-gray-100" aria-label="Twitter">
              <FaTwitter />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="p-2 rounded hover:bg-gray-100" aria-label="Instagram">
              <FaInstagram />
            </a>
          </div>
        </div>
      </div>

      {/* LAYOUT principal: grid 3-col (2fr | 1fr) responsivo */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-6 p-6">
        {/* LEFT: Player principal (iframe para vídeo ou player audio) */}
        <div>
          <div className="bg-gray-900 rounded-lg overflow-hidden relative aspect-video">
            {/* Se é video, mostramos thumbnail + botão que carrega o iframe on-demand */}
            {active.type === "video" ? (
              <>
                {!embedLoaded || active.id !== embedLoaded ? (
                  // thumbnail com botão — evita carregar iframe até ser necessário
                  <div
                    className="w-full h-full bg-cover bg-center flex items-center justify-center relative"
                    style={{ backgroundImage: `url(${active.thumbnail || "/fallback-image.png"})` }}
                  >
                    {/* overlay e texto */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <button
                      onClick={() => { setEmbedLoaded(active.id); }}
                      className="relative z-10 bg-white/90 px-4 py-3 rounded-full text-black font-semibold hover:scale-105 transition"
                      aria-label="Reproduzir vídeo"
                    >
                      ▶ Reproduzir vídeo
                    </button>
                    <div className="absolute bottom-4 left-4 right-4 text-white z-10">
                      <div className="text-xs text-sky-300">{active.category ?? ""}</div>
                      <div className="font-bold text-lg">{active.title}</div>
                      {active.description && <div className="text-sm mt-1 opacity-90">{active.description}</div>}
                    </div>
                  </div>
                ) : (
                  // iframe embed (autoplay) — só renderiza depois do click
                  <iframe
                    title={active.title}
                    src={active.provider === "youtube" ? youtubeEmbedUrl(active.videoId) : ""}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )}
              </>
            ) : (
              // se active é audio, mostramos um player audio grande
              <div className="w-full h-full flex items-center justify-center p-6">
                <div className="w-full max-w-2xl bg-white p-4 rounded shadow flex items-center gap-4">
                  <div>
                    <button
                      onClick={() => toggleAudio(active.id)}
                      className="w-12 h-12 rounded-full bg-sky-600 text-white flex items-center justify-center"
                      aria-label={playingAudio === active.id ? "Pausar" : "Tocar"}
                    >
                      {playingAudio === active.id ? "▌▌" : "▶"}
                    </button>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{active.title}</div>
                    <div className="text-xs text-gray-600">{active.description}</div>
                    <audio
                      ref={el => { if (el) audioRefs.current[active.id] = el; }}
                      src={active.src}
                      onEnded={() => onAudioEnded(active.id)}
                      preload="none"
                    />
                  </div>
                  {active.duration && <div className="text-xs text-gray-500">{fmtDuration(active.duration)}</div>}
                </div>
              </div>
            )}
          </div>

          {/* descrição editorial pequena sob o player */}
          <div className="mt-3 text-sm text-gray-700">
            {active.description}
          </div>
        </div>

        {/* RIGHT: Lista de áudios / pequenos conteúdos (cards de ação rápida) */}
        <aside>
          <div className="flex flex-col gap-3">
            {rightList.map(item => (
              <div key={item.id} className="bg-white rounded-lg shadow p-3 flex items-center gap-3 hover:scale-[1.01] transition">
                <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                  {item.type === "audio" ? <FaMicrophone /> : <FaYoutube />}
                </div>

                <div className="flex-1">
                  <div className="font-semibold text-sm line-clamp-2">{item.title}</div>
                  <div className="text-xs text-gray-500">{item.description}</div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {/* botão "usar como player principal" */}
                  <button
                    onClick={() => {
                      // selecciona este item como activo; se for video carregar embed imediatamente
                      setActiveId(item.id);
                      if (item.type === "video") setEmbedLoaded(item.id);
                      // se é audio, também inicia reprodução
                      if (item.type === "audio") {
                        setTimeout(() => {
                          const el = audioRefs.current[item.id];
                          if (el) {
                            // pausa outro audio
                            if (playingAudio && audioRefs.current[playingAudio]) {
                              audioRefs.current[playingAudio].pause();
                            }
                            el.play();
                            setPlayingAudio(item.id);
                          }
                        }, 120);
                      }
                    }}
                    className="px-3 py-1 border rounded text-sm bg-sky-50 hover:bg-sky-100"
                  >
                    Abrir
                  </button>

                  {item.type === "audio" && (
                    <button
                      onClick={() => toggleAudio(item.id)}
                      className="text-xs text-gray-600 underline"
                    >
                      {playingAudio === item.id ? "Pausar" : "Ouvir"}
                    </button>
                  )}
                </div>

                {/* elemento audio escondido para controle (se for audio) */}
                {item.type === "audio" && (
                  <audio
                    ref={el => { if (el) audioRefs.current[item.id] = el; }}
                    src={item.src}
                    preload="none"
                    onEnded={() => onAudioEnded(item.id)}
                  />
                )}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
