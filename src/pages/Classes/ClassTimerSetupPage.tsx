// Edición acotada al cronómetro: muestra la clase completa (secciones, ejercicios,
// imágenes y datos planificados) en modo lectura, y sólo deja editar los tiempos
// que el cronómetro necesita para ejecutarla sola.

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Timer, Save, Loader2, Dumbbell, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '../../components/layout/Header';
import { ClassTemplateWithSections, ClassSection, SectionExercise } from '../../models/ClassTemplate';
import { TimerConfig } from '../../models/TimerConfig';
import * as classTemplateRepo from '../../db/repositories/classTemplateRepo';
import * as timerConfigRepo from '../../db/repositories/timerConfigRepo';
import {
  buildTimeline,
  timelineDuration,
  buildExerciseDetail,
  resolveInterval,
  resolveWorkSeconds,
  formatClock,
} from '../../services/timerEngine';
import { getImageDisplayUrl } from '../../services/mediaService';

// Ediciones en memoria, indexadas por id
type SectionEdits = Record<string, classTemplateRepo.TimerSectionPatch>;
type ExerciseEdits = Record<string, classTemplateRepo.TimerExercisePatch>;

// Convierte el valor de un input numérico a número o null (vacío = usar el default)
function toSeconds(value: string): number | null {
  if (value.trim() === '') return null;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

// Miniatura del ejercicio (resuelve blobs de SQLite y rutas del repo)
function ExerciseThumb({ exercise }: { exercise: SectionExercise }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const path = exercise.exercise_image_url || exercise.exercise_image_path;
    if (!path) {
      setUrl(null);
      return;
    }
    getImageDisplayUrl(path).then(setUrl).catch(() => setUrl(null));
  }, [exercise.exercise_image_url, exercise.exercise_image_path]);

  return (
    <div className="w-14 h-14 rounded-lg bg-gray-800 flex items-center justify-center shrink-0 overflow-hidden">
      {url ? (
        <img src={url} alt={exercise.exercise_name ?? ''} className="w-full h-full object-cover" />
      ) : (
        <Dumbbell size={20} className="text-gray-600" />
      )}
    </div>
  );
}

// Campo numérico de segundos con placeholder = valor heredado
function SecondsInput({
  label,
  value,
  placeholder,
  hint,
  onChange,
}: {
  label: string;
  value: number | null | undefined;
  placeholder: string;
  hint?: string;
  onChange: (value: number | null) => void;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input
        type="number"
        min="0"
        value={value ?? ''}
        onChange={(e) => onChange(toSeconds(e.target.value))}
        placeholder={placeholder}
        className="w-full bg-gray-800 text-white placeholder-gray-600 rounded-xl px-3 py-2.5 text-sm border border-gray-700 focus:outline-none focus:border-primary-500"
      />
      {hint && <p className="text-[11px] text-gray-600 mt-1">{hint}</p>}
    </div>
  );
}

