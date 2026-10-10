// Sección "Contenido online" en Configuración.
// - Actualizar contenido: baja clases, ejercicios (con imágenes), catálogos y planes publicados,
//   sin pisar lo que el usuario creó o editó y sin tocar sesiones ni récords.
// - Publicar contenido: sólo en la PC del administrador (`npm run dev`), escribe los archivos en
//   el clon local de CrossFitLes-content para después hacer git push.
import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { CloudDownload, CloudUpload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getContentStatus, syncContent, ContentStatus, SyncSummary } from '../../services/contentSyncService';
import { publishContent, PublishResult } from '../../services/contentPublishService';
import { formatDate } from '../../utils/formatters';

const canPublish = import.meta.env.DEV && Capacitor.getPlatform() === 'web';

function summaryLines(s: SyncSummary): string[] {
  const lines: string[] = [];
  const add = (n: number, text: string) => n > 0 && lines.push(`${n} ${text}`);
  add(s.classesAdded, s.classesAdded === 1 ? 'clase nueva' : 'clases nuevas');
  add(s.classesUpdated, s.classesUpdated === 1 ? 'clase actualizada' : 'clases actualizadas');
  add(s.exercisesAdded, s.exercisesAdded === 1 ? 'ejercicio nuevo' : 'ejercicios nuevos');
  add(s.exercisesUpdated, s.exercisesUpdated === 1 ? 'ejercicio actualizado' : 'ejercicios actualizados');
  add(s.plansAdded, s.plansAdded === 1 ? 'plan nuevo (en borrador)' : 'planes nuevos (en borrador)');
  add(s.plansUpdated, s.plansUpdated === 1 ? 'plan actualizado' : 'planes actualizados');
  add(s.challengesAdded, s.challengesAdded === 1 ? 'challenge nuevo' : 'challenges nuevos');
  add(s.challengesUpdated, s.challengesUpdated === 1 ? 'challenge actualizado' : 'challenges actualizados');
  add(s.catalogsAdded, s.catalogsAdded === 1 ? 'dato de catálogo nuevo' : 'datos de catálogo nuevos');
  const skipped = s.exercisesSkipped + s.classesSkipped + s.plansSkipped;
  if (skipped > 0) lines.push(`${skipped} sin cambiar porque los editaste o ya los usaste`);
  return lines;
}

export function ContentSyncSection() {
  const [status, setStatus] = useState<ContentStatus | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [summary, setSummary] = useState<SyncSummary | null>(null);
  const [published, setPublished] = useState<PublishResult | null>(null);

  const loadStatus = () => getContentStatus().then(setStatus).catch(() => setStatus(null));

  useEffect(() => {
    loadStatus();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setSummary(null);
    try {
      const result = await syncContent();
      setSummary(result);
      if (result.upToDate) {
        toast.info('Ya tenés el contenido al día');
      } else {
        toast.success('Contenido actualizado');
      }
      await loadStatus();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar el contenido');
    } finally {
      setSyncing(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    setPublished(null);
    try {
      const result = await publishContent();
      setPublished(result);
      if (!result.changed) {
        toast.info(`Sin cambios desde la versión ${result.contentVersion}`);
      } else if (result.writtenTo === 'repo') {
        toast.success(`Versión ${result.contentVersion} lista. Falta hacer git push.`);
      } else {
        toast.success(`Versión ${result.contentVersion} descargada. Copiala al repo de contenido.`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al publicar el contenido');
    } finally {
      setPublishing(false);
    }
  };

  const busy = syncing || publishing;
  const lines = summary && !summary.upToDate ? summaryLines(summary) : [];

  return (
    <section>
      <p className="text-[11px] text-gray-600 mb-3 px-1">
        Baja las clases, ejercicios y planes publicados. No modifica lo que creaste o editaste, ni
        tus sesiones y récords.
      </p>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden divide-y divide-gray-800 shadow-lg">
        <button
          onClick={handleSync}
          disabled={busy}
          className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-800/60 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center shrink-0 border border-primary-500/20 group-hover:border-primary-500/50 transition-colors">
            {syncing ? (
              <Loader2 size={18} className="text-primary-500 animate-spin" />
            ) : (
              <CloudDownload size={18} className="text-primary-500" />
            )}
          </div>
          <div className="flex-1">
            <span className="text-sm text-white font-bold block">Actualizar contenido</span>
            <span className="text-[11px] text-gray-500">
              {status && status.localVersion > 0
                ? `Versión ${status.localVersion}${status.lastSync ? ` · ${formatDate(status.lastSync)}` : ''}`
                : 'Todavía no se bajó contenido'}
            </span>
          </div>
        </button>

        {canPublish && (
          <button
            onClick={handlePublish}
            disabled={busy}
            className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-800/60 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0 border border-amber-500/20 group-hover:border-amber-500/50 transition-colors">
              {publishing ? (
                <Loader2 size={18} className="text-amber-400 animate-spin" />
              ) : (
                <CloudUpload size={18} className="text-amber-400" />
              )}
            </div>
            <div className="flex-1">
              <span className="text-sm text-white font-bold block">Publicar contenido</span>
              <span className="text-[11px] text-gray-500">Sólo administrador · genera los archivos para el repo público</span>
            </div>
          </button>
        )}
      </div>

      {lines.length > 0 && (
        <div className="bg-gray-950 border border-gray-800 rounded-xl p-3 mt-3 space-y-0.5">
          {lines.map((line) => (
            <p key={line} className="text-xs text-gray-400">{line}</p>
          ))}
        </div>
      )}

      {published && published.changed && (
        <div className="bg-gray-950 border border-gray-800 rounded-xl p-3 mt-3 space-y-0.5">
          <p className="text-xs text-gray-300">
            Versión {published.contentVersion} · {published.counts.classes} clases ·{' '}
            {published.counts.exercises} ejercicios · {published.counts.plans} planes ·{' '}
            {published.counts.challenges ?? 0} challenges · {published.sizeKb} KB
          </p>
          {published.repoDir && (
            <p className="text-[11px] text-gray-500 break-all">
              Escrito en {published.repoDir}. Ahora: git add, commit y push.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
