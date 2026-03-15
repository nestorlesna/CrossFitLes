// Página principal de plantillas de clase con vista lista y calendario
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Star,
  Copy,
  CalendarDays,
  List,
  ChevronLeft,
  ChevronRight,
  Clock,
  Layers,
  Dumbbell,
  Filter,
  X,
} from 'lucide-react';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { Header } from '../../components/layout/Header';
import { SearchBar } from '../../components/ui/SearchBar';
import { ClassTemplate, ClassTemplateFilters } from '../../models/ClassTemplate';
import * as classTemplateRepo from '../../db/repositories/classTemplateRepo';

// Modo de vista: lista o calendario
type ViewMode = 'list' | 'calendar';

// Formatea una fecha ISO a "dd MMM"
function formatShortDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'd MMM', { locale: es });
  } catch {
    return dateStr;
  }
}

export function ClassesPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<ClassTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Estado de filtros
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterFavorite, setFilterFavorite] = useState(false);
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');

  // Estado del calendario
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarTemplates, setCalendarTemplates] = useState<ClassTemplate[]>([]);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  // Debounce del campo de búsqueda
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Carga la lista de plantillas aplicando filtros
  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const filters: ClassTemplateFilters = {};
      if (search) filters.search = search;
      if (filterFavorite) filters.is_favorite = true;
      if (filterFromDate) filters.from_date = filterFromDate;
      if (filterToDate) filters.to_date = filterToDate;
      if (selectedCalendarDate) {
        filters.from_date = selectedCalendarDate;
        filters.to_date = selectedCalendarDate;
      }
      const data = await classTemplateRepo.getAll(filters);
      setTemplates(data);
    } catch (err) {
      toast.error('Error al cargar las clases');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, filterFavorite, filterFromDate, filterToDate, selectedCalendarDate]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Carga plantillas del mes visible para el calendario
  useEffect(() => {
    if (viewMode !== 'calendar') return;
    const from = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const to = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
    classTemplateRepo.getByDateRange(from, to).then(setCalendarTemplates).catch(console.error);
  }, [viewMode, currentMonth]);

  // Alterna el favorito con actualización optimista
  const handleToggleFavorite = async (e: React.MouseEvent, template: ClassTemplate) => {
    e.stopPropagation();
    const newValue = template.is_favorite === 1 ? 0 : 1;
    // Actualización optimista
    setTemplates((prev) =>
      prev.map((t) => (t.id === template.id ? { ...t, is_favorite: newValue } : t))
    );
    try {
      await classTemplateRepo.toggleFavorite(template.id);
    } catch {
      // Revertir en caso de error
      setTemplates((prev) =>
        prev.map((t) => (t.id === template.id ? { ...t, is_favorite: template.is_favorite } : t))
      );
      toast.error('Error al actualizar favorito');
    }
  };

  // Duplica una plantilla y navega al detalle de la nueva
  const handleDuplicate = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const newId = await classTemplateRepo.duplicate(id);
      toast.success('Plantilla duplicada');
      await loadTemplates();
      navigate(`/clases/${newId}`);
    } catch {
      toast.error('Error al duplicar la plantilla');
    }
  };

  // Limpia el filtro de fecha del calendario
  const handleCalendarDayClick = (dateStr: string) => {
    if (selectedCalendarDate === dateStr) {
      setSelectedCalendarDate(null);
    } else {
      setSelectedCalendarDate(dateStr);
    }
  };

  // Calcula los días del mes para el grid del calendario
  const calendarDays = (() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    // Día de la semana del primer día (0=Dom, ajustar a Lun=0)
    const firstDayOfWeek = (getDay(start) + 6) % 7; // Lunes como primer día
    return { days, firstDayOfWeek };
  })();

  // Conjunto de fechas con clases en el mes visible
  const datesWithClasses = new Set(
    calendarTemplates.filter((t) => t.date).map((t) => t.date as string)
  );

  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setFilterFavorite(false);
    setFilterFromDate('');
    setFilterToDate('');
    setSelectedCalendarDate(null);
  };

  const hasActiveFilters =
    search || filterFavorite || filterFromDate || filterToDate || selectedCalendarDate;

  return (
    <>
      <Header
        title="Clases"
        rightAction={
          <button
            onClick={() => navigate('/clases/nueva')}
            className="text-primary-500 hover:text-primary-400 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Nueva clase"
          >
            <Plus size={24} />
          </button>
        }
      />

      <div className="px-4 py-4 space-y-4 pb-24">
        {/* Controles de búsqueda y modo de vista */}
        <div className="flex gap-2 items-center">
          <div className="flex-1">
            <SearchBar
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Buscar clases..."
            />
          </div>
          {/* Toggle filtros */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-xl border min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors ${
              hasActiveFilters
                ? 'bg-primary-600 border-primary-500 text-white'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
            }`}
            aria-label="Filtros"
          >
            <Filter size={18} />
          </button>
          {/* Toggle vista lista/calendario */}
          <button
            onClick={() => {
              setViewMode(viewMode === 'list' ? 'calendar' : 'list');
              setSelectedCalendarDate(null);
            }}
            className="p-2.5 rounded-xl border border-gray-700 bg-gray-800 text-gray-400 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
            aria-label={viewMode === 'list' ? 'Vista calendario' : 'Vista lista'}
          >
            {viewMode === 'list' ? <CalendarDays size={18} /> : <List size={18} />}
          </button>
        </div>

        {/* Panel de filtros colapsable */}
        {showFilters && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">Filtros</span>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
                >
                  <X size={12} />
                  Limpiar
                </button>
              )}
            </div>

            {/* Filtro favoritas */}
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setFilterFavorite(!filterFavorite)}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  filterFavorite ? 'bg-primary-600' : 'bg-gray-700'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    filterFavorite ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </div>
              <span className="text-sm text-gray-300">Solo favoritas</span>
            </label>

            {/* Rango de fechas */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Desde</label>
                <input
                  type="date"
                  value={filterFromDate}
                  onChange={(e) => setFilterFromDate(e.target.value)}
                  className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Hasta</label>
                <input
                  type="date"
                  value={filterToDate}
                  onChange={(e) => setFilterToDate(e.target.value)}
                  className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Vista Calendario */}
        {viewMode === 'calendar' && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            {/* Navegación del mes */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 text-gray-400 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-white font-medium capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: es })}
              </span>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 text-gray-400 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Encabezados de días de la semana */}
            <div className="grid grid-cols-7 border-b border-gray-800">
              {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'].map((d) => (
                <div key={d} className="text-center text-xs text-gray-500 py-2">
                  {d}
                </div>
              ))}
            </div>

            {/* Grid de días */}
            <div className="grid grid-cols-7">
              {/* Celdas vacías antes del primer día */}
              {Array.from({ length: calendarDays.firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="py-3" />
              ))}

              {calendarDays.days.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const hasClass = datesWithClasses.has(dateStr);
                const isSelected = selectedCalendarDate === dateStr;
                const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');

                return (
                  <button
                    key={dateStr}
                    onClick={() => handleCalendarDayClick(dateStr)}
                    className={`flex flex-col items-center py-2 px-1 transition-colors relative min-h-[44px] ${
                      isSelected ? 'bg-primary-600/20' : 'hover:bg-gray-800'
                    }`}
                  >
                    <span
                      className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-primary-600 text-white'
                          : isSelected
                          ? 'text-primary-400'
                          : 'text-gray-300'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                    {hasClass && (
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {selectedCalendarDate && (
              <div className="px-4 py-2 border-t border-gray-800 flex items-center justify-between">
                <span className="text-sm text-gray-400">
                  {format(parseISO(selectedCalendarDate), "d 'de' MMMM", { locale: es })}
                </span>
                <button
                  onClick={() => setSelectedCalendarDate(null)}
                  className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
                >
                  <X size={12} />
                  Quitar filtro
                </button>
              </div>
            )}
          </div>
        )}

        {/* Lista de plantillas */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-gray-800 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : templates.length === 0 ? (
          // Estado vacío
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarDays size={48} className="text-gray-600 mb-4" />
            <p className="text-lg font-medium text-gray-400">No hay clases planificadas</p>
            <p className="text-sm text-gray-600 mt-1 mb-6">
              {hasActiveFilters
                ? 'No hay resultados con los filtros aplicados'
                : 'Creá tu primera plantilla de clase'}
            </p>
            {!hasActiveFilters && (
              <button
                onClick={() => navigate('/clases/nueva')}
                className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-3 rounded-xl font-medium transition-colors min-h-[44px]"
              >
                Crear primera clase
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map((template) => (
              <div
                key={template.id}
                onClick={() => navigate(`/clases/${template.id}`)}
                className="bg-gray-900 border border-gray-800 rounded-xl p-4 cursor-pointer hover:border-gray-700 active:bg-gray-800 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {/* Indicador de favorita */}
                      <button
                        onClick={(e) => handleToggleFavorite(e, template)}
                        className="shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 -my-2"
                        aria-label={template.is_favorite ? 'Quitar favorita' : 'Marcar como favorita'}
                      >
                        <Star
                          size={18}
                          className={
                            template.is_favorite === 1
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-600'
                          }
                        />
                      </button>
                      <h3 className="text-white font-semibold truncate">{template.name}</h3>
                    </div>

                    {/* Meta información */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 ml-8">
                      {template.date && (
                        <span className="text-gray-400">{formatShortDate(template.date)}</span>
                      )}
                      {template.estimated_duration_minutes && (
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {template.estimated_duration_minutes} min
                        </span>
                      )}
                      {(template.section_count ?? 0) > 0 && (
                        <span className="flex items-center gap-1">
                          <Layers size={11} />
                          {template.section_count} secc.
                        </span>
                      )}
                      {(template.exercise_count ?? 0) > 0 && (
                        <span className="flex items-center gap-1">
                          <Dumbbell size={11} />
                          {template.exercise_count} ej.
                        </span>
                      )}
                    </div>

                    {/* Objetivo */}
                    {template.objective && (
                      <p className="text-xs text-gray-500 mt-1.5 ml-8 line-clamp-1">
                        {template.objective}
                      </p>
                    )}
                  </div>

                  {/* Botón duplicar */}
                  <button
                    onClick={(e) => handleDuplicate(e, template.id)}
                    className="shrink-0 p-2 text-gray-500 hover:text-gray-300 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Duplicar plantilla"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