export function ClassTimerSetupPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [template, setTemplate] = useState<ClassTemplateWithSections | null>(null);
  const [config, setConfig] = useState<TimerConfig | null>(null);
  const [sectionEdits, setSectionEdits] = useState<SectionEdits>({});
  const [exerciseEdits, setExerciseEdits] = useState<ExerciseEdits>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!id) return;
      try {
        const [data, timerConfig] = await Promise.all([
          classTemplateRepo.getById(id),
          timerConfigRepo.get(),
        ]);
        if (cancelled) return;
        if (!data) {
          toast.error('No se encontró la clase');
          navigate('/clases');
          return;
        }

        setTemplate(data);
        setConfig(timerConfig);

        const sections: SectionEdits = {};
        const exercises: ExerciseEdits = {};
        for (const section of data.sections) {
          sections[section.id] = {
            id: section.id,
            rest_between_exercises_seconds: section.rest_between_exercises_seconds ?? null,
            rest_between_rounds_seconds: section.rest_between_rounds_seconds ?? null,
            rest_after_section_seconds: section.rest_after_section_seconds ?? null,
            interval_seconds: section.interval_seconds ?? null,
          };
          for (const exercise of section.exercises) {
            exercises[exercise.id] = {
              id: exercise.id,
              planned_time_seconds: exercise.planned_time_seconds ?? null,
              suggested_timer_seconds: exercise.suggested_timer_seconds ?? null,
              planned_rest_seconds: exercise.planned_rest_seconds ?? null,
            };
          }
        }
        setSectionEdits(sections);
        setExerciseEdits(exercises);
      } catch (e) {
        console.error('[ClassTimerSetup] Error al cargar:', e);
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

  // Plantilla con las ediciones aplicadas: alimenta la vista previa de la línea de tiempo
  const editedTemplate = useMemo<ClassTemplateWithSections | null>(() => {
    if (!template) return null;
    return {
      ...template,
      sections: template.sections.map((section) => ({
        ...section,
        ...sectionEdits[section.id],
        exercises: section.exercises.map((exercise) => ({
          ...exercise,
          ...exerciseEdits[exercise.id],
        })),
      })) as ClassSection[],
    };
  }, [template, sectionEdits, exerciseEdits]);

  const totalSeconds = useMemo(() => {
    if (!editedTemplate || !config) return 0;
    return timelineDuration(buildTimeline(editedTemplate, config));
  }, [editedTemplate, config]);

  function patchSection(sectionId: string, changes: Partial<classTemplateRepo.TimerSectionPatch>) {
    setSectionEdits((prev) => ({
      ...prev,
      [sectionId]: { ...prev[sectionId], ...changes },
    }));
  }

  function patchExercise(exerciseId: string, changes: Partial<classTemplateRepo.TimerExercisePatch>) {
    setExerciseEdits((prev) => ({
      ...prev,
      [exerciseId]: { ...prev[exerciseId], ...changes },
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await classTemplateRepo.updateTimerSettings(
        Object.values(sectionEdits),
        Object.values(exerciseEdits)
      );
      toast.success('Tiempos guardados');
      navigate(`/clases/${id}`);
    } catch (e) {
      console.error('[ClassTimerSetup] Error al guardar:', e);
      toast.error('Error al guardar los tiempos');
    } finally {
      setSaving(false);
    }
  }

  if (loading || !editedTemplate || !config) {
    return (
      <>
        <Header title="Tiempos del cronómetro" />
        <div className="flex justify-center py-16">
          <Loader2 size={32} className="text-primary-500 animate-spin" />
        </div>
      </>
    );
  }

  const estimatedMinutes = editedTemplate.estimated_duration_minutes;

  return (
    <>
      <Header
        title="Tiempos del cronómetro"
        leftAction={
          <button
            onClick={() => navigate(`/clases/${id}`)}
            className="text-gray-400 hover:text-white p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Volver"
          >
            <ChevronLeft size={24} />
          </button>
        }
      />

      <div className="px-4 py-4 space-y-4 pb-28">
        {/* ── Resumen: qué va a durar la clase guiada ── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <p className="text-sm text-white font-medium">{editedTemplate.name}</p>
          <div className="flex items-center gap-2 mt-2">
            <Timer size={16} className="text-primary-400" />
            <span className="text-2xl font-bold text-white tabular-nums">{formatClock(totalSeconds)}</span>
            <span className="text-xs text-gray-500">de línea de tiempo</span>
          </div>
          {!!estimatedMinutes && (
            <p className="text-xs text-gray-600 mt-1">
              Duración estimada de la clase: {estimatedMinutes} min
            </p>
          )}
          <p className="text-[11px] text-gray-600 mt-2">
            Los campos vacíos usan el valor de Configuración → Cronómetro.
          </p>
        </div>

        {editedTemplate.sections.map((section, sectionIndex) => {
          const isLastSection = sectionIndex === editedTemplate.sections.length - 1;
          const interval = resolveInterval(section, config);
          const totalRounds = section.total_rounds ?? 1;
          const edits = sectionEdits[section.id];
          // Lo que heredaría un ejercicio sin descanso propio
          const sectionRestDefault =
            edits?.rest_between_exercises_seconds ?? config.rest_between_exercises_seconds;

          return (
            <div key={section.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              {/* Cabecera de sección */}
              <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: section.section_type_color ?? '#64748b' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">
                    {section.visible_title || section.section_type_name || `Sección ${sectionIndex + 1}`}
                  </p>
                  <p className="text-[11px] text-gray-500 truncate">
                    {[
                      section.work_format_name,
                      totalRounds > 1 ? `${totalRounds} vueltas` : null,
                      section.time_cap_seconds ? `cap ${formatClock(section.time_cap_seconds)}` : null,
                      interval ? `ventana ${interval}s` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
              </div>

              {/* Sección sin ejercicios: el cronómetro la saltea */}
              {section.exercises.length === 0 && (
                <div className="mx-4 my-3 flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
                  <AlertTriangle size={16} className="text-yellow-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-200/80">
                    Esta sección no tiene ejercicios, así que el cronómetro la va a saltear. Agregale al
                    menos un ejercicio desde la edición de la clase.
                  </p>
                </div>
              )}

              {/* Ejercicios: datos en lectura + su duración editable */}
              <div className="divide-y divide-gray-800">
                {section.exercises.map((exercise) => {
                  const detail = buildExerciseDetail(exercise);
                  const isTimeBased = exercise.planned_time_seconds != null;
                  const resolved = resolveWorkSeconds(exercise, config);
                  const capped = interval ? Math.min(resolved || interval, interval) : resolved;
                  const sets = exercise.planned_rounds ?? 1;

                  return (
                    <div key={exercise.id} className="p-4 flex gap-3">
                      <ExerciseThumb exercise={exercise} />

                      <div className="flex-1 min-w-0 space-y-2">
                        <div>
                          <p className="text-sm text-white font-medium truncate">
                            {exercise.exercise_name ?? 'Ejercicio'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {[detail, sets > 1 ? `${sets} series` : null].filter(Boolean).join(' · ') ||
                              'Sin datos planificados'}
                          </p>
                          {exercise.coach_notes && (
                            <p className="text-[11px] text-gray-600 truncate">{exercise.coach_notes}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {isTimeBased ? (
                            <SecondsInput
                              label="Tiempo planificado (seg)"
                              value={exerciseEdits[exercise.id]?.planned_time_seconds}
                              placeholder="Ej: 30"
                              hint={
                                interval && capped < resolved
                                  ? `Recortado a ${capped}s por la ventana de ${interval}s`
                                  : undefined
                              }
                              onChange={(value) =>
                                patchExercise(exercise.id, { planned_time_seconds: value })
                              }
                            />
                          ) : (
                            <SecondsInput
                              label="Duración estimada (seg)"
                              value={exerciseEdits[exercise.id]?.suggested_timer_seconds}
                              placeholder={`Por defecto: ${config.default_exercise_seconds}`}
                              hint={`El cronómetro le va a dar ${capped}s${
                                interval ? ` dentro de la ventana de ${interval}s` : ''
                              }`}
                              onChange={(value) =>
                                patchExercise(exercise.id, { suggested_timer_seconds: value })
                              }
                            />
                          )}

                          {/* En las secciones de intervalo el descanso lo define la ventana,
                              así que el motor ignora este campo y no se muestra. */}
                          {!interval && (
                            <SecondsInput
                              label="Descanso después (seg)"
                              value={exerciseEdits[exercise.id]?.planned_rest_seconds}
                              placeholder={`Sección: ${sectionRestDefault}`}
                              hint="Pisa el descanso de la sección para este ejercicio."
                              onChange={(value) =>
                                patchExercise(exercise.id, { planned_rest_seconds: value })
                              }
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tiempos de la sección */}
              <div className="border-t border-gray-800 bg-gray-950/40 p-4 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary-500">
                  Tiempos de la sección
                </p>

                {section.work_format_is_interval ? (
                  <SecondsInput
                    label="Ventana por ejercicio (seg)"
                    value={edits?.interval_seconds}
                    placeholder={`Por defecto: ${
                      section.work_format_default_interval_seconds ?? config.default_interval_seconds
                    }`}
                    hint="En los formatos de intervalo el sobrante de la ventana se convierte en descanso."
                    onChange={(value) => patchSection(section.id, { interval_seconds: value })}
                  />
                ) : (
                  <SecondsInput
                    label="Descanso entre ejercicios (seg)"
                    value={edits?.rest_between_exercises_seconds}
                    placeholder={`Por defecto: ${config.rest_between_exercises_seconds}`}
                    hint="0 = circuito continuo, sin pausa entre ejercicios."
                    onChange={(value) =>
                      patchSection(section.id, { rest_between_exercises_seconds: value })
                    }
                  />
                )}

                {totalRounds > 1 && (
                  <SecondsInput
                    label="Descanso entre vueltas (seg)"
                    value={edits?.rest_between_rounds_seconds}
                    placeholder={`Por defecto: ${config.rest_between_rounds_seconds}`}
                    onChange={(value) =>
                      patchSection(section.id, { rest_between_rounds_seconds: value })
                    }
                  />
                )}

                {!isLastSection && (
                  <SecondsInput
                    label="Descanso al terminar la sección (seg)"
                    value={edits?.rest_after_section_seconds}
                    placeholder={`Por defecto: ${config.rest_between_sections_seconds}`}
                    onChange={(value) =>
                      patchSection(section.id, { rest_after_section_seconds: value })
                    }
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Barra de guardado */}
      <div className="fixed bottom-16 left-0 right-0 bg-gray-950/95 backdrop-blur border-t border-gray-800 px-4 py-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-primary-600 hover:bg-primary-500 disabled:opacity-60 text-white font-bold rounded-xl py-3 flex items-center justify-center gap-2 transition-colors"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Guardar tiempos
        </button>
      </div>
    </>
  );
}
