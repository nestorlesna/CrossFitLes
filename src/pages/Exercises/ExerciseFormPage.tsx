// Formulario completo para crear o editar un ejercicio
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Camera, Star, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '../../components/layout/Header';
import { Badge } from '../../components/ui/Badge';
import { ExerciseRelations } from '../../models/Exercise';
import { create, update, getById } from '../../db/repositories/exerciseRepo';
import { getAll as getCatalog } from '../../db/repositories/catalogRepo';
import { pickImage, getImageDisplayUrl } from '../../services/mediaService';
import {
  DifficultyLevel,
  MuscleGroup,
  Equipment,
  MeasurementUnit,
  Tag,
  SectionType,
} from '../../models/catalogs';
import { MuscleMap } from '../../components/exercises/MuscleMap';
import { Video } from 'lucide-react';

// Helper para obtener el ID de YouTube
function getYoutubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Helper para obtener el ID de Vimeo
function getVimeoId(url: string): string | null {
  const regExp = /vimeo\.com\/(?:video\/|channels\/(?:\w+\/)?|groups\/(?:\w+\/)?|album\/(?:\w+\/)?|showcase\/(?:\w+\/)?|)(\d+)(?:$|\/|\?)/;
  const match = url.match(regExp);
  return (match && match[1]) ? match[1] : null;
}

