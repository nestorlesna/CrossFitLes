import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, Timer, Volume2, Play } from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '../../components/layout/Header';
import { TimerConfig, DEFAULT_TIMER_CONFIG } from '../../models/TimerConfig';
import { get as getTimerConfig, update as updateTimerConfig } from '../../db/repositories/timerConfigRepo';
import { configureAudio, playCountdownPip, playWarningPip, unlockAudio } from '../../services/timerAudio';

interface NumberFieldProps {
  label: string;
  hint: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

function NumberField({ label, hint, value, onChange, min = 0, max = 900 }: NumberFieldProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-gray-800 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{hint}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <input
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value}
          onChange={(e) => {
            const parsed = parseInt(e.target.value, 10);
            onChange(Number.isNaN(parsed) ? min : Math.min(max, Math.max(min, parsed)));
          }}
          className="w-20 bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white text-center focus:outline-none focus:border-primary-500"
        />
        <span className="text-xs text-gray-600 font-bold w-6">seg</span>
      </div>
    </div>
  );
}

function ToggleField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-gray-800 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{hint}</p>
      </div>
      <button
        onClick={() => onChange(value ? 0 : 1)}
        role="switch"
        aria-checked={Boolean(value)}
        className={`w-12 h-7 rounded-full p-1 shrink-0 transition-colors ${
          value ? 'bg-primary-600' : 'bg-gray-700'
        }`}
      >
        <span
          className={`block w-5 h-5 rounded-full bg-white transition-transform ${
            value ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

export function TimerSettingsPage() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<TimerConfig>(DEFAULT_TIMER_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getTimerConfig()
      .then(setConfig)
      .catch(() => toast.error('Error al cargar la configuración'))
      .finally(() => setLoading(false));
  }, []);

  const set = <K extends keyof TimerConfig>(key: K, value: TimerConfig[K]) => {
    setConfig((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateTimerConfig(config);
      configureAudio({
        sound: Boolean(config.sound_enabled),
        vibration: Boolean(config.vibration_enabled),
      });
      toast.success('Configuración guardada');
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleTestSound = async () => {
    await unlockAudio();
    configureAudio({ sound: true, vibration: Boolean(config.vibration_enabled) });
    playWarningPip();
    setTimeout(playCountdownPip, 700);
    setTimeout(playCountdownPip, 1000);
    setTimeout(playCountdownPip, 1300);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-500" />
      </div>
    );
  }

  return (
    <>
      <Header
        title="Cronómetro"
        leftAction={
          <button aria-label="Volver"
            onClick={() => navigate(-1)}
            className="text-gray-400 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ChevronLeft size={24} />
          </button>
        }
        rightAction={
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-primary-500 min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-50"
            aria-label="Guardar"
          >
            <Save size={20} />
          </button>
        }
      />

      <div className="flex flex-col gap-6 p-4 pb-28">
        <p className="text-xs text-gray-500 leading-relaxed">
          Estos son los valores por defecto de la clase guiada. Cada sección y cada ejercicio pueden
          sobrescribirlos desde el formulario de la clase.
        </p>

        {/* ── Tiempos ── */}
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Timer size={16} className="text-primary-500" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Tiempos</h2>
          </div>

          <NumberField
            label="Duración por defecto"
            hint="Ejercicios por repeticiones que no tienen segundos propios"
            value={config.default_exercise_seconds}
            onChange={(v) => set('default_exercise_seconds', v)}
            min={5}
          />
          <NumberField
            label="Descanso entre ejercicios"
            hint="Pausa al terminar un ejercicio antes del siguiente"
            value={config.rest_between_exercises_seconds}
            onChange={(v) => set('rest_between_exercises_seconds', v)}
          />
          <NumberField
            label="Descanso entre vueltas"
            hint="Pausa al completar una vuelta del circuito"
            value={config.rest_between_rounds_seconds}
            onChange={(v) => set('rest_between_rounds_seconds', v)}
          />
          <NumberField
            label="Descanso entre secciones"
            hint="Pausa al terminar una sección (entrada en calor, WOD, etc.)"
            value={config.rest_between_sections_seconds}
            onChange={(v) => set('rest_between_sections_seconds', v)}
          />
          <NumberField
            label="Ventana EMOM"
            hint="Duración de cada ventana en formatos de intervalo"
            value={config.default_interval_seconds}
            onChange={(v) => set('default_interval_seconds', v)}
            min={10}
          />
          <NumberField
            label="Cuenta regresiva inicial"
            hint="Segundos de preparación antes del primer ejercicio"
            value={config.lead_in_seconds}
            onChange={(v) => set('lead_in_seconds', v)}
            max={60}
          />
        </section>

        {/* ── Sonido ── */}
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Volume2 size={16} className="text-primary-500" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Avisos</h2>
            </div>
            <button
              onClick={handleTestSound}
              className="flex items-center gap-1.5 text-xs font-bold text-gray-400 bg-gray-800 border border-gray-700 rounded-full px-3 py-1.5 active:scale-95 transition-transform"
            >
              <Play size={12} fill="currentColor" />
              Probar
            </button>
          </div>

          <NumberField
            label="Aviso previo"
            hint="Pip distinto cuando faltan estos segundos para terminar el ejercicio"
            value={config.warning_seconds}
            onChange={(v) => set('warning_seconds', v)}
            max={60}
          />
          <ToggleField
            label="Sonido"
            hint="Pips de cuenta regresiva, cambios de ejercicio, inicio y fin de clase"
            value={config.sound_enabled}
            onChange={(v) => set('sound_enabled', v)}
          />
          <ToggleField
            label="Vibración"
            hint="Acompaña cada aviso con una vibración"
            value={config.vibration_enabled}
            onChange={(v) => set('vibration_enabled', v)}
          />
        </section>

        {/* ── Comportamiento ── */}
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Comportamiento</h2>

          <ToggleField
            label="Avanzar solo en ejercicios por reps"
            hint="Si lo apagás, el cronómetro cuenta hacia arriba y espera a que toques 'siguiente'"
            value={config.auto_advance_reps}
            onChange={(v) => set('auto_advance_reps', v)}
          />
          <ToggleField
            label="Mantener la pantalla encendida"
            hint="Evita que el celular se bloquee durante la clase"
            value={config.keep_awake}
            onChange={(v) => set('keep_awake', v)}
          />
        </section>
      </div>
    </>
  );
}
