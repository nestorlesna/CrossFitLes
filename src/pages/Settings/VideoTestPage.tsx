// Página de prueba de embeds de video (YouTube, Shorts, Vimeo, Facebook Reels, Instagram, TikTok)
// Sirve para verificar qué plataformas se ven bien dentro de la app antes de usarlas en otra funcionalidad.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ExternalLink, Play, Trash2 } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import { Header } from '../../components/layout/Header';
import { detectVideo } from '../../utils/videoEmbed';

// URLs de ejemplo para probar rápido
const SAMPLES: { label: string; url: string }[] = [
  { label: 'YouTube normal', url: 'https://www.youtube.com/watch?v=aclHkVaku9U' },
  { label: 'YouTube Shorts', url: 'https://www.youtube.com/shorts/mvhVQZ_8mgg' },
  { label: 'Facebook Reel', url: 'https://www.facebook.com/reel/2261175031285239' },
  { label: 'Instagram Reel', url: 'https://www.instagram.com/reel/C2Zx1QZsQqf/' },
  { label: 'TikTok', url: 'https://www.tiktok.com/@crossfit/video/7222222222222222222' },
  { label: 'Vimeo', url: 'https://vimeo.com/76979871' },
];

// Tarjeta con el reproductor
function PlayerCard({ url, onRemove }: { url: string; onRemove: () => void }) {
  const info = detectVideo(url);
  const ratio = info.vertical ? '9 / 16' : '16 / 9';

  const openExternal = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800">
        <Play size={14} className="text-primary-400 shrink-0" />
        <span className="text-sm text-white font-medium">{info.label}</span>
        <span className="text-[10px] text-gray-600 uppercase tracking-wider ml-1">
          {info.vertical ? 'vertical 9:16' : '16:9'}
        </span>
        <button
          onClick={openExternal}
          className="ml-auto w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          aria-label="Abrir en el navegador"
        >
          <ExternalLink size={16} />
        </button>
        <button
          onClick={onRemove}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-colors"
          aria-label="Quitar"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="p-3">
        {info.provider === 'unknown' ? (
          <div className="text-sm text-yellow-400 py-6 text-center">
            No se reconoció la plataforma de esta URL.
          </div>
        ) : info.provider === 'file' ? (
          <video src={info.embedUrl} controls playsInline className="w-full rounded-lg bg-black" />
        ) : (
          <div
            className="relative mx-auto w-full bg-black rounded-lg overflow-hidden"
            style={{ aspectRatio: ratio, maxWidth: info.vertical ? 320 : '100%' }}
          >
            <iframe
              src={info.embedUrl}
              title={info.label}
              className="absolute inset-0 w-full h-full"
              frameBorder="0"
              scrolling="no"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        )}
        <p className="text-[11px] text-gray-600 mt-2 break-all">{url}</p>
      </div>
    </div>
  );
}

export function VideoTestPage() {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [urls, setUrls] = useState<string[]>([]);

  const addUrl = (raw: string) => {
    const url = raw.trim();
    if (!url) return;
    if (urls.includes(url)) {
      toast.error('Esa URL ya está en la lista');
      return;
    }
    setUrls((prev) => [url, ...prev]);
    setInput('');
  };

  return (
    <>
      <Header
        title="Prueba de videos"
        leftAction={
          <button
            onClick={() => navigate('/configuracion')}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors active:scale-90"
            aria-label="Volver"
          >
            <ChevronLeft size={20} />
          </button>
        }
      />

      <div className="p-4 space-y-4 pb-24">
        {/* Entrada de URL */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
          <p className="text-xs text-gray-500">
            Pegá una URL de YouTube, Shorts, Vimeo, Facebook Reel, Instagram o TikTok y se agrega abajo un
            reproductor embebido para ver cómo se comporta.
          </p>
          <div className="flex gap-2">
            <input aria-label="URL del video a probar"
              type="url"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addUrl(input);
              }}
              placeholder="https://..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"
            />
            <button
              onClick={() => addUrl(input)}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-xl transition-colors active:scale-95"
            >
              Probar
            </button>
          </div>

          {/* Ejemplos rápidos */}
          <div className="flex flex-wrap gap-2 pt-1">
            {SAMPLES.map((s) => (
              <button
                key={s.url}
                onClick={() => addUrl(s.url)}
                className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg border border-gray-700 transition-colors"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Aviso de plataforma */}
        <div className="text-[11px] text-gray-600 leading-relaxed px-1">
          Nota: YouTube y Vimeo embeben sin problemas. Facebook, Instagram y TikTok dependen de que el
          contenido sea público y de sus propias políticas de embebido; en Android (WebView) algunos
          pueden pedir login o bloquear el iframe. Plataforma actual:{' '}
          <span className="text-gray-400">{Capacitor.getPlatform()}</span>
        </div>

        {/* Reproductores */}
        {urls.length === 0 ? (
          <div className="text-center text-sm text-gray-600 py-10">
            Todavía no agregaste ninguna URL.
          </div>
        ) : (
          <div className="space-y-4">
            {urls.map((u) => (
              <PlayerCard key={u} url={u} onRemove={() => setUrls((prev) => prev.filter((x) => x !== u))} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
