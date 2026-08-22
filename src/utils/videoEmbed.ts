// Detección de proveedor de video y armado de la URL de embed.
// Compartido por VideoEmbed, la página de prueba de videos y la clase guiada por video.

export type VideoProvider =
  | 'youtube'
  | 'youtube-short'
  | 'vimeo'
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'file'
  | 'unknown';

export interface VideoEmbedInfo {
  provider: VideoProvider;
  /** Nombre legible del proveedor (para títulos/badges) */
  label: string;
  /** URL lista para poner en el iframe (o el src directo si es un archivo) */
  embedUrl: string;
  /** true = formato vertical 9:16 (reels/shorts) */
  vertical: boolean;
}

/**
 * Reconoce la plataforma de una URL de video y devuelve la URL embebible.
 * @param rawUrl URL original pegada por el usuario
 * @param autoplay agrega el parámetro de autoplay donde la plataforma lo soporta
 */
export function detectVideo(rawUrl: string, autoplay = false): VideoEmbedInfo {
  const url = (rawUrl ?? '').trim();
  if (!url) return { provider: 'unknown', label: 'No reconocido', embedUrl: '', vertical: false };

  // YouTube Shorts
  const short = url.match(/youtube\.com\/shorts\/([^#&?/]+)/);
  if (short) {
    return {
      provider: 'youtube-short',
      label: 'YouTube Shorts',
      embedUrl: `https://www.youtube.com/embed/${short[1]}${autoplay ? '?autoplay=1' : ''}`,
      vertical: true,
    };
  }

  // YouTube normal (watch, youtu.be, embed, v)
  const yt = url.match(/(?:youtube\.com\/(?:v\/|embed\/)|youtu\.be\/|[?&]v=)([^#&?/]+)/);
  if (yt) {
    return {
      provider: 'youtube',
      label: 'YouTube',
      embedUrl: `https://www.youtube.com/embed/${yt[1]}${autoplay ? '?autoplay=1' : ''}`,
      vertical: false,
    };
  }

  // Vimeo
  const vimeo = url.match(/vimeo\.com\/(?:video\/|channels\/(?:\w+\/)?|groups\/(?:\w+\/)?|album\/(?:\w+\/)?|showcase\/(?:\w+\/)?)?(\d+)/);
  if (vimeo) {
    return {
      provider: 'vimeo',
      label: 'Vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeo[1]}${autoplay ? '?autoplay=1' : ''}`,
      vertical: false,
    };
  }

  // Facebook (reels, watch, videos) → plugin oficial
  if (/facebook\.com|fb\.watch/.test(url)) {
    const isReel = /\/reel\//.test(url);
    return {
      provider: 'facebook',
      label: isReel ? 'Facebook Reel' : 'Facebook Video',
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&autoplay=${autoplay ? 'true' : 'false'}`,
      vertical: isReel,
    };
  }

  // Instagram (reels y posts)
  const ig = url.match(/instagram\.com\/(?:reel|reels|p|tv)\/([^/?#]+)/);
  if (ig) {
    return {
      provider: 'instagram',
      label: 'Instagram',
      embedUrl: `https://www.instagram.com/reel/${ig[1]}/embed`,
      vertical: true,
    };
  }

  // TikTok
  const tt = url.match(/tiktok\.com\/(?:@[^/]+\/video\/|v\/)(\d+)/);
  if (tt) {
    return {
      provider: 'tiktok',
      label: 'TikTok',
      embedUrl: `https://www.tiktok.com/embed/v2/${tt[1]}`,
      vertical: true,
    };
  }

  // Archivo de video directo
  if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)) {
    return { provider: 'file', label: 'Archivo de video', embedUrl: url, vertical: false };
  }

  return { provider: 'unknown', label: 'No reconocido', embedUrl: url, vertical: false };
}

/** true si la URL corresponde a alguna plataforma que sabemos embeber */
export function isEmbeddableVideo(url: string): boolean {
  return detectVideo(url).provider !== 'unknown';
}
