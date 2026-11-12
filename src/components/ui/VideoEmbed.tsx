// Embebe un video de YouTube (incluye Shorts), Vimeo, Facebook (Reels/Watch),
// Instagram o TikTok. Si no reconoce la URL, muestra un enlace.

import { useState } from 'react';
import type { CSSProperties } from 'react';
import { detectVideo } from '../../utils/videoEmbed';

// Tamaño del botón de play propio de YouTube, relativo al original (68×48 px).
// El botón rojo del iframe de YouTube no se puede achicar desde afuera, por eso se
// muestra la miniatura con este botón y el reproductor se carga al tocarlo.
const PLAY_SCALE = 0.5;
// Esquina de la miniatura donde va el botón ('left' | 'right') y su separación del borde (px)
const PLAY_CORNER: 'left' | 'right' = 'left';
const PLAY_MARGIN = 10;

interface VideoEmbedProps {
  url: string;
  /** Arranca reproduciendo donde la plataforma lo permite (por defecto sí) */
  autoplay?: boolean;
  /** Clases extra para el contenedor del reproductor */
  className?: string;
  /**
   * Acota el reproductor al alto del contenedor además de al ancho.
   * El padre tiene que tener la clase `video-stage` (ver index.css).
   * Se usa en la clase por video, donde el video no debe generar scroll.
   */
  fit?: boolean;
  /**
   * Fuerza el marco del reproductor. Sirve para que dos videos del mismo ejercicio (corto y
   * explicativo) se vean del mismo tamaño aunque uno sea vertical y el otro horizontal.
   * 'auto' (por defecto) usa la orientación propia del video.
   */
  orientation?: 'auto' | 'vertical' | 'horizontal';
}

export function VideoEmbed({ url, autoplay = true, className = '', fit = false, orientation = 'auto' }: VideoEmbedProps) {
  const info = detectVideo(url, autoplay);
  // URL ya activada por el usuario (el reproductor de YouTube se carga recién al tocar play)
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  // Miniatura: se intenta la de alta resolución (16:9, sin barras) y si no existe, la mediana
  const [thumbLevel, setThumbLevel] = useState(0);

  if (info.provider === 'unknown') {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between bg-gray-800 hover:bg-gray-700 p-3 rounded-lg transition-colors"
      >
        <span className="text-sm text-gray-200 truncate max-w-[200px]">{url}</span>
        <span className="text-xs text-primary-500 font-medium">Ver enlace</span>
      </a>
    );
  }

  if (info.provider === 'file') {
    return (
      <video
        src={info.embedUrl}
        controls
        autoPlay={autoplay}
        playsInline
        className={`rounded-lg bg-black border border-gray-800 ${fit ? 'video-fit-native' : 'w-full'} ${className}`}
      />
    );
  }

  const vertical = orientation === 'auto' ? info.vertical : orientation === 'vertical';
  const [w, h] = vertical ? [9, 16] : [16, 9];
  const showFacade = !!info.thumbnailUrl && playingUrl !== url;
  // Tras tocar el play propio, el video arranca solo
  const embedSrc = info.thumbnailUrl ? detectVideo(url, true).embedUrl : info.embedUrl;

  return (
    <div
      className={`relative bg-black rounded-lg overflow-hidden border border-gray-800 mx-auto ${fit ? 'video-fit' : 'w-full'} ${vertical && !fit ? 'video-vertical' : ''} ${className}`}
      style={{
        aspectRatio: `${w} / ${h}`,
        ...(fit
          ? ({
              '--video-w': w,
              '--video-h': h,
              '--video-max-width': vertical ? '360px' : '100%',
            } as CSSProperties)
          : {}),
      }}
    >
      {showFacade ? (
        <button
          type="button"
          onClick={() => setPlayingUrl(url)}
          aria-label="Reproducir video"
          className="absolute inset-0 w-full h-full"
        >
          {thumbLevel < 2 && (
            <img
              src={thumbLevel === 0 ? info.thumbnailUrl : info.thumbnailUrl?.replace('maxresdefault', 'mqdefault')}
              alt=""
              loading="lazy"
              onError={() => setThumbLevel((n) => n + 1)}
              // Siempre recortada al marco: los videos son verticales por dentro aunque la URL
              // sea de un video normal, así corto y explicativo se ven igual
              className="w-full h-full object-cover"
            />
          )}
          <span
            className="absolute"
            style={{ top: PLAY_MARGIN, [PLAY_CORNER]: PLAY_MARGIN }}
          >
            <svg width={68 * PLAY_SCALE} height={48 * PLAY_SCALE} viewBox="0 0 68 48" aria-hidden="true">
              <rect width="68" height="48" rx="14" fill="#f00" />
              <path d="M45 24 27 14v20z" fill="#fff" />
            </svg>
          </span>
        </button>
      ) : (
        <iframe
          src={embedSrc}
          title={info.label}
          frameBorder="0"
          scrolling="no"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute top-0 left-0 w-full h-full"
        />
      )}
    </div>
  );
}
