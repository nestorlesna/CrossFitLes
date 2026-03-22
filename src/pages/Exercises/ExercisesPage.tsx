// Pantalla principal de la biblioteca de ejercicios con búsqueda y filtros
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, SlidersHorizontal, X, Dumbbell, CalendarCheck } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { SearchBar } from '../../components/ui/SearchBar';
import { Modal } from '../../components/ui/Modal';
import { ExerciseCard } from '../../components/exercises/ExerciseCard';
import { useExercises } from '../../hooks/useExercises';
import { ExerciseFilters } from '../../models/Exercise';
import { getAll as getCatalog } from '../../db/repositories/catalogRepo';
import { DifficultyLevel, MuscleGroup, Equipment, Tag } from '../../models/catalogs';

export function ExercisesPage() {
  const navigate = useNavigate();

  // Estado del texto de búsqueda (sin debounce aplicado aún)
  const [searchInput, setSearchInput] = useState('');
  // Filtros aplicados (con debounce en el search)
  const [filters, setFilters] = useState<ExerciseFilters>({ in_classes: true });
  // Control del modal de filtros
  const [showFilters, setShowFilters] = useState(false);

  // Filtros temporales dentro del modal (se aplican al cerrar)
  const [tempDifficulty, setTempDifficulty] = useState('');
  const [tempMuscle, setTempMuscle] = useState('');
  const [tempEquipment, setTempEquipment] = useState('');
  const [tempTag, setTempTag] = useState('');

  // Catálogos para los selects del modal de filtros
  const [difficulties, setDifficulties] = useState<DifficultyLevel[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  // Timer del debounce para el search
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cargar catálogos para los filtros al montar
  useEffect(() => {
    getCatalog('difficulty_level').then((d) => setDifficulties(d as unknown as DifficultyLevel[]));
    getCatalog('muscle_group').then((d) => setMuscleGroups(d as unknown as MuscleGroup[]));
    getCatalog('equipment').then((d) => setEquipmentList(d as unknown as Equipment[]));
    getCatalog('tag').then((d) => setTags(d as unknown as Tag[]));
  }, []);

  // Manejar cambio en el campo de búsqueda con debounce de 300ms
  function handleSearchChange(value: string) {
    setSearchInput(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: value || undefined }));
    }, 300);
  }

  // Abrir modal de filtros cargando los valores actuales
  function openFilters() {
    setTempDifficulty(filters.difficulty_level_id ?? '');
    setTempMuscle(filters.muscle_group_id ?? '');
    setTempEquipment(filters.equipment_id ?? '');
    setTempTag(filters.tag_id ?? '');
    setShowFilters(true);
  }

  // Aplicar filtros seleccionados en el modal
  function applyFilters() {
    setFilters((prev) => ({
      ...prev,
      difficulty_level_id: tempDifficulty || undefined,
      muscle_group_id: tempMuscle || undefined,
      equipment_id: tempEquipment || undefined,
      tag_id: tempTag || undefined,
    }));
    setShowFilters(false);
  }

  // Limpiar todos los filtros (mantiene in_classes)
  function clearFilters() {
    setTempDifficulty('');
    setTempMuscle('');
    setTempEquipment('');
    setTempTag('');
    setFilters((prev) => ({
      search: prev.search,
      in_classes: prev.in_classes,
    }));
    setShowFilters(false);
  }

  // Alternar el filtro "en clases"
  function toggleInClasses() {
    setFilters((prev) => ({ ...prev, in_classes: !prev.in_classes }));
  }

  // Contar filtros activos (excluyendo search) para mostrar indicador
  const activeFilterCount = [
    filters.difficulty_level_id,
    filters.muscle_group_id,
    filters.equipment_id,
    filters.tag_id,
  ].filter(Boolean).length;

  const hasAnyFilter = activeFilterCount > 0 || !!filters.search || !!filters.in_classes;

  const { exercises, loading, error } = useExercises(filters);

  return (
    <>
      <Header
        title="Ejercicios"
        rightAction={
          <button
            className="text-primary-500 hover:text-primary-400 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
            onClick={() => navigate('/ejercicios/nuevo')}
            aria-label="Agregar ejercicio"
          >
            <Plus size={24} />
          </button>
        }
      />

      <div className="flex flex-col gap-3 p-4">
        {/* Barra de búsqueda y filtros */}
        <div className="flex gap-2">
          <div className="flex-1">
            <SearchBar
              value={searchInput}
              onChange={handleSearchChange}
              placeholder="Buscar ejercicios..."
            />
          </div>
          {/* Botón de filtros con indicador de filtros activos */}
          <button
            className={`relative flex items-center justify-center w-11 h-11 rounded-xl border transition-colors ${
              activeFilterCount > 0
                ? 'bg-primary-600 border-primary-500 text-white'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
            }`}
            onClick={openFilters}
            aria-label="Filtros"
          >
            <SlidersHorizontal size={20} />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-white text-primary-600 text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Toggle: solo ejercicios en clases */}
        <button
          onClick={toggleInClasses}
          className={`self-start flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            filters.in_classes
              ? 'bg-primary-600 border-primary-500 text-white'
              : 'bg-gray-800 border-gray-700 text-gray-400'
          }`}
        >
          <CalendarCheck size={13} />
          En clases
        </button>

        {/* Estado de carga */}
        {loading && (
          <div className="flex flex-col gap-2 mt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex gap-3 animate-pulse">
                <div className="w-15 h-15 bg-gray-800 rounded-lg" style={{ width: 60, height: 60 }} />
                <div className="flex-1 flex flex-col gap-2 justify-center">
                  <div className="h-4 bg-gray-800 rounded w-3/4" />
                  <div className="h-3 bg-gray-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Estado de error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Lista de ejercicios */}
        {!loading && !error && exercises.length > 0 && (
          <div className="flex flex-col gap-2">
            {exercises.map((exercise) => (
              <ExerciseCard key={exercise.id} exercise={exercise} />
            ))}
          </div>
        )}

        {/* Estado vacío */}
        {!loading && !error && exercises.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center">
              <Dumbbell size={32} className="text-gray-600" />
            </div>
            <div>
              <p className="text-gray-400 text-base font-medium">No hay ejercicios</p>
              <p className="text-gray-600 text-sm mt-1">
                {hasAnyFilter
                  ? 'Probá con otros filtros o términos de búsqueda'
                  : 'Agregá tu primer ejercicio'}
              </p>
            </div>
            {!hasAnyFilter && (
              <button
                className="bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-4 py-2 text-sm font-medium min-h-[44px]"
                onClick={() => navigate('/ejercicios/nuevo')}
              >
                Agregar ejercicio
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal de filtros */}
      <Modal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filtros"
        footer={
          <div className="flex gap-3">
            <button
              className="flex-1 border border-gray-700 text-gray-400 rounded-lg px-4 py-2.5 text-sm min-h-[44px]"
              onClick={clearFilters}
            >
              Limpiar filtros
            </button>
            <button
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-4 py-2.5 text-sm font-medium min-h-[44px]"
              onClick={applyFilters}
            >
              Aplicar
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          {/* Filtro por dificultad */}
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Dificultad</label>
            <div className="relative">
              <select
                value={tempDifficulty}
                onChange={(e) => setTempDifficulty(e.target.value)}
                className="w-full bg-gray-800 text-white rounded-lg px-3 py-2.5 text-sm border border-gray-700 focus:outline-none focus:border-primary-500 appearance-none min-h-[44px]"
              >
                <option value="">Todas las dificultades</option>
                {difficulties.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Filtro por grupo muscular */}
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Grupo muscular</label>
            <select
              value={tempMuscle}
              onChange={(e) => setTempMuscle(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2.5 text-sm border border-gray-700 focus:outline-none focus:border-primary-500 appearance-none min-h-[44px]"
            >
              <option value="">Todos los músculos</option>
              {muscleGroups.map((mg) => (
                <option key={mg.id} value={mg.id}>{mg.name}</option>
              ))}
            </select>
          </div>

          {/* Filtro por equipamiento */}
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Equipamiento</label>
            <select
              value={tempEquipment}
              onChange={(e) => setTempEquipment(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2.5 text-sm border border-gray-700 focus:outline-none focus:border-primary-500 appearance-none min-h-[44px]"
            >
              <option value="">Todo el equipamiento</option>
              {equipmentList.map((eq) => (
                <option key={eq.id} value={eq.id}>{eq.name}</option>
              ))}
            </select>
          </div>

          {/* Filtro por tag */}
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Tag</label>
            <select
              value={tempTag}
              onChange={(e) => setTempTag(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2.5 text-sm border border-gray-700 focus:outline-none focus:border-primary-500 appearance-none min-h-[44px]"
            >
              <option value="">Todos los tags</option>
              {tags.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Indicador de filtros activos */}
          {(tempDifficulty || tempMuscle || tempEquipment || tempTag) && (
            <button
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-400"
              onClick={() => {
                setTempDifficulty('');
                setTempMuscle('');
                setTempEquipment('');
                setTempTag('');
              }}
            >
              <X size={14} />
              Limpiar selección
            </button>
          )}
        </div>
      </Modal>
    </>
  );
}
