import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { APP_VERSION, VERSION_CHECK_URL } from '../config/version';

export interface UpdateInfo {
  version: string;
  downloadUrl: string;
}

// Retorna true si a es estrictamente mayor que b (semver simple X.Y.Z)
function semverGt(a: string, b: string): boolean {
  const parse = (v: string) => v.replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
  const [aMaj, aMin, aPat] = parse(a);
  const [bMaj, bMin, bPat] = parse(b);
  if (aMaj !== bMaj) return aMaj > bMaj;
  if (aMin !== bMin) return aMin > bMin;
  return aPat > bPat;
}

type FileOpenerPlugin = { open: (opts: { filePath: string; contentType: string }) => Promise<void> };

export function useUpdateCheck() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [installError, setInstallError] = useState(false);
  const checked = useRef(false);

  useEffect(() => {
    // Solo en Android nativo y una única vez por sesión
    if (!Capacitor.isNativePlatform() || checked.current) return;
    checked.current = true;

    (async () => {
      try {
        const res = await fetch(VERSION_CHECK_URL);
        if (!res.ok) return;

        const data = await res.json();
        const serverVersion = String(data.tag_name ?? '').replace(/^v/, '');
        if (!serverVersion) return;

        type GithubAsset = { name: string; browser_download_url: string };
        const apkAsset = (data.assets as GithubAsset[] | undefined)
          ?.find(a => a.name.toLowerCase().endsWith('.apk'));
        if (!apkAsset) return;

        if (semverGt(serverVersion, APP_VERSION)) {
          setUpdateInfo({ version: serverVersion, downloadUrl: apkAsset.browser_download_url });
        }
      } catch {
        // Fallos de red se ignoran silenciosamente
      }
    })();
  }, []);

  const startDownload = async () => {
    if (!updateInfo) return;
    setInstallError(false);

    // Intentar cargar @capacitor-community/file-opener (plugin opcional)
    let fileOpener: FileOpenerPlugin | null = null;
    try {
      const mod = await import('@capacitor-community/file-opener');
      fileOpener = mod.FileOpener;
    } catch {
      // Plugin no instalado — abrir URL en browser externo como fallback
      window.open(updateInfo.downloadUrl, '_system');
      setUpdateInfo(null);
      return;
    }

    if (!fileOpener) {
      window.open(updateInfo.downloadUrl, '_system');
      setUpdateInfo(null);
      return;
    }

    setDownloading(true);
    setProgress(0);

    // Suscribir listener de progreso antes de iniciar la descarga
    const downloadUrl = updateInfo.downloadUrl;
    const handle = await Filesystem.addListener('progress', ({ url, bytes, contentLength }) => {
      if (url === downloadUrl && contentLength > 0) {
        setProgress(Math.round((bytes / contentLength) * 100));
      }
    });

    try {
      const result = await Filesystem.downloadFile({
        url: downloadUrl,
        path: 'crossfitles-update.apk',
        directory: Directory.Cache,
        recursive: true,
        progress: true,
      });

      await handle.remove();

      if (!result.path) throw new Error('No se obtuvo la ruta del archivo descargado');

      await fileOpener.open({
        filePath: result.path,
        contentType: 'application/vnd.android.package-archive',
      });
    } catch {
      await handle.remove();
      // Fallback: abrir URL directamente en el browser externo
      setInstallError(true);
      window.open(downloadUrl, '_system');
    } finally {
      setDownloading(false);
    }
  };

  return {
    updateInfo,
    downloading,
    progress,
    installError,
    startDownload,
    dismiss: () => setUpdateInfo(null),
  };
}
