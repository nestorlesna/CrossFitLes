// Formulario de creación y edición de plantillas de clase con secciones y ejercicios
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  Plus,
  ChevronDown,
  ChevronUp,
  Trash2,
  ArrowUp,
  ArrowDown,
  X,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '../../components/layout/Header';
import { Modal } from '../../components/ui/Modal';
import { generateUUID } from '../../utils/formatters';
import * as classTemplateRepo from '../../db/repositories/classTemplateRepo';
import * as catalogRepo from '../../db/repositories/catalogRepo';
import * as exerciseRepo from '../../db/repositories/exerciseRepo';
import { SectionType, WorkFormat, MeasurementUnit } from '../../models/catalogs';
import { Exercise } from '../../models/Exercise';
import { getImageDisplayUrl } from '../../services/mediaService';
import { Dumbbell } from 'lucide-react';

// Componente para mostrar miniatura del ejercicio
function ExerciseThumbnail({ 
  imagePath, 
  imageUrl, 
  name,
  size = 40
}: { 
  imagePath?: string | null; 
  imageUrl?: string | null;
  name: string;
  size?: number;
}) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (imageUrl) {
      setResolvedUrl(imageUrl);
    } else if (imagePath) {
      getImageDisplayUrl(imagePath).then(setResolvedUrl);
    } else {
      setResolvedUrl(null);
    }
  }, [imagePath, imageUrl]);

  return (
    <div 
      className="rounded-lg bg-gray-800 flex items-center justify-center shrink-0 overflow-hidden border border-gray-700"
      style={{ width: size, height: size }}
    >
      {resolvedUrl ? (
        <img src={resolvedUrl} alt={name} className="w-full h-full object-contain" />
      ) : (
        <Dumbbell size={size * 0.4} className="text-gray-600" />
      )}
    </div>
  );
}

// Draft de un ejercicio dentro de una sección (estado local del formulario)
interface SectionExerciseDraft {
  tempId: string
  exercise_id: string
  exercise_name: string
  coach_notes?: string
  planned_repetitions?: number
  planned_weight_value?: number
  planned_weight_unit_id?: string
  planned_time_seconds?: number
  planned_distance_value?: number
  planned_distance_unit_id?: string
  planned_calories?: number
  planned_rest_seconds?: number
  planned_rounds?: number
  rm_percentage?: number
  suggested_scaling?: string
  notes?: string
  isExpanded?: boolean
}

// Draft de una sección (estado local del formulario)
interface SectionDraft {
  tempId: string
  section_type_id: string
  work_format_id?: string
  visible_title?: string
  general_description?: string
  time_cap_seconds?: number
  total_rounds?: number
  rest_between_rounds_seconds?: number
  notes?: string
  isExpanded: boolean
  exercises: SectionExerciseDraft[]
}

