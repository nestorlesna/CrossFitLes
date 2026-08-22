// Clase por video: cuando la plantilla tiene un video de cabecera, la sesión se
// ejecuta mostrando solo ese video a pantalla completa. Al terminar (por duración
// cargada o por el botón de finalizar) se cierra la sesión igual que la clase guiada:
// se guardan los resultados, la duración, las calorías estimadas y el resumen.
import { useEffect, useMemo, useRef, useState, useId } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Play, Flag, CheckCircle2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../../components/ui/Modal';
import { VideoEmbed } from '../../components/ui/VideoEmbed';
import { getById as getSessionById, finalize, saveResults } from '../../db/repositories/trainingSessionRepo';
import { getById as getTemplateById } from '../../db/repositories/classTemplateRepo';
import { SessionWithRelations } from '../../models/TrainingSession';
import { ClassTemplateWithSections } from '../../models/ClassTemplate';
import { GeneralFeeling } from '../../types';
import { formatClock } from '../../services/timerEngine';
import { detectVideo } from '../../utils/videoEmbed';

export function SessionVideoPage() {
  const uid = useId();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionWithRelations | null>(null);
  const [template, setTemplate] = useState<ClassTemplateWithSections | null>(null);

  const [hasStarted, setHasStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoFinished, setAutoFinished] = useState(false);

  const [feeling, setFeeling] = useState<GeneralFeeling>('normal');
  const [effort, setEffort] = useState(5);
  const [notes, setNotes] = useState('');

  const wakeLockRef = useRef<any>(null);

  const videoUrl = template?.video_url ?? '';
  const videoSeconds = template?.video_duration_seconds ?? 0;
  const info = useMemo(() => detectVideo(videoUrl), [videoUrl]);

  // ── Carga de datos ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function load() {
      try {
        const sess = await getSessionById(id!);
        if (cancelled) return;
        if (!sess) {
          toast.error('Sesión no encontrada');
          navigate('/sesiones');
          return;
        }
        if (!sess.class_template_id) {
          toast.error('Esta sesión no tiene una clase asociada');
          navigate(`/sesiones/${id}/ejecutar`);
          return;
        }

        const templ = await getTemplateById(sess.class_template_id);
        if (cancelled) return;
        if (!templ) {
          toast.error('Clase no encontrada');
          navigate('/sesiones');
          return;
        }
        if (!templ.video_url) {
          // Sin video no hay nada que mostrar: cae en la clase guiada normal
          navigate(`/sesiones/${id}/cronometro`, { replace: true });
          return;
        }

        setSession(sess);
        setTemplate(templ);
      } catch {
        if (!cancelled) toast.error('Error al cargar la clase');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  // ── Cronómetro de la clase ────────────────────────────────────────────────
  useEffect(() => {
    if (!hasStarted || showFinishModal) return;
    const t = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(t);
  }, [hasStarted, showFinishModal]);

  // Cierre automático al llegar a la duración del video (si está cargada)
  useEffect(() => {
    if (!hasStarted || autoFinished || videoSeconds <= 0) return;
    if (elapsed >= videoSeconds) {
      setAutoFinished(true);
      setShowFinishModal(true);
    }
  }, [elapsed, hasStarted, autoFinished, videoSeconds]);

  // ── Mantener la pantalla encendida mientras corre el video ────────────────
  useEffect(() => {
    if (!hasStarted) return;

    let cancelled = false;
    const anyNav = navigator as any;

    if (anyNav.wakeLock?.request) {
      anyNav.wakeLock
        .request('screen')
        .then((lock: any) => {
          if (cancelled) lock.release().catch(() => {});
          else wakeLockRef.current = lock;
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
      wakeLockRef.current?.release?.().catch(() => {});
      wakeLockRef.current = null;
    };
  }, [hasStarted]);

  // ── Finalización ──────────────────────────────────────────────────────────
  const handleFinalize = async () => {
    if (!id || !session) return;
    setSaving(true);
    try {
      // Los ejercicios de la clase son los del video: se registran tal cual vinieron
      // de la plantilla (marcados como completados) y se cierra la sesión.
      await saveResults(id, session.results);
      await finalize(id, {
        durationMinutes: Math.max(1, Math.round(elapsed / 60)),
        feeling,
        effort,
        notes,
      });
      toast.success('¡Clase completada!');
      navigate(`/sesiones/${id}`);
    } catch {
      toast.error('Error al finalizar la clase');
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary-500" />
      </div>
    );
  }

  if (!template) return null;

  const exerciseCount = template.sections.reduce((acc, s) => acc + s.exercises.length, 0);
  const remaining = videoSeconds > 0 ? Math.max(0, videoSeconds - elapsed) : 0;

  // ── Pantalla previa al arranque ──
  if (!hasStarted) {
    return (
      <div className="fixed inset-0 bg-gray-950 flex flex-col z-[60]">
        <div className="p-4">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Salir"
          >
            <ChevronLeft size={24} />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6 text-center overflow-y-auto">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary-500 mb-2">
              Clase por video
            </p>
            <h1 className="text-3xl font-bold text-white">{template.name}</h1>
            {template.objective && (
              <p className="text-gray-400 text-sm mt-2">{template.objective}</p>
            )}
          </div>

          <div className="flex gap-8">
            <div>
              <p className="text-2xl font-bold text-white">{template.sections.length}</p>
              <p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Secciones</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{exerciseCount}</p>
              <p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Ejercicios</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {videoSeconds > 0 ? formatClock(videoSeconds) : '--'}
              </p>
              <p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Video</p>
            </div>
          </div>

          <button
            onClick={() => setHasStarted(true)}
            className="w-full max-w-xs bg-primary-600 hover:bg-primary-700 text-white rounded-2xl py-5 flex items-center justify-center gap-3 font-bold text-lg shadow-lg shadow-primary-900/30 active:scale-[0.97] transition-transform"
          >
            <Play size={24} fill="currentColor" />
            Empezar
          </button>

          <p className="text-xs text-gray-600 max-w-xs">
            {videoSeconds > 0
              ? 'Seguí el video de principio a fin. Al llegar a su duración la clase se cierra sola y se registra la sesión.'
              : 'Seguí el video de principio a fin y tocá "Finalizar" cuando termine para registrar la sesión.'}
          </p>
        </div>
      </div>
    );
  }

  // ── Pantalla del video ──
  return (
    // z-[60]: tapa el BottomNav (fixed en z-50)
    <div className="fixed inset-0 bg-gray-950 flex flex-col z-[60]">
      {/* Encabezado mínimo: nombre de la clase y reloj */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Salir"
        >
          <ChevronLeft size={22} />
        </button>

        <div className="text-center min-w-0 px-2">
          <p className="text-xs font-bold uppercase tracking-widest text-primary-500 truncate">
            {template.name}
          </p>
          <p className="text-[10px] text-gray-500 font-bold">{info.label}</p>
        </div>

        <div className="min-w-[44px] text-right">
          <p className="text-xs font-mono text-gray-400">
            {videoSeconds > 0 ? `-${formatClock(remaining)}` : formatClock(elapsed)}
          </p>
        </div>
      </div>

      {/* Barra de avance del video (solo si se cargó la duración) */}
      {videoSeconds > 0 && (
        <div className="h-1 bg-gray-900 mx-4 rounded-full overflow-hidden shrink-0">
          <div
            className="h-full bg-primary-500 transition-all duration-1000 ease-linear"
            style={{ width: `${Math.min(100, (elapsed / videoSeconds) * 100)}%` }}
          />
        </div>
      )}

      {/* El video ocupa la pantalla, acotado al alto disponible para que no
          aparezca scroll (video-stage define el 100cqh que usa .video-fit) */}
      <div className="video-stage flex-1 flex items-center justify-center px-2 py-3 min-h-0 overflow-hidden">
        <VideoEmbed url={videoUrl} fit />
      </div>

      {/* Controles */}
      <div className="shrink-0 px-6 pb-8 pt-2 flex items-center justify-center gap-4">
        <a
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-14 h-14 rounded-2xl bg-gray-900 border border-gray-800 text-gray-400 flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Abrir el video en el navegador"
        >
          <ExternalLink size={22} />
        </a>

        <button
          onClick={() => setShowFinishModal(true)}
          className="flex-1 max-w-xs bg-primary-600 hover:bg-primary-700 text-white rounded-2xl py-4 flex items-center justify-center gap-2 font-bold active:scale-[0.97] transition-transform"
        >
          <Flag size={20} />
          Finalizar clase
        </button>
      </div>

      {/* Resumen final */}
      <Modal
        isOpen={showFinishModal}
        onClose={() => setShowFinishModal(false)}
        title="Finalizar clase"
        footer={
          <div className="flex gap-3 w-full">
            <button
              className="flex-1 border border-gray-700 text-gray-400 rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-50"
              onClick={() => setShowFinishModal(false)}
              disabled={saving}
            >
              Seguir
            </button>
            <button
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white rounded-xl px-4 py-3 text-sm font-bold disabled:opacity-50"
              onClick={handleFinalize}
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar y cerrar'}
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-6 py-2">
          <div className="flex flex-col items-center text-center gap-1">
            <div className="w-16 h-16 bg-primary-500/10 rounded-full flex items-center justify-center mb-2">
              <CheckCircle2 size={32} className="text-primary-500" />
            </div>
            <p className="text-xl font-bold text-white">
              {autoFinished ? '¡Video terminado!' : '¿Cerrar la clase?'}
            </p>
            <p className="text-sm text-gray-400">{formatClock(elapsed)} de entrenamiento.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-3">¿Cómo te sentiste?</label>
            <div className="flex justify-between gap-2">
              {(['terrible', 'bad', 'normal', 'good', 'excellent'] as GeneralFeeling[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFeeling(f)}
                  className={`flex-1 py-3 rounded-xl border text-xl transition-all ${
                    feeling === f
                      ? 'bg-primary-500/20 border-primary-500'
                      : 'bg-gray-900 border-gray-800 opacity-40'
                  }`}
                >
                  {f === 'terrible' && '😫'}
                  {f === 'bad' && '😕'}
                  {f === 'normal' && '😐'}
                  {f === 'good' && '😊'}
                  {f === 'excellent' && '🔥'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Esfuerzo (RPE)</label>
              <span className="text-xs font-bold text-primary-500">{effort}/10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={effort}
              onChange={(e) => setEffort(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
          </div>

          <div>
            <label htmlFor={`${uid}-notas`} className="block text-xs font-bold text-gray-500 uppercase mb-2">Notas</label>
            <textarea
              id={`${uid}-notas`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="¿Algo para recordar de hoy?"
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary-500 min-h-[80px] resize-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
