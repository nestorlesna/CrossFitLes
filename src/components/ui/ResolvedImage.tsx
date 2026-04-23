import { useState, useEffect } from 'react';
import { getImageDisplayUrl } from '../../services/mediaService';

interface Props {
  path: string | null | undefined;
  alt?: string;
  className?: string;
  fallback?: React.ReactNode;
}

// Resuelve el path relativo de una imagen al src real (filesystem nativo o data URL).
// Necesario en Android porque los paths como "exercises/uuid.jpg" no son URLs válidas.
export function ResolvedImage({ path, alt, className, fallback }: Props) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!path) { setSrc(null); return; }
    getImageDisplayUrl(path).then(setSrc).catch(() => setSrc(null));
  }, [path]);

  if (!src) return <>{fallback ?? null}</>;
  return <img src={src} alt={alt ?? ''} className={className} />;
}