// Componente para embeber video (versión reducida para formulario)
function VideoEmbed({ url }: { url: string }) {
  const youtubeId = getYoutubeId(url);
  const vimeoId = getVimeoId(url);

  if (!youtubeId && !vimeoId) return null;

  return (
    <div className="mt-3 w-full max-w-[260px] aspect-video rounded-xl overflow-hidden border border-gray-800 bg-black shadow-lg">
      <div className="absolute inset-0 flex items-center justify-center -z-10">
        <Video size={24} className="text-gray-800 animate-pulse" />
      </div>
      {youtubeId && (
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      )}
      {vimeoId && (
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}`}
          title="Vimeo video player"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      )}
    </div>
  );
}

export function ExerciseFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  // ── Campos del formulario ──────────────────────────────────────────────────
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [technicalNotes, setTechnicalNotes] = useState('');
  const [difficultyId, setDifficultyId] = useState('');
  const [primaryMuscleId, setPrimaryMuscleId] = useState('');
  const [secondaryMuscleIds, setSecondaryMuscleIds] = useState<string[]>([]);
  // Equipamiento: map de id → is_required (1=requerido, 0=opcional)
  const [selectedEquipment, setSelectedEquipment] = useState<Record<string, number>>({});
  const [sectionTypeIds, setSectionTypeIds] = useState<string[]>([]);
  // Unidades: map de id → is_default (1=default, 0=normal)
  const [selectedUnits, setSelectedUnits] = useState<Record<string, number>>({});
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isCompound, setIsCompound] = useState(0);
  const [imagePath, setImagePath] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoLink, setVideoLink] = useState('');
  const [videoLongLink, setVideoLongLink] = useState('');

  // ── Catálogos ──────────────────────────────────────────────────────────────
  const [difficulties, setDifficulties] = useState<DifficultyLevel[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [measurementUnits, setMeasurementUnits] = useState<MeasurementUnit[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [sectionTypes, setSectionTypes] = useState<SectionType[]>([]);

  // ── Estado de UI ──────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditing);

  // Toggle para el mapa visual
  const handleMuscleMapClick = (muscleName: string) => {
    const muscle = muscleGroups.find(m => m.name.toLowerCase() === muscleName.toLowerCase());
    if (!muscle) return;

    const mid = muscle.id;

    if (primaryMuscleId === mid) {
      // Si es primario, pasa a secundario
      setPrimaryMuscleId('');
      setSecondaryMuscleIds(prev => [...prev, mid]);
    } else if (secondaryMuscleIds.includes(mid)) {
      // Si es secundario, se quita
      setSecondaryMuscleIds(prev => prev.filter(id => id !== mid));
    } else {
      // Si no está seleccionado:
      if (!primaryMuscleId) {
        // Si no hay primario, este lo es
        setPrimaryMuscleId(mid);
      } else {
        // Si ya hay primario, este es secundario
        setSecondaryMuscleIds(prev => [...prev, mid]);
      }
    }
  };

  // Cargar catálogos al montar
  useEffect(() => {
    getCatalog('difficulty_level').then((d) => setDifficulties(d as unknown as DifficultyLevel[]));
    getCatalog('muscle_group').then((d) => setMuscleGroups(d as unknown as MuscleGroup[]));
    getCatalog('equipment').then((d) => setEquipmentList(d as unknown as Equipment[]));
    getCatalog('measurement_unit').then((d) => setMeasurementUnits(d as unknown as MeasurementUnit[]));
    getCatalog('tag').then((d) => setTags(d as unknown as Tag[]));
    getCatalog('section_type').then((d) => setSectionTypes(d as unknown as SectionType[]));
  }, []);

  // En edición: cargar datos del ejercicio existente
  const loadExercise = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getById(id);
      if (!data) {
        toast.error('Ejercicio no encontrado');
        navigate('/ejercicios');
        return;
      }

      setName(data.name);
      setDescription(data.description ?? '');
      setTechnicalNotes(data.technical_notes ?? '');
      setDifficultyId(data.difficulty_level_id ?? '');
      setPrimaryMuscleId(data.primary_muscle_group_id ?? '');
      setIsCompound(data.is_compound);

      // Cargar imagen: priorizar SVG (image_url) para la vista previa
      if (data.image_url) {
        setImagePreview(data.image_url);
      } else if (data.image_path) {
        setImagePath(data.image_path);
        const url = await getImageDisplayUrl(data.image_path);
        setImagePreview(url);
      }
      setVideoLink(data.video_path ?? '');
      setVideoLongLink(data.video_long_path ?? '');

      // Cargar relaciones
      const { relations } = data;

      // Músculos secundarios (los no primarios)
      const secIds = relations.muscleGroups
        .filter((mg) => !mg.is_primary)
        .map((mg) => mg.id);
      setSecondaryMuscleIds(secIds);

      // Equipamiento con is_required
      const eqMap: Record<string, number> = {};
      relations.equipment.forEach((eq) => { eqMap[eq.id] = eq.is_required; });
      setSelectedEquipment(eqMap);

      // Tipos de sección
      setSectionTypeIds(relations.sectionTypes.map((st) => st.id));

      // Unidades con is_default
      const unitMap: Record<string, number> = {};
      relations.units.forEach((u) => { unitMap[u.id] = u.is_default; });
      setSelectedUnits(unitMap);

      // Tags
      setSelectedTagIds(relations.tags.map((t) => t.id));
    } catch (e) {
      toast.error('Error al cargar el ejercicio');
    } finally {
      setLoadingData(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (isEditing) loadExercise();
  }, [isEditing, loadExercise]);

  // ── Handlers de multi-selección ───────────────────────────────────────────

  // Toggle músculo secundario; si se selecciona el primario como secundario, ignorar
  function toggleSecondaryMuscle(muscleId: string) {
    if (muscleId === primaryMuscleId) return;
    setSecondaryMuscleIds((prev) =>
      prev.includes(muscleId) ? prev.filter((id) => id !== muscleId) : [...prev, muscleId]
    );
  }

  // Al cambiar músculo principal, removerlo de los secundarios si estaba
  function handlePrimaryMuscleChange(muscleId: string) {
    setPrimaryMuscleId(muscleId);
    setSecondaryMuscleIds((prev) => prev.filter((id) => id !== muscleId));
  }

  // Toggle equipamiento: primera vez → requerido; segunda → opcional; tercera → deseleccionar
  function toggleEquipment(equipId: string) {
    setSelectedEquipment((prev) => {
      if (!(equipId in prev)) {
        // No seleccionado → seleccionar como requerido
        return { ...prev, [equipId]: 1 };
      } else if (prev[equipId] === 1) {
        // Requerido → opcional
        return { ...prev, [equipId]: 0 };
      } else {
        // Opcional → deseleccionar
        const next = { ...prev };
        delete next[equipId];
        return next;
      }
    });
  }

  // Toggle tipo de sección
  function toggleSectionType(stId: string) {
    setSectionTypeIds((prev) =>
      prev.includes(stId) ? prev.filter((id) => id !== stId) : [...prev, stId]
    );
  }

  // Toggle unidad: primera vez → no-default; si ya existe y se vuelve a tocar la default, cambia cuál es default
  function toggleUnit(unitId: string) {
    setSelectedUnits((prev) => {
      if (!(unitId in prev)) {
        // Primera unidad seleccionada: marcar como default automáticamente
        const hasDefault = Object.values(prev).some((v) => v === 1);
        return { ...prev, [unitId]: hasDefault ? 0 : 1 };
      } else if (prev[unitId] === 0) {
        // Poner como default (quitar default a otras)
        const next: Record<string, number> = {};
        Object.keys(prev).forEach((k) => { next[k] = 0; });
        next[unitId] = 1;
        return next;
      } else {
        // Deseleccionar si es la única o mover default
        const next = { ...prev };
        delete next[unitId];
        // Si quedan unidades y ninguna es default, hacer default a la primera
        const remaining = Object.keys(next);
        if (remaining.length > 0 && !remaining.some((k) => next[k] === 1)) {
          next[remaining[0]] = 1;
        }
        return next;
      }
    });
  }

  // Toggle tag
  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  }

  // Seleccionar imagen
  async function handlePickImage() {
    try {
      const result = await pickImage('exercises');
      setImagePath(result.path);
      setImagePreview(result.dataUrl);
    } catch (e) {
      if (e instanceof Error && e.message !== 'Selección cancelada') {
        toast.error('Error al seleccionar imagen');
      }
    }
  }

  // ── Guardar ───────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!name.trim()) {
      toast.error('El nombre del ejercicio es obligatorio');
      return;
    }

    setSaving(true);
    try {
      // Construir relaciones desde los estados de selección
      const relations: ExerciseRelations = {
        muscleGroups: [
          // Músculo principal
          ...(primaryMuscleId
            ? [{ id: primaryMuscleId, name: muscleGroups.find((m) => m.id === primaryMuscleId)?.name ?? '', is_primary: 1 }]
            : []),
          // Músculos secundarios
          ...secondaryMuscleIds.map((mid) => ({
            id: mid,
            name: muscleGroups.find((m) => m.id === mid)?.name ?? '',
            is_primary: 0,
          })),
        ],
        equipment: Object.entries(selectedEquipment).map(([eqId, isRequired]) => ({
          id: eqId,
          name: equipmentList.find((e) => e.id === eqId)?.name ?? '',
          is_required: isRequired,
        })),
        sectionTypes: sectionTypeIds.map((stId) => ({
          id: stId,
          name: sectionTypes.find((st) => st.id === stId)?.name ?? '',
        })),
        units: Object.entries(selectedUnits).map(([unitId, isDefault]) => ({
          id: unitId,
          name: measurementUnits.find((u) => u.id === unitId)?.name ?? '',
          abbreviation: measurementUnits.find((u) => u.id === unitId)?.abbreviation ?? '',
          is_default: isDefault,
        })),
        tags: selectedTagIds.map((tagId) => ({
          id: tagId,
          name: tags.find((t) => t.id === tagId)?.name ?? '',
          color: tags.find((t) => t.id === tagId)?.color,
        })),
      };

      const exerciseData = {
        name: name.trim(),
        description: description.trim() || undefined,
        technical_notes: technicalNotes.trim() || undefined,
        difficulty_level_id: difficultyId || undefined,
        primary_muscle_group_id: primaryMuscleId || undefined,
        image_path: imagePath || undefined,
        video_path: videoLink.trim() || undefined,
        video_long_path: videoLongLink.trim() || undefined,
        is_compound: isCompound,
        is_active: 1,
      };

      if (isEditing && id) {
        await update(id, exerciseData, relations);
        toast.success('Ejercicio actualizado');
      } else {
        await create(exerciseData, relations);
        toast.success('Ejercicio creado');
      }

      navigate('/ejercicios');
    } catch (e) {
      const msg = e instanceof Error ? e.message : null;
      toast.error(msg ?? (isEditing ? 'Error al actualizar el ejercicio' : 'Error al crear el ejercicio'));
    } finally {
      setSaving(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loadingData) {
    return (
      <>
        <Header
          title={isEditing ? 'Editar ejercicio' : 'Nuevo ejercicio'}
          leftAction={
            <button onClick={() => navigate(-1)} className="text-gray-400 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
              <ChevronLeft size={24} />
            </button>
          }
        />
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500 text-sm">Cargando...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title={isEditing ? 'Editar ejercicio' : 'Nuevo ejercicio'}
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
            className="text-primary-500 hover:text-primary-400 font-medium text-sm min-h-[44px] px-1 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        }
      />

      <div className="flex flex-col gap-6 p-4 pb-10">
        {/* ── 1. Nombre ── */}
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">
            Nombre <span className="text-primary-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Deadlift, Pull-up..."
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-primary-500 min-h-[44px]"
          />
        </div>

        {/* ── 2. Descripción ── */}
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción breve del ejercicio..."
            rows={3}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-primary-500 resize-none"
          />
        </div>

        {/* ── 2b. Video corto ── */}
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Video corto</label>
          <input
            type="url"
            value={videoLink}
            onChange={(e) => setVideoLink(e.target.value)}
            placeholder="Ej: https://www.youtube.com/watch?v=..."
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-primary-500 min-h-[44px]"
          />
          {videoLink && <VideoEmbed url={videoLink} />}
        </div>

        {/* ── 2c. Video explicativo ── */}
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Video explicativo</label>
          <input
            type="url"
            value={videoLongLink}
            onChange={(e) => setVideoLongLink(e.target.value)}
            placeholder="Ej: https://www.youtube.com/watch?v=..."
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-primary-500 min-h-[44px]"
          />
          {videoLongLink && <VideoEmbed url={videoLongLink} />}
        </div>

        {/* ── 3. Dificultad ── */}
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Dificultad</label>
          <select
            value={difficultyId}
            onChange={(e) => setDifficultyId(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 appearance-none min-h-[44px]"
          >
            <option value="">Sin especificar</option>
            {difficulties.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* ── 4 & 5. Grupos musculares (Mapa Visual) ── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <label className="block text-sm text-gray-400 mb-4">Selección de músculos</label>
          
          <div className="flex flex-col md:flex-row gap-6 items-center mb-6">
            <div className="w-full max-w-[500px] bg-gray-950/50 rounded-xl p-4 border border-gray-800/50">
              <MuscleMap
                interactive
                onMuscleClick={handleMuscleMapClick}
                primaryMuscles={muscleGroups.filter(m => m.id === primaryMuscleId).map(m => m.name)}
                secondaryMuscles={muscleGroups.filter(m => secondaryMuscleIds.includes(m.id)).map(m => m.name)}
              />
            </div>
            
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-[#ef4444]" />
                <span className="text-sm text-gray-300">Primario (Click 1)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-[#f59e0b]" />
                <span className="text-sm text-gray-300">Secundario (Click 2)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-gray-700" />
                <span className="text-sm text-gray-500">Sin seleccionar (Click 3)</span>
              </div>
              <p className="text-xs text-gray-500 mt-4 leading-relaxed italic">
                Podes tocar directamente el mapa o usar los desplegables de abajo.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 ml-1">Músculo Principal</label>
              <select
                value={primaryMuscleId}
                onChange={(e) => handlePrimaryMuscleChange(e.target.value)}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 appearance-none min-h-[44px]"
              >
                <option value="">Sin especificar</option>
                {muscleGroups.map((mg) => (
                  <option key={mg.id} value={mg.id}>{mg.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1.5 ml-1">Músculos Secundarios</label>
              <div className="flex flex-wrap gap-1.5 p-2 bg-gray-800/30 rounded-xl border border-gray-700/50 min-h-[46px]">
                {muscleGroups
                  .filter((mg) => secondaryMuscleIds.includes(mg.id))
                  .map((mg) => (
                    <Badge 
                      key={mg.id} 
                      label={mg.name} 
                      color="#f59e0b" 
                      size="sm" 
                    />
                  ))}
                {secondaryMuscleIds.length === 0 && (
                  <span className="text-xs text-gray-600 self-center ml-1">Ninguno</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── 6. Equipamiento ── */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Equipamiento</label>
          <p className="text-xs text-gray-600 mb-2">Tocá una vez para requerido, dos veces para opcional, tres para quitar</p>
          <div className="flex flex-wrap gap-2">
            {equipmentList.map((eq) => {
              const isSelected = eq.id in selectedEquipment;
              const isRequired = selectedEquipment[eq.id] === 1;
              return (
                <button
                  key={eq.id}
                  type="button"
                  onClick={() => toggleEquipment(eq.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all min-h-[36px] ${
                    isSelected && isRequired
                      ? 'border border-primary-500 bg-primary-500/20 text-primary-400'
                      : isSelected && !isRequired
                      ? 'border border-dashed border-primary-500 bg-transparent text-primary-400'
                      : 'border border-gray-600 text-gray-400 bg-transparent'
                  }`}
                >
                  {isSelected && isRequired && <Check size={12} />}
                  {eq.name}
                  {isSelected && isRequired && <span className="text-xs opacity-75">(req.)</span>}
                  {isSelected && !isRequired && <span className="text-xs opacity-75">(opc.)</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 7. Tipos de sección ── */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Tipos de sección</label>
          <div className="flex flex-wrap gap-2">
            {sectionTypes.map((st) => {
              const selected = sectionTypeIds.includes(st.id);
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => toggleSectionType(st.id)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-all min-h-[36px]`}
                  style={
                    selected
                      ? {
                          borderColor: st.color ?? '#f97316',
                          backgroundColor: `${st.color ?? '#f97316'}22`,
                          color: st.color ?? '#f97316',
                        }
                      : { borderColor: '#4b5563', color: '#9ca3af', backgroundColor: 'transparent' }
                  }
                >
                  {st.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 8. Unidades de medida ── */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Unidades de medida</label>
          <p className="text-xs text-gray-600 mb-2">Tocá para seleccionar; tocá la seleccionada para marcarla como predeterminada (★)</p>
          <div className="flex flex-wrap gap-2">
            {measurementUnits.map((unit) => {
              const isSelected = unit.id in selectedUnits;
              const isDefault = selectedUnits[unit.id] === 1;
              return (
                <button
                  key={unit.id}
                  type="button"
                  onClick={() => toggleUnit(unit.id)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border transition-all min-h-[36px] ${
                    isSelected
                      ? 'border-primary-500 bg-primary-500/20 text-primary-400'
                      : 'border-gray-600 text-gray-400 bg-transparent'
                  }`}
                >
                  {isDefault && <Star size={11} fill="currentColor" />}
                  {unit.name} ({unit.abbreviation})
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 9. Tags ── */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Tags</label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-all min-h-[36px] ${
                  selectedTagIds.includes(tag.id)
                    ? 'border-transparent text-white'
                    : 'border-gray-600 text-gray-400 bg-transparent'
                }`}
                style={
                  selectedTagIds.includes(tag.id)
                    ? { backgroundColor: tag.color ?? '#f97316' }
                    : {}
                }
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>

        {/* ── 10. Notas técnicas ── */}
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Notas técnicas</label>
          <textarea
            value={technicalNotes}
            onChange={(e) => setTechnicalNotes(e.target.value)}
            placeholder="Indicaciones de técnica, cuidados, variantes..."
            rows={4}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-primary-500 resize-none"
          />
        </div>

        {/* ── 11. Compuesto / Aislado ── */}
        <div className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
          <div>
            <p className="text-white text-sm font-medium">Ejercicio compuesto</p>
            <p className="text-gray-500 text-xs mt-0.5">Involucra múltiples grupos musculares</p>
          </div>
          <button
            type="button"
            onClick={() => setIsCompound((v) => (v ? 0 : 1))}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              isCompound ? 'bg-primary-600' : 'bg-gray-700'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                isCompound ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* ── 12. Imagen (Minimalista) ── */}
        <div className="flex items-center gap-4 bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <div className="w-24 h-24 rounded-xl bg-gray-950 border border-gray-700 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <Camera size={32} className="text-gray-800" />
            )}
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <h4 className="text-white text-sm font-bold">Imagen del ejercicio</h4>
            <p className="text-xs text-gray-500 leading-tight">
              {imagePreview ? 'Mostrando mapa muscular o foto personalizada.' : 'Elegí una foto o dejá que el sistema genere el mapa muscular.'}
            </p>
            <button
              type="button"
              onClick={handlePickImage}
              className="mt-1 self-start bg-primary-500/10 text-primary-500 border border-primary-500/20 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-primary-500 hover:text-white transition-all min-h-[36px]"
            >
              {imagePreview ? 'Cambiar imagen' : 'Seleccionar foto'}
            </button>
          </div>
        </div>

        {/* Botón guardar al final del formulario */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-xl py-3.5 font-medium text-base min-h-[52px] disabled:opacity-50 transition-colors"
        >
          {saving ? 'Guardando...' : isEditing ? 'Actualizar ejercicio' : 'Crear ejercicio'}
        </button>
      </div>
    </>
  );
}
