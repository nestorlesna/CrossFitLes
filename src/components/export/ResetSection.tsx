// Sección de inicialización/reset — solo ejecución manual.
// · "Inicializar Datos": borra todo y carga catálogos + 3.242 ejercicios (con progreso)
// · "Agregar Open 26": aditivo — crea plantillas 26.1, 26.2, 26.3 sin borrar nada
// · "Agregar Girls": aditivo — crea las 21 plantillas Girls
// · "Agregar Heroes": aditivo — crea las 21 plantillas Heroes
import { useState } from 'react';
import { RotateCcw, Loader2, AlertTriangle, Trophy, Users, Shield, CalendarDays, ImagePlay } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../ui/Modal';
import { resetAndReSeedAll } from '../../services/seedService2';
import { addOpenTemplates } from '../../services/seedService3';
import { addGirlsTemplates, addHeroesTemplates } from '../../services/seedService4';
import { addDailyWodsMarch2026 } from '../../services/seedService5';
import { addDailyWodsFebMar2026 } from '../../services/seedService6';
import { updateExerciseImages } from '../../services/imageUpdateService';
import { getDatabase } from '../../db/database';

export function ResetSection() {
  const [confirmInit, setConfirmInit] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmGirls, setConfirmGirls] = useState(false);
  const [confirmHeroes, setConfirmHeroes] = useState(false);
  const [confirmMarch, setConfirmMarch] = useState(false);
  const [confirmFebMar, setConfirmFebMar] = useState(false);
  const [confirmImages, setConfirmImages] = useState(false);

  // Estado de progreso para la inicialización
  const [initBusy, setInitBusy] = useState(false);
  const [progress, setProgress] = useState<{ loaded: number; total: number } | null>(null);

  const [openBusy, setOpenBusy] = useState(false);
  const [girlsBusy, setGirlsBusy] = useState(false);
  const [heroesBusy, setHeroesBusy] = useState(false);
  const [marchBusy, setMarchBusy] = useState(false);
  const [febMarBusy, setFebMarBusy] = useState(false);
  const [imagesBusy, setImagesBusy] = useState(false);

  // ── Inicializar Datos ──────────────────────────────────────────────────────

  const handleInit = async () => {
    setConfirmInit(false);
    setInitBusy(true);
    setProgress({ loaded: 0, total: 3242 });

    try {
      await resetAndReSeedAll((loaded, total) => {
        setProgress({ loaded, total });
      });

      toast.success('Base de datos inicializada correctamente');
      // Recarga para reiniciar el estado React con la nueva BD
      setTimeout(() => { window.location.href = '/'; }, 800);
    } catch (error) {
      console.error('Error en inicialización:', error);
      toast.error(`Error al inicializar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      setInitBusy(false);
      setProgress(null);
    }
  };

  // ── Agregar Open 26 ────────────────────────────────────────────────────────

  const handleOpen26 = async () => {
    setConfirmOpen(false);
    setOpenBusy(true);
    try {
      const db = getDatabase();
      await addOpenTemplates(db);
      toast.success('Plantillas del Open 26 agregadas correctamente');
    } catch (error) {
      console.error('Error en Open 26:', error);
      toast.error(`Error al agregar plantillas: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setOpenBusy(false);
    }
  };

  // ── Agregar Girls ──────────────────────────────────────────────────────────

  const handleGirls = async () => {
    setConfirmGirls(false);
    setGirlsBusy(true);
    try {
      const db = getDatabase();
      await addGirlsTemplates(db);
      toast.success('21 plantillas Girls agregadas correctamente');
    } catch (error) {
      console.error('Error en Girls:', error);
      toast.error(`Error al agregar Girls: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setGirlsBusy(false);
    }
  };

  // ── Agregar Heroes ─────────────────────────────────────────────────────────

  const handleHeroes = async () => {
    setConfirmHeroes(false);
    setHeroesBusy(true);
    try {
      const db = getDatabase();
      await addHeroesTemplates(db);
      toast.success('21 plantillas Heroes agregadas correctamente');
    } catch (error) {
      console.error('Error en Heroes:', error);
      toast.error(`Error al agregar Heroes: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setHeroesBusy(false);
    }
  };

  // ── Agregar WODs Marzo 2026 ────────────────────────────────────────────────

  const handleMarch = async () => {
    setConfirmMarch(false);
    setMarchBusy(true);
    try {
      const db = getDatabase();
      await addDailyWodsMarch2026(db);
      toast.success('WODs de Marzo 2026 agregados correctamente');
    } catch (error) {
      console.error('Error en WODs Marzo 2026:', error);
      toast.error(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setMarchBusy(false);
    }
  };

  // ── Agregar WODs Feb–Mar 2026 ──────────────────────────────────────────────

  const handleFebMar = async () => {
    setConfirmFebMar(false);
    setFebMarBusy(true);
    try {
      const db = getDatabase();
      await addDailyWodsFebMar2026(db);
      toast.success('WODs Feb–Mar 2026 agregados correctamente');
    } catch (error) {
      console.error('Error en WODs Feb–Mar 2026:', error);
      toast.error(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setFebMarBusy(false);
    }
  };

  // ── Actualizar Imágenes SVG ────────────────────────────────────────────────

  const handleImages = async () => {
    setConfirmImages(false);
    setImagesBusy(true);
    try {
      const db = getDatabase();
      const updated = await updateExerciseImages(db);
      toast.success(`${updated} ejercicios actualizados con imagen SVG`);
    } catch (error) {
      console.error('Error actualizando imágenes:', error);
      toast.error(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setImagesBusy(false);
    }
  };

  // ── Progreso ───────────────────────────────────────────────────────────────

  const progressPct = progress
    ? Math.round((progress.loaded / progress.total) * 100)
    : 0;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Zona de Peligro ────────────────────────────────────────────────── */}
      <section className="mt-6">
        <h2 className="text-xs font-semibold text-red-500/70 uppercase tracking-wider mb-3 px-1">
          Zona de Peligro
        </h2>

        <div className="bg-gray-900 border border-red-900/20 rounded-2xl overflow-hidden">
          <button
            onClick={() => setConfirmInit(true)}
            disabled={initBusy}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-500/5 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center shrink-0">
              {initBusy
                ? <Loader2 size={16} className="text-red-400 animate-spin" />
                : <RotateCcw size={16} className="text-red-400" />
              }
            </div>
            <div className="flex-1">
              <span className="text-sm text-red-400 block">Inicializar Datos</span>
              {initBusy && progress ? (
                <div className="mt-1.5">
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 mt-0.5 block">
                    {progress.loaded.toLocaleString()} / {progress.total.toLocaleString()} ejercicios ({progressPct}%)
                  </span>
                </div>
              ) : (
                <span className="text-xs text-gray-500">
                  Borrar todo y cargar catálogos + 3.242 ejercicios con videos
                </span>
              )}
            </div>
          </button>
        </div>
      </section>

      {/* ── Datos Adicionales ──────────────────────────────────────────────── */}
      <section className="mt-4">
        <h2 className="text-xs font-semibold text-amber-500/70 uppercase tracking-wider mb-3 px-1">
          Datos Adicionales
        </h2>

        <div className="bg-gray-900 border border-amber-900/20 rounded-2xl overflow-hidden divide-y divide-amber-900/10">
          {/* Open 26 */}
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={openBusy}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-amber-500/5 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center shrink-0">
              {openBusy
                ? <Loader2 size={16} className="text-amber-400 animate-spin" />
                : <Trophy size={16} className="text-amber-400" />
              }
            </div>
            <div className="flex-1">
              <span className="text-sm text-amber-400 block">Agregar Open 26</span>
              <span className="text-xs text-gray-500">
                Agrega plantillas 26.1, 26.2 y 26.3 — no borra datos existentes
              </span>
            </div>
          </button>

          {/* Girls */}
          <button
            onClick={() => setConfirmGirls(true)}
            disabled={girlsBusy}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-amber-500/5 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center shrink-0">
              {girlsBusy
                ? <Loader2 size={16} className="text-amber-400 animate-spin" />
                : <Users size={16} className="text-amber-400" />
              }
            </div>
            <div className="flex-1">
              <span className="text-sm text-amber-400 block">Agregar Girls</span>
              <span className="text-xs text-gray-500">
                21 benchmarks clásicos (Fran, Cindy, Helen…) — no borra datos
              </span>
            </div>
          </button>

          {/* Heroes */}
          <button
            onClick={() => setConfirmHeroes(true)}
            disabled={heroesBusy}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-amber-500/5 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center shrink-0">
              {heroesBusy
                ? <Loader2 size={16} className="text-amber-400 animate-spin" />
                : <Shield size={16} className="text-amber-400" />
              }
            </div>
            <div className="flex-1">
              <span className="text-sm text-amber-400 block">Agregar Heroes</span>
              <span className="text-xs text-gray-500">
                21 WODs Héroes (JT, Murph, DT…) — no borra datos
              </span>
            </div>
          </button>

          {/* WODs Marzo 2026 */}
          <button
            onClick={() => setConfirmMarch(true)}
            disabled={marchBusy}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-amber-500/5 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center shrink-0">
              {marchBusy
                ? <Loader2 size={16} className="text-amber-400 animate-spin" />
                : <CalendarDays size={16} className="text-amber-400" />
              }
            </div>
            <div className="flex-1">
              <span className="text-sm text-amber-400 block">Agregar WODs Marzo 2026</span>
              <span className="text-xs text-gray-500">
                6 sesiones (Luke, Gravity Shift, C&J Ladder, Mogadishu Mile…)
              </span>
            </div>
          </button>

          {/* WODs Feb–Mar 2026 */}
          <button
            onClick={() => setConfirmFebMar(true)}
            disabled={febMarBusy}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-amber-500/5 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center shrink-0">
              {febMarBusy
                ? <Loader2 size={16} className="text-amber-400 animate-spin" />
                : <CalendarDays size={16} className="text-amber-400" />
              }
            </div>
            <div className="flex-1">
              <span className="text-sm text-amber-400 block">Agregar WODs Feb–Mar 2026</span>
              <span className="text-xs text-gray-500">
                20 sesiones (Siege Protocol, Whitten, The Seven, Holleyman…)
              </span>
            </div>
          </button>

          {/* Actualizar Imágenes SVG */}
          <button
            onClick={() => setConfirmImages(true)}
            disabled={imagesBusy}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-amber-500/5 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center shrink-0">
              {imagesBusy
                ? <Loader2 size={16} className="text-amber-400 animate-spin" />
                : <ImagePlay size={16} className="text-amber-400" />
              }
            </div>
            <div className="flex-1">
              <span className="text-sm text-amber-400 block">Actualizar imágenes de ejercicios</span>
              <span className="text-xs text-gray-500">
                Asigna las 91 ilustraciones SVG animadas a los ejercicios en la BD
              </span>
            </div>
          </button>
        </div>
      </section>

      {/* ── Modal: Inicializar Datos ────────────────────────────────────────── */}
      <Modal
        isOpen={confirmInit}
        onClose={() => setConfirmInit(false)}
        title="¿Inicializar base de datos?"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmInit(false)}
              className="flex-1 py-2.5 px-4 rounded-xl border border-gray-700 text-gray-300 text-sm hover:bg-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleInit}
              className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
            >
              Sí, borrar todo
            </button>
          </div>
        }
      >
        <div className="flex flex-col items-center gap-4 text-center py-2">
          <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center">
            <AlertTriangle size={24} className="text-red-400" />
          </div>
          <div>
            <p className="text-white text-sm font-medium mb-2">
              Se borrarán absolutamente todos los datos
            </p>
            <p className="text-gray-400 text-xs leading-relaxed">
              Se eliminarán sesiones, ejercicios personalizados, récords y configuraciones.
              Luego se cargarán los catálogos base y{' '}
              <span className="text-white font-medium">3.242 ejercicios</span> con videos.
              La carga puede tardar <span className="text-white font-medium">~1 minuto</span>.
            </p>
            <p className="text-red-400 text-xs mt-4 font-semibold">
              ¡Esta acción no se puede deshacer!
            </p>
          </div>
        </div>
      </Modal>

      {/* ── Modal: Agregar Open 26 ──────────────────────────────────────────── */}
      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Agregar plantillas Open 26"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmOpen(false)}
              className="flex-1 py-2.5 px-4 rounded-xl border border-gray-700 text-gray-300 text-sm hover:bg-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleOpen26}
              className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium transition-colors"
            >
              Sí, agregar
            </button>
          </div>
        }
      >
        <div className="flex flex-col items-center gap-4 text-center py-2">
          <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center">
            <Trophy size={24} className="text-amber-400" />
          </div>
          <div>
            <p className="text-white text-sm font-medium mb-2">
              Se agregarán las 3 plantillas del Open 26
            </p>
            <p className="text-gray-400 text-xs leading-relaxed">
              Se crearán las plantillas <span className="text-white font-medium">26.1</span>,{' '}
              <span className="text-white font-medium">26.2</span> y{' '}
              <span className="text-white font-medium">26.3</span> con calentamiento y pesos
              sugeridos. Los ejercicios específicos del Open (Wall Ball Shot, Box Jump-Over,
              etc.) se crearán automáticamente si no existen.
            </p>
            <p className="text-amber-400 text-xs mt-3">
              Requiere haber ejecutado "Inicializar Datos" previamente.
            </p>
          </div>
        </div>
      </Modal>

      {/* ── Modal: Agregar Girls ─────────────────────────────────────────────── */}
      <Modal
        isOpen={confirmGirls}
        onClose={() => setConfirmGirls(false)}
        title="Agregar Girls"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmGirls(false)}
              className="flex-1 py-2.5 px-4 rounded-xl border border-gray-700 text-gray-300 text-sm hover:bg-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleGirls}
              className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium transition-colors"
            >
              Sí, agregar
            </button>
          </div>
        }
      >
        <div className="flex flex-col items-center gap-4 text-center py-2">
          <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center">
            <Users size={24} className="text-amber-400" />
          </div>
          <div>
            <p className="text-white text-sm font-medium mb-2">
              Se agregarán las 21 plantillas Girls
            </p>
            <p className="text-gray-400 text-xs leading-relaxed">
              Benchmarks clásicos: <span className="text-white font-medium">Fran, Cindy, Helen, Karen, Grace</span> y 16 más.
              Cada WOD incluye calentamiento específico. Los ejercicios se crean automáticamente si no existen.
            </p>
            <p className="text-amber-400 text-xs mt-3">
              Requiere haber ejecutado "Inicializar Datos" previamente.
            </p>
          </div>
        </div>
      </Modal>

      {/* ── Modal: WODs Marzo 2026 ──────────────────────────────────────────── */}
      <Modal
        isOpen={confirmMarch}
        onClose={() => setConfirmMarch(false)}
        title="Agregar WODs Marzo 2026"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmMarch(false)}
              className="flex-1 py-2.5 px-4 rounded-xl border border-gray-700 text-gray-300 text-sm hover:bg-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleMarch}
              className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium transition-colors"
            >
              Sí, agregar
            </button>
          </div>
        }
      >
        <div className="flex flex-col items-center gap-4 text-center py-2">
          <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center">
            <CalendarDays size={24} className="text-amber-400" />
          </div>
          <div>
            <p className="text-white text-sm font-medium mb-2">
              Se agregarán 6 sesiones de Marzo 2026
            </p>
            <p className="text-gray-400 text-xs leading-relaxed">
              <span className="text-white font-medium">Luke</span> (Hero),{' '}
              <span className="text-white font-medium">Gravity Shift</span>,{' '}
              <span className="text-white font-medium">C&J Ladder</span>,{' '}
              <span className="text-white font-medium">WOD 17</span>,{' '}
              <span className="text-white font-medium">Open 26.3</span> y{' '}
              <span className="text-white font-medium">Mogadishu Mile</span>.
              Los ejercicios nuevos se crean automáticamente.
            </p>
            <p className="text-amber-400 text-xs mt-3">
              Requiere haber ejecutado "Inicializar Datos" previamente.
            </p>
          </div>
        </div>
      </Modal>

      {/* ── Modal: WODs Feb–Mar 2026 ────────────────────────────────────────── */}
      <Modal
        isOpen={confirmFebMar}
        onClose={() => setConfirmFebMar(false)}
        title="Agregar WODs Feb–Mar 2026"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmFebMar(false)}
              className="flex-1 py-2.5 px-4 rounded-xl border border-gray-700 text-gray-300 text-sm hover:bg-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleFebMar}
              className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium transition-colors"
            >
              Sí, agregar
            </button>
          </div>
        }
      >
        <div className="flex flex-col items-center gap-4 text-center py-2">
          <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center">
            <CalendarDays size={24} className="text-amber-400" />
          </div>
          <div>
            <p className="text-white text-sm font-medium mb-2">
              Se agregarán 20 sesiones (Feb 10 – Mar 12, 2026)
            </p>
            <p className="text-gray-400 text-xs leading-relaxed">
              Incluye <span className="text-white font-medium">Siege Protocol, Voltage Shift, Open 26.2, Whitten, Ground Assault, Dark Pulse, Holleyman, The Seven, Fran's Revenge</span> y más.
              Los ejercicios nuevos se crean automáticamente.
            </p>
            <p className="text-amber-400 text-xs mt-3">
              Requiere haber ejecutado "Inicializar Datos" previamente.
            </p>
          </div>
        </div>
      </Modal>

      {/* ── Modal: Actualizar Imágenes SVG ──────────────────────────────────── */}
      <Modal
        isOpen={confirmImages}
        onClose={() => setConfirmImages(false)}
        title="Actualizar imágenes de ejercicios"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmImages(false)}
              className="flex-1 py-2.5 px-4 rounded-xl border border-gray-700 text-gray-300 text-sm hover:bg-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleImages}
              className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium transition-colors"
            >
              Sí, actualizar
            </button>
          </div>
        }
      >
        <div className="flex flex-col items-center gap-4 text-center py-2">
          <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center">
            <ImagePlay size={24} className="text-amber-400" />
          </div>
          <div>
            <p className="text-white text-sm font-medium mb-2">
              Se asignarán las ilustraciones SVG animadas
            </p>
            <p className="text-gray-400 text-xs leading-relaxed">
              Se actualizará el campo <span className="text-white font-medium">image_url</span> de los{' '}
              <span className="text-white font-medium">91 ejercicios</span> que tienen SVG generado.
              Solo se modifican ejercicios que aún no tienen imagen asignada.
            </p>
            <p className="text-amber-400 text-xs mt-3">
              Requiere haber ejecutado "Inicializar Datos" previamente.
            </p>
          </div>
        </div>
      </Modal>

      {/* ── Modal: Agregar Heroes ────────────────────────────────────────────── */}
      <Modal
        isOpen={confirmHeroes}
        onClose={() => setConfirmHeroes(false)}
        title="Agregar Heroes"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmHeroes(false)}
              className="flex-1 py-2.5 px-4 rounded-xl border border-gray-700 text-gray-300 text-sm hover:bg-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleHeroes}
              className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium transition-colors"
            >
              Sí, agregar
            </button>
          </div>
        }
      >
        <div className="flex flex-col items-center gap-4 text-center py-2">
          <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center">
            <Shield size={24} className="text-amber-400" />
          </div>
          <div>
            <p className="text-white text-sm font-medium mb-2">
              Se agregarán las 21 plantillas Heroes
            </p>
            <p className="text-gray-400 text-xs leading-relaxed">
              WODs en honor a caídos: <span className="text-white font-medium">Murph, DT, Tommy V, Badger</span> y 17 más.
              Cada WOD incluye calentamiento. Los ejercicios se crean automáticamente si no existen.
            </p>
            <p className="text-amber-400 text-xs mt-3">
              Requiere haber ejecutado "Inicializar Datos" previamente.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}