export function ClassTemplateFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  // Datos del formulario general
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [objective, setObjective] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');

  // Secciones
  const [sections, setSections] = useState<SectionDraft[]>([]);

  // Catálogos
  const [sectionTypes, setSectionTypes] = useState<SectionType[]>([]);
  const [workFormats, setWorkFormats] = useState<WorkFormat[]>([]);
  const [weightUnits, setWeightUnits] = useState<MeasurementUnit[]>([]);
  const [distanceUnits, setDistanceUnits] = useState<MeasurementUnit[]>([]);

  // Modal selector de ejercicios
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [exerciseModalSectionTempId, setExerciseModalSectionTempId] = useState<string | null>(null);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);

  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Carga los catálogos necesarios
  const loadCatalogs = useCallback(async () => {
    const [st, wf, units] = await Promise.all([
      catalogRepo.getAll('section_type'),
      catalogRepo.getAll('work_format'),
      catalogRepo.getAll('measurement_unit'),
    ]);
    setSectionTypes(st as unknown as SectionType[]);
    setWorkFormats(wf as unknown as WorkFormat[]);
    const muUnits = units as unknown as MeasurementUnit[];
    setWeightUnits(muUnits.filter((u) => u.unit_type === 'weight'));
    setDistanceUnits(muUnits.filter((u) => u.unit_type === 'distance'));
  }, []);

  // Si es edición, carga los datos existentes
  const loadTemplate = useCallback(async () => {
    if (!id) return;
    const template = await classTemplateRepo.getById(id);
    if (!template) {
      toast.error('Plantilla no encontrada');
      navigate('/clases');
      return;
    }

    setName(template.name);
    setDate(template.date ?? '');
    setObjective(template.objective ?? '');
    setGeneralNotes(template.general_notes ?? '');
    setEstimatedDuration(template.estimated_duration_minutes?.toString() ?? '');

    // Convertir las secciones al formato de draft
    const draftSections: SectionDraft[] = template.sections.map((s) => ({
      tempId: generateUUID(),
      section_type_id: s.section_type_id,
      work_format_id: s.work_format_id,
      visible_title: s.visible_title,
      general_description: s.general_description,
      time_cap_seconds: s.time_cap_seconds,
      total_rounds: s.total_rounds,
      rest_between_rounds_seconds: s.rest_between_rounds_seconds,
      notes: s.notes,
      isExpanded: false,
      exercises: s.exercises.map((e) => ({
        tempId: generateUUID(),
        exercise_id: e.exercise_id,
        exercise_name: e.exercise_name ?? '',
        coach_notes: e.coach_notes,
        planned_repetitions: e.planned_repetitions,
        planned_weight_value: e.planned_weight_value,
        planned_weight_unit_id: e.planned_weight_unit_id,
        planned_time_seconds: e.planned_time_seconds,
        planned_distance_value: e.planned_distance_value,
        planned_distance_unit_id: e.planned_distance_unit_id,
        planned_calories: e.planned_calories,
        planned_rest_seconds: e.planned_rest_seconds,
        planned_rounds: e.planned_rounds,
        rm_percentage: e.rm_percentage,
        suggested_scaling: e.suggested_scaling,
        notes: e.notes,
        isExpanded: false,
      })),
    }));
    setSections(draftSections);
  }, [id, navigate]);

  useEffect(() => {
    const init = async () => {
      setLoadingData(true);
      try {
        await loadCatalogs();
        if (isEditing) await loadTemplate();
      } catch (err) {
        toast.error('Error al cargar datos');
        console.error(err);
      } finally {
        setLoadingData(false);
      }
    };
    init();
  }, [loadCatalogs, loadTemplate, isEditing]);

  // Abre el modal de selección de ejercicio para una sección
  const openExerciseModal = async (sectionTempId: string) => {
    setExerciseModalSectionTempId(sectionTempId);
    setExerciseSearch('');
    if (allExercises.length === 0) {
      const exercises = await exerciseRepo.getAll();
      // Ordenar: primero los que tienen usage_count > 0, luego por nombre
      // @ts-ignore (usage_count viene de la DB aunque no esté en el modelo base)
      const sorted = [...exercises].sort((a: any, b: any) => {
        const usageA = a.usage_count || 0;
        const usageB = b.usage_count || 0;
        if (usageB !== usageA) return usageB - usageA;
        return a.name.localeCompare(b.name);
      });
      setAllExercises(sorted);
      setFilteredExercises(sorted);
    } else {
      setFilteredExercises(allExercises);
    }
    setShowExerciseModal(true);
  };

  // Filtra los ejercicios del modal en tiempo real
  useEffect(() => {
    if (!exerciseSearch) {
      setFilteredExercises(allExercises);
    } else {
      const q = exerciseSearch.toLowerCase();
      setFilteredExercises(allExercises.filter((e) => e.name.toLowerCase().includes(q)));
    }
  }, [exerciseSearch, allExercises]);

  // Agrega un ejercicio a la sección seleccionada
  const handleSelectExercise = (exercise: Exercise) => {
    if (!exerciseModalSectionTempId) return;
    const newExercise: SectionExerciseDraft = {
      tempId: generateUUID(),
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      isExpanded: true,
    };
    setSections((prev) =>
      prev.map((s) =>
        s.tempId === exerciseModalSectionTempId
          ? { ...s, exercises: [...s.exercises, newExercise] }
          : s
      )
    );
    setShowExerciseModal(false);
    setExerciseModalSectionTempId(null);
  };

  // Agrega una nueva sección vacía
  const addSection = () => {
    const newSection: SectionDraft = {
      tempId: generateUUID(),
      section_type_id: sectionTypes[0]?.id ?? '',
      isExpanded: true,
      exercises: [],
    };
    setSections((prev) => [...prev, newSection]);
  };

  // Elimina una sección
  const removeSection = (tempId: string) => {
    setSections((prev) => prev.filter((s) => s.tempId !== tempId));
  };

  // Mueve una sección hacia arriba
  const moveSectionUp = (index: number) => {
    if (index === 0) return;
    setSections((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  // Mueve una sección hacia abajo
  const moveSectionDown = (index: number) => {
    setSections((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  // Actualiza un campo de una sección
  const updateSection = (tempId: string, field: Partial<SectionDraft>) => {
    setSections((prev) =>
      prev.map((s) => (s.tempId === tempId ? { ...s, ...field } : s))
    );
  };

  // Elimina un ejercicio de una sección
  const removeExercise = (sectionTempId: string, exerciseTempId: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.tempId === sectionTempId
          ? { ...s, exercises: s.exercises.filter((e) => e.tempId !== exerciseTempId) }
          : s
      )
    );
  };

  // Mueve un ejercicio hacia arriba dentro de su sección
  const moveExerciseUp = (sectionTempId: string, index: number) => {
    if (index === 0) return;
    setSections((prev) =>
      prev.map((s) => {
        if (s.tempId !== sectionTempId) return s;
        const next = [...s.exercises];
        [next[index - 1], next[index]] = [next[index], next[index - 1]];
        return { ...s, exercises: next };
      })
    );
  };

  // Mueve un ejercicio hacia abajo dentro de su sección
  const moveExerciseDown = (sectionTempId: string, index: number) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.tempId !== sectionTempId) return s;
        if (index >= s.exercises.length - 1) return s;
        const next = [...s.exercises];
        [next[index], next[index + 1]] = [next[index + 1], next[index]];
        return { ...s, exercises: next };
      })
    );
  };

  // Actualiza un campo de un ejercicio dentro de una sección
  const updateExercise = (
    sectionTempId: string,
    exerciseTempId: string,
    field: Partial<SectionExerciseDraft>
  ) => {
    setSections((prev) =>
      prev.map((s) =>
        s.tempId === sectionTempId
          ? {
              ...s,
              exercises: s.exercises.map((e) =>
                e.tempId === exerciseTempId ? { ...e, ...field } : e
              ),
            }
          : s
      )
    );
  };

  // Guarda la plantilla (crear o actualizar)
  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    setSaving(true);
    try {
      // Construir las secciones para el repositorio
      const sectionsForRepo = sections.map((s, sIdx) => ({
        class_template_id: id ?? '',
        section_type_id: s.section_type_id,
        work_format_id: s.work_format_id,
        sort_order: sIdx + 1,
        visible_title: s.visible_title,
        general_description: s.general_description,
        time_cap_seconds: s.time_cap_seconds,
        total_rounds: s.total_rounds,
        rest_between_rounds_seconds: s.rest_between_rounds_seconds,
        notes: s.notes,
        exercises: s.exercises.map((e, eIdx) => ({
          class_section_id: '',
          exercise_id: e.exercise_id,
          sort_order: eIdx + 1,
          coach_notes: e.coach_notes,
          planned_repetitions: e.planned_repetitions,
          planned_weight_value: e.planned_weight_value,
          planned_weight_unit_id: e.planned_weight_unit_id,
          planned_time_seconds: e.planned_time_seconds,
          planned_distance_value: e.planned_distance_value,
          planned_distance_unit_id: e.planned_distance_unit_id,
          planned_calories: e.planned_calories,
          planned_rest_seconds: e.planned_rest_seconds,
          planned_rounds: e.planned_rounds,
          rm_percentage: e.rm_percentage,
          suggested_scaling: e.suggested_scaling,
          notes: e.notes,
        })),
      }));

      const templateData = {
        name: name.trim(),
        date: date || undefined,
        objective: objective.trim() || undefined,
        general_notes: generalNotes.trim() || undefined,
        estimated_duration_minutes: estimatedDuration
          ? parseInt(estimatedDuration, 10)
          : undefined,
        is_favorite: 0 as const,
        is_active: 1 as const,
      };

      if (isEditing && id) {
        await classTemplateRepo.update(id, templateData, sectionsForRepo);
        toast.success('Clase actualizada');
        navigate(`/clases/${id}`);
      } else {
        const newId = await classTemplateRepo.create(templateData, sectionsForRepo);
        toast.success('Clase creada');
        navigate(`/clases/${newId}`);
      }
    } catch (err) {
      toast.error('Error al guardar la clase');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Devuelve el objeto WorkFormat del formato seleccionado
  const getWorkFormat = (workFormatId?: string): WorkFormat | undefined => {
    if (!workFormatId) return undefined;
    return workFormats.find((wf) => wf.id === workFormatId);
  };

  // Devuelve el color del tipo de sección
  const getSectionTypeColor = (sectionTypeId: string): string => {
    const st = sectionTypes.find((s) => s.id === sectionTypeId);
    return st?.color ?? '#6b7280';
  };

  // Devuelve el nombre del tipo de sección
  const getSectionTypeName = (sectionTypeId: string): string => {
    const st = sectionTypes.find((s) => s.id === sectionTypeId);
    return st?.name ?? 'Sección';
  };

  if (loadingData) {
    return (
      <>
        <Header title={isEditing ? 'Editar clase' : 'Nueva clase'} />
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Cargando...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title={isEditing ? 'Editar clase' : 'Nueva clase'}
        leftAction={
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-white p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Volver"
          >
            <ChevronLeft size={24} />
          </button>
        }
        rightAction={
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-primary-500 hover:text-primary-400 font-semibold text-sm min-h-[44px] px-2 flex items-center disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        }
      />

      <div className="px-4 py-4 space-y-6 pb-24">
        {/* Sección 1: Datos generales */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Datos generales
          </h2>

          {/* Nombre */}
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">
              Nombre <span className="text-primary-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: WOD Fuerza — Lunes"
              className="w-full bg-gray-800 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Fecha</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>

          {/* Objetivo */}
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Objetivo</label>
            <input
              type="text"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Ej: Fuerza + potencia"
              className="w-full bg-gray-800 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Observaciones</label>
            <textarea
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="Notas generales de la clase..."
              rows={2}
              className="w-full bg-gray-800 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:border-primary-500 transition-colors resize-none"
            />
          </div>

          {/* Duración estimada */}
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Duración estimada (min)</label>
            <input
              type="number"
              value={estimatedDuration}
              onChange={(e) => setEstimatedDuration(e.target.value)}
              placeholder="60"
              min="1"
              className="w-full bg-gray-800 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>
        </div>

        {/* Sección 2: Secciones de la clase */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider px-1">
            Secciones de la clase
          </h2>

          {sections.length === 0 && (
            <div className="text-center py-8 text-gray-600 text-sm">
              No hay secciones. Agregá una para comenzar.
            </div>
          )}

          {sections.map((section, sectionIndex) => {
            const wf = getWorkFormat(section.work_format_id);
            const sectionColor = getSectionTypeColor(section.section_type_id);

            return (
              <div
                key={section.tempId}
                className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
              >
                {/* Header de la sección */}
                <div className="flex items-center gap-2 px-4 py-3">
                  {/* Indicador de color del tipo */}
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: sectionColor }}
                  />

                  {/* Tipo + título editable */}
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-gray-500 block leading-tight">
                      {getSectionTypeName(section.section_type_id)}
                    </span>
                    <input
                      type="text"
                      value={section.visible_title ?? ''}
                      onChange={(e) =>
                        updateSection(section.tempId, { visible_title: e.target.value || undefined })
                      }
                      placeholder="Título visible (opcional)"
                      className="bg-transparent text-white text-sm font-medium placeholder-gray-600 focus:outline-none w-full"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {/* Controles del bloque */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => moveSectionUp(sectionIndex)}
                      disabled={sectionIndex === 0}
                      className="p-1.5 text-gray-500 hover:text-gray-300 disabled:opacity-30 min-h-[36px] min-w-[36px] flex items-center justify-center"
                      aria-label="Subir sección"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      onClick={() => moveSectionDown(sectionIndex)}
                      disabled={sectionIndex === sections.length - 1}
                      className="p-1.5 text-gray-500 hover:text-gray-300 disabled:opacity-30 min-h-[36px] min-w-[36px] flex items-center justify-center"
                      aria-label="Bajar sección"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      onClick={() => removeSection(section.tempId)}
                      className="p-1.5 text-red-500 hover:text-red-400 min-h-[36px] min-w-[36px] flex items-center justify-center"
                      aria-label="Eliminar sección"
                    >
                      <Trash2 size={14} />
                    </button>
                    <button
                      onClick={() => updateSection(section.tempId, { isExpanded: !section.isExpanded })}
                      className="p-1.5 text-gray-400 hover:text-white min-h-[36px] min-w-[36px] flex items-center justify-center"
                      aria-label={section.isExpanded ? 'Colapsar' : 'Expandir'}
                    >
                      {section.isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Contenido expandido de la sección */}
                {section.isExpanded && (
                  <div className="border-t border-gray-800 px-4 py-4 space-y-4">
                    {/* Tipo de sección */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">Tipo de sección</label>
                      <select
                        value={section.section_type_id}
                        onChange={(e) => updateSection(section.tempId, { section_type_id: e.target.value })}
                        className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:border-primary-500"
                      >
                        {sectionTypes.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Formato de trabajo */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">Formato de trabajo</label>
                      <select
                        value={section.work_format_id ?? ''}
                        onChange={(e) =>
                          updateSection(section.tempId, {
                            work_format_id: e.target.value || undefined,
                          })
                        }
                        className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:border-primary-500"
                      >
                        <option value="">— Sin formato —</option>
                        {workFormats.map((wf) => (
                          <option key={wf.id} value={wf.id}>
                            {wf.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Descripción general */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">Descripción general</label>
                      <textarea
                        value={section.general_description ?? ''}
                        onChange={(e) =>
                          updateSection(section.tempId, {
                            general_description: e.target.value || undefined,
                          })
                        }
                        placeholder="Descripción de la sección..."
                        rows={2}
                        className="w-full bg-gray-800 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:border-primary-500 resize-none"
                      />
                    </div>

                    {/* Time Cap (solo si el formato tiene has_time_cap) */}
                    {wf?.has_time_cap === 1 && (
                      <div>
                        <label className="block text-xs text-gray-400 mb-1.5">
                          Time cap (segundos)
                        </label>
                        <input
                          type="number"
                          value={section.time_cap_seconds ?? ''}
                          onChange={(e) =>
                            updateSection(section.tempId, {
                              time_cap_seconds: e.target.value
                                ? parseInt(e.target.value, 10)
                                : undefined,
                            })
                          }
                          placeholder="Ej: 1200 (20 min)"
                          min="0"
                          className="w-full bg-gray-800 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:border-primary-500"
                        />
                      </div>
                    )}

                    {/* Rondas (solo si el formato tiene has_rounds) */}
                    {wf?.has_rounds === 1 && (
                      <div>
                        <label className="block text-xs text-gray-400 mb-1.5">Rondas</label>
                        <input
                          type="number"
                          value={section.total_rounds ?? ''}
                          onChange={(e) =>
                            updateSection(section.tempId, {
                              total_rounds: e.target.value
                                ? parseInt(e.target.value, 10)
                                : undefined,
                            })
                          }
                          placeholder="Ej: 5"
                          min="1"
                          className="w-full bg-gray-800 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:border-primary-500"
                        />
                      </div>
                    )}

                    {/* Descanso entre rondas */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">
                        Descanso entre rondas (seg)
                      </label>
                      <input
                        type="number"
                        value={section.rest_between_rounds_seconds ?? ''}
                        onChange={(e) =>
                          updateSection(section.tempId, {
                            rest_between_rounds_seconds: e.target.value
                              ? parseInt(e.target.value, 10)
                              : undefined,
                          })
                        }
                        placeholder="Ej: 60"
                        min="0"
                        className="w-full bg-gray-800 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:border-primary-500"
                      />
                    </div>

                    {/* Notas de la sección */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">Notas</label>
                      <textarea
                        value={section.notes ?? ''}
                        onChange={(e) =>
                          updateSection(section.tempId, {
                            notes: e.target.value || undefined,
                          })
                        }
                        placeholder="Notas de la sección..."
                        rows={1}
                        className="w-full bg-gray-800 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:border-primary-500 resize-none"
                      />
                    </div>

                    {/* Lista de ejercicios */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Ejercicios ({section.exercises.length})
                        </span>
                      </div>

                      {section.exercises.map((exercise, exerciseIndex) => (
                        <div
                          key={exercise.tempId}
                          className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700"
                        >
                          {/* Header del ejercicio */}
                          <div className="flex items-center gap-2 px-3 py-2.5">
                            <span className="flex-1 text-sm font-medium text-white truncate">
                              {exercise.exercise_name}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() =>
                                  moveExerciseUp(section.tempId, exerciseIndex)
                                }
                                disabled={exerciseIndex === 0}
                                className="p-1 text-gray-500 hover:text-gray-300 disabled:opacity-30 min-h-[36px] min-w-[36px] flex items-center justify-center"
                                aria-label="Subir ejercicio"
                              >
                                <ArrowUp size={13} />
                              </button>
                              <button
                                onClick={() =>
                                  moveExerciseDown(section.tempId, exerciseIndex)
                                }
                                disabled={exerciseIndex === section.exercises.length - 1}
                                className="p-1 text-gray-500 hover:text-gray-300 disabled:opacity-30 min-h-[36px] min-w-[36px] flex items-center justify-center"
                                aria-label="Bajar ejercicio"
                              >
                                <ArrowDown size={13} />
                              </button>
                              <button
                                onClick={() =>
                                  removeExercise(section.tempId, exercise.tempId)
                                }
                                className="p-1 text-red-500 hover:text-red-400 min-h-[36px] min-w-[36px] flex items-center justify-center"
                                aria-label="Eliminar ejercicio"
                              >
                                <X size={13} />
                              </button>
                              <button
                                onClick={() =>
                                  updateExercise(section.tempId, exercise.tempId, {
                                    isExpanded: !exercise.isExpanded,
                                  })
                                }
                                className="p-1 text-gray-400 hover:text-white min-h-[36px] min-w-[36px] flex items-center justify-center"
                                aria-label={exercise.isExpanded ? 'Colapsar' : 'Expandir'}
                              >
                                {exercise.isExpanded ? (
                                  <ChevronUp size={14} />
                                ) : (
                                  <ChevronDown size={14} />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Campos de planificación del ejercicio */}
                          {exercise.isExpanded && (
                            <div className="border-t border-gray-700 px-3 py-3 grid grid-cols-2 gap-3">
                              {/* Repeticiones */}
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Reps</label>
                                <input
                                  type="number"
                                  value={exercise.planned_repetitions ?? ''}
                                  onChange={(e) =>
                                    updateExercise(section.tempId, exercise.tempId, {
                                      planned_repetitions: e.target.value
                                        ? parseInt(e.target.value, 10)
                                        : undefined,
                                    })
                                  }
                                  placeholder="—"
                                  min="0"
                                  className="w-full bg-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:border-primary-500"
                                />
                              </div>

                              {/* Rondas del ejercicio */}
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Rondas</label>
                                <input
                                  type="number"
                                  value={exercise.planned_rounds ?? ''}
                                  onChange={(e) =>
                                    updateExercise(section.tempId, exercise.tempId, {
                                      planned_rounds: e.target.value
                                        ? parseInt(e.target.value, 10)
                                        : undefined,
                                    })
                                  }
                                  placeholder="—"
                                  min="0"
                                  className="w-full bg-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:border-primary-500"
                                />
                              </div>

                              {/* Peso */}
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Peso</label>
                                <input
                                  type="number"
                                  value={exercise.planned_weight_value ?? ''}
                                  onChange={(e) =>
                                    updateExercise(section.tempId, exercise.tempId, {
                                      planned_weight_value: e.target.value
                                        ? parseFloat(e.target.value)
                                        : undefined,
                                    })
                                  }
                                  placeholder="—"
                                  min="0"
                                  step="0.5"
                                  className="w-full bg-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:border-primary-500"
                                />
                              </div>

                              {/* Unidad de peso */}
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">
                                  Unidad peso
                                </label>
                                <select
                                  value={exercise.planned_weight_unit_id ?? ''}
                                  onChange={(e) =>
                                    updateExercise(section.tempId, exercise.tempId, {
                                      planned_weight_unit_id: e.target.value || undefined,
                                    })
                                  }
                                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:border-primary-500"
                                >
                                  <option value="">—</option>
                                  {weightUnits.map((u) => (
                                    <option key={u.id} value={u.id}>
                                      {u.abbreviation}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Tiempo */}
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">
                                  Tiempo (seg)
                                </label>
                                <input
                                  type="number"
                                  value={exercise.planned_time_seconds ?? ''}
                                  onChange={(e) =>
                                    updateExercise(section.tempId, exercise.tempId, {
                                      planned_time_seconds: e.target.value
                                        ? parseInt(e.target.value, 10)
                                        : undefined,
                                    })
                                  }
                                  placeholder="—"
                                  min="0"
                                  className="w-full bg-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:border-primary-500"
                                />
                              </div>

                              {/* Distancia */}
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">
                                  Distancia
                                </label>
                                <input
                                  type="number"
                                  value={exercise.planned_distance_value ?? ''}
                                  onChange={(e) =>
                                    updateExercise(section.tempId, exercise.tempId, {
                                      planned_distance_value: e.target.value
                                        ? parseFloat(e.target.value)
                                        : undefined,
                                    })
                                  }
                                  placeholder="—"
                                  min="0"
                                  className="w-full bg-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:border-primary-500"
                                />
                              </div>

                              {/* Unidad de distancia */}
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">
                                  Unidad dist.
                                </label>
                                <select
                                  value={exercise.planned_distance_unit_id ?? ''}
                                  onChange={(e) =>
                                    updateExercise(section.tempId, exercise.tempId, {
                                      planned_distance_unit_id: e.target.value || undefined,
                                    })
                                  }
                                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:border-primary-500"
                                >
                                  <option value="">—</option>
                                  {distanceUnits.map((u) => (
                                    <option key={u.id} value={u.id}>
                                      {u.abbreviation}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Calorías */}
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Cal</label>
                                <input
                                  type="number"
                                  value={exercise.planned_calories ?? ''}
                                  onChange={(e) =>
                                    updateExercise(section.tempId, exercise.tempId, {
                                      planned_calories: e.target.value
                                        ? parseInt(e.target.value, 10)
                                        : undefined,
                                    })
                                  }
                                  placeholder="—"
                                  min="0"
                                  className="w-full bg-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:border-primary-500"
                                />
                              </div>

                              {/* Descanso */}
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">
                                  Descanso (seg)
                                </label>
                                <input
                                  type="number"
                                  value={exercise.planned_rest_seconds ?? ''}
                                  onChange={(e) =>
                                    updateExercise(section.tempId, exercise.tempId, {
                                      planned_rest_seconds: e.target.value
                                        ? parseInt(e.target.value, 10)
                                        : undefined,
                                    })
                                  }
                                  placeholder="—"
                                  min="0"
                                  className="w-full bg-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:border-primary-500"
                                />
                              </div>

                              {/* % RM */}
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">% RM</label>
                                <input
                                  type="number"
                                  value={exercise.rm_percentage ?? ''}
                                  onChange={(e) =>
                                    updateExercise(section.tempId, exercise.tempId, {
                                      rm_percentage: e.target.value
                                        ? parseFloat(e.target.value)
                                        : undefined,
                                    })
                                  }
                                  placeholder="—"
                                  min="0"
                                  max="100"
                                  className="w-full bg-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:border-primary-500"
                                />
                              </div>

                              {/* Escalado sugerido */}
                              <div className="col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">
                                  Escalado sugerido
                                </label>
                                <input
                                  type="text"
                                  value={exercise.suggested_scaling ?? ''}
                                  onChange={(e) =>
                                    updateExercise(section.tempId, exercise.tempId, {
                                      suggested_scaling: e.target.value || undefined,
                                    })
                                  }
                                  placeholder="Ej: Ring row en lugar de muscle-up"
                                  className="w-full bg-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:border-primary-500"
                                />
                              </div>

                              {/* Notas del coach */}
                              <div className="col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">
                                  Notas del coach
                                </label>
                                <input
                                  type="text"
                                  value={exercise.coach_notes ?? ''}
                                  onChange={(e) =>
                                    updateExercise(section.tempId, exercise.tempId, {
                                      coach_notes: e.target.value || undefined,
                                    })
                                  }
                                  placeholder="Indicaciones técnicas..."
                                  className="w-full bg-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:border-primary-500"
                                />
                              </div>

                              {/* Notas generales del ejercicio */}
                              <div className="col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">Notas</label>
                                <input
                                  type="text"
                                  value={exercise.notes ?? ''}
                                  onChange={(e) =>
                                    updateExercise(section.tempId, exercise.tempId, {
                                      notes: e.target.value || undefined,
                                    })
                                  }
                                  placeholder="Notas adicionales..."
                                  className="w-full bg-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:border-primary-500"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Botón agregar ejercicio */}
                      <button
                        onClick={() => openExerciseModal(section.tempId)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors text-sm min-h-[44px]"
                      >
                        <Plus size={16} />
                        Agregar ejercicio
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Botón agregar sección */}
          <button
            onClick={addSection}
            disabled={sectionTypes.length === 0}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-gray-700 text-gray-400 hover:text-white hover:border-primary-600 transition-colors text-sm font-medium min-h-[44px] disabled:opacity-50"
          >
            <Plus size={18} />
            Agregar sección
          </button>
        </div>
      </div>

      {/* Modal de selección de ejercicios */}
      <Modal
        isOpen={showExerciseModal}
        onClose={() => setShowExerciseModal(false)}
        title="Seleccionar ejercicio"
      >
        <div className="space-y-3">
          {/* Buscador */}
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              value={exerciseSearch}
              onChange={(e) => setExerciseSearch(e.target.value)}
              placeholder="Buscar ejercicio..."
              className="w-full bg-gray-800 text-white placeholder-gray-500 rounded-xl pl-9 pr-4 py-2.5 text-sm border border-gray-700 focus:outline-none focus:border-primary-500"
              autoFocus
            />
          </div>

          {/* Lista de ejercicios */}
          <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
            {filteredExercises.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                {exerciseSearch ? 'Sin resultados' : 'No hay ejercicios en la biblioteca'}
              </div>
            ) : (
              filteredExercises.map((exercise) => (
                <button
                  key={exercise.id}
                  onClick={() => handleSelectExercise(exercise)}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-gray-800 active:bg-gray-700 transition-colors min-h-[56px] flex items-center gap-3 border border-transparent hover:border-gray-700"
                >
                  <ExerciseThumbnail 
                    imagePath={exercise.image_path}
                    imageUrl={exercise.image_url}
                    name={exercise.name}
                    size={40}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-white font-medium block truncate">{exercise.name}</span>
                    {/* @ts-ignore */}
                    {exercise.usage_count > 0 && (
                      <span className="text-[10px] text-primary-500 font-bold uppercase tracking-tight">Frecuente</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
