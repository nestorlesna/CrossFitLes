// Sección "Contenido online" en Configuración.
// - Actualizar contenido: baja clases, ejercicios (con imágenes), catálogos y planes publicados,
//   sin pisar lo que el usuario creó o editó y sin tocar sesiones ni récords.
// - Actualizar MI contenido: lo mismo con el canal personal cifrado; sólo aparece si el
//   dispositivo guardó la semilla (7 toques en la versión, en Acerca de).
// - Publicar contenido / Publicar MI contenido: sólo en la PC del administrador (`npm run dev`),
//   eligen qué clases nuevas suman y escriben los archivos en el clon local de
//   CrossFitLes-content para después hacer git push.
import { useEffect, useState, type ReactNode } from 'react';
import { Capacitor } from '@capacitor/core';
import { CloudDownload, CloudUpload, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import {
  getContentStatus,
  getMineSeed,
  syncContent,
  ContentStatus,
  SyncSummary,
} from '../../services/contentSyncService';
import { preparePublish, publishDraft, PublishDraft, PublishResult } from '../../services/contentPublishService';
import type { ContentChannel } from '../../services/contentFormat';
import { formatDate } from '../../utils/formatters';
import { PublishClassesModal } from './PublishClassesModal';

const canPublish = import.meta.env.DEV && Capacitor.getPlatform() === 'web';

type Busy = { action: 'sync' | 'publish'; channel: ContentChannel } | null;

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

function statusText(status: ContentStatus | null): string {
  return status && status.localVersion > 0
    ? `Versión ${status.localVersion}${status.lastSync ? ` · ${formatDate(status.lastSync)}` : ''}`
    : 'Todavía no se bajó contenido';
}

function ActionRow({ icon, title, detail, color, loading, disabled, onClick }: {
  icon: ReactNode;
  title: string;
  detail: string;
  color: 'primary' | 'amber';
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const box =
    color === 'primary'
      ? 'bg-primary-500/10 border-primary-500/20 group-hover:border-primary-500/50 text-primary-500'
      : 'bg-amber-500/10 border-amber-500/20 group-hover:border-amber-500/50 text-amber-400';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-800/60 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed group"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${box}`}>
        {loading ? <Loader2 size={18} className="animate-spin" /> : icon}
      </div>
      <div className="flex-1">
        <span className="text-sm text-white font-bold block">{title}</span>
        <span className="text-[11px] text-gray-500">{detail}</span>
      </div>
    </button>
  );
}

export function ContentSyncSection() {
  const [status, setStatus] = useState<ContentStatus | null>(null);
  const [mineStatus, setMineStatus] = useState<ContentStatus | null>(null);
  const [hasMine, setHasMine] = useState(false);
  const [busy, setBusy] = useState<Busy>(null);
  const [summary, setSummary] = useState<SyncSummary | null>(null);
  const [published, setPublished] = useState<PublishResult | null>(null);
  const [draft, setDraft] = useState<PublishDraft | null>(null);

  const loadStatus = async () => {
    try {
      setStatus(await getContentStatus('public'));
      const seed = await getMineSeed();
      setHasMine(!!seed);
      setMineStatus(seed ? await getContentStatus('mine') : null);
    } catch {
      setStatus(null);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleSync = async (channel: ContentChannel) => {
    setBusy({ action: 'sync', channel });
    setSummary(null);
    try {
      const result = await syncContent(false, channel);
      setSummary(result);
      if (result.upToDate) {
        toast.info(channel === 'mine' ? 'Ya tenés tu contenido al día' : 'Ya tenés el contenido al día');
      } else {
        toast.success(channel === 'mine' ? 'Tu contenido está actualizado' : 'Contenido actualizado');
      }
      await loadStatus();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar el contenido');
    } finally {
      setBusy(null);
    }
  };

  // Paso 1: armar el contenido y abrir la lista de clases nuevas
  const handlePrepare = async (channel: ContentChannel) => {
    setBusy({ action: 'publish', channel });
    setPublished(null);
    try {
      setDraft(await preparePublish(channel));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al armar el contenido');
      setBusy(null);
    }
  };

  // Paso 2: publicar con las clases elegidas
  const handlePublish = async (selectedKeys: string[]) => {
    if (!draft) return;
    const current = draft;
    setDraft(null);
    try {
      const result = await publishDraft(current, selectedKeys);
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
      setBusy(null);
    }
  };

  const cancelPublish = () => {
    setDraft(null);
    setBusy(null);
  };

  const isBusy = (action: 'sync' | 'publish', channel: ContentChannel) =>
    busy?.action === action && busy.channel === channel;
  const lines = summary && !summary.upToDate ? summaryLines(summary) : [];

  return (
    <section>
      <p className="text-[11px] text-gray-600 mb-3 px-1">
        Baja las clases, ejercicios y planes publicados. No modifica lo que creaste o editaste, ni
        tus sesiones y récords.
      </p>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden divide-y divide-gray-800 shadow-lg">
        <ActionRow
          icon={<CloudDownload size={18} />}
          title="Actualizar contenido"
          detail={statusText(status)}
          color="primary"
          loading={isBusy('sync', 'public')}
          disabled={!!busy}
          onClick={() => handleSync('public')}
        />

        {hasMine && (
          <ActionRow
            icon={<Lock size={18} />}
            title="Actualizar MI contenido"
            detail={statusText(mineStatus)}
            color="primary"
            loading={isBusy('sync', 'mine')}
            disabled={!!busy}
            onClick={() => handleSync('mine')}
          />
        )}

        {canPublish && (
          <>
            <ActionRow
              icon={<CloudUpload size={18} />}
              title="Publicar contenido"
              detail="Sólo administrador · el contenido que bajan todos"
              color="amber"
              loading={isBusy('publish', 'public')}
              disabled={!!busy}
              onClick={() => handlePrepare('public')}
            />
            <ActionRow
              icon={<Lock size={18} />}
              title="Publicar MI contenido"
              detail="Sólo administrador · cifrado, sólo para tu celular"
              color="amber"
              loading={isBusy('publish', 'mine')}
              disabled={!!busy}
              onClick={() => handlePrepare('mine')}
            />
          </>
        )}
      </div>

      {lines.length > 0 && (
        <div className="bg-gray-950 border border-gray-800 rounded-xl p-3 mt-3 space-y-0.5">
          {lines.map((line) => (
            <p key={line} className="text-xs text-gray-400">{line}</p>
          ))}
        </div>
      )}

      {published && (published.changed || published.excludedPlans.length > 0) && (
        <div className="bg-gray-950 border border-gray-800 rounded-xl p-3 mt-3 space-y-0.5">
          {published.changed && (
            <p className="text-xs text-gray-300">
              Versión {published.contentVersion} · {published.counts.classes} clases ·{' '}
              {published.counts.exercises} ejercicios · {published.counts.plans} planes ·{' '}
              {published.counts.challenges ?? 0} challenges · {published.sizeKb} KB
            </p>
          )}
          {published.excludedPlans.length > 0 && (
            <p className="text-[11px] text-amber-400">
              Planes que no se publicaron porque usan clases que no van:{' '}
              {published.excludedPlans.join(', ')}
            </p>
          )}
          {published.changed && published.repoDir && (
            <p className="text-[11px] text-gray-500 break-all">
              Escrito en {published.repoDir}. Ahora: git add, commit y push.
            </p>
          )}
        </div>
      )}

      <PublishClassesModal draft={draft} onClose={cancelPublish} onConfirm={handlePublish} />
    </section>
  );
}
