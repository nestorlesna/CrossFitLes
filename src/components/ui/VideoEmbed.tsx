// Embebe un video de YouTube (incluye Shorts), Vimeo, Facebook (Reels/Watch),
// Instagram o TikTok. Si no reconoce la URL, muestra un enlace.

import type { CSSProperties } from 'react';
import { detectVideo } from '../../utils/videoEmbed';

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
}

export function VideoEmbed({ url, autoplay = true, className = '', fit = false }: VideoEmbedProps) {
  const info = detectVideo(url, autoplay);

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

  const [w, h] = info.vertical ? [9, 16] : [16, 9];

  return (
    <div
      className={`relative bg-black rounded-lg overflow-hidden border border-gray-800 mx-auto ${fit ? 'video-fit' : 'w-full'} ${className}`}
      style={{
        aspectRatio: `${w} / ${h}`,
        maxWidth: info.vertical ? 360 : undefined,
        ...(fit
          ? ({
              '--video-w': w,
              '--video-h': h,
              '--video-max-width': info.vertical ? '360px' : '100%',
            } as CSSProperties)
          : {}),
      }}
    >
      <iframe
        src={info.embedUrl}
        title={info.label}
        frameBorder="0"
        scrolling="no"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="absolute top-0 left-0 w-full h-full"
      />
    </div>
  );
}
