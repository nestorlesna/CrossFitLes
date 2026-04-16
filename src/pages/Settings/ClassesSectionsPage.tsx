// Listado de clases con secciones — permite copiar secciones entre clases
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronDown, Copy,
  Star, Loader2, Search, Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '../../components/layout/Header';
import { Modal } from '../../components/ui/Modal';
import { getAll, getById, create } from '../../db/repositories/classTemplateRepo';
import { getDatabase, saveDatabase } from '../../db/database';
import { generateUUID, formatDate } from '../../utils/formatters';
import type { ClassTemplate, ClassTemplateWithSections, ClassSection, SectionExercise } from '../../models/ClassTemplate';

// ── Lógica de copia ───────────────────────────────────────────────────────────

function nowStr(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

function buildExInsert(
  sectionId: string,
  ex: SectionExercise,
  sort: number,
  now: string
): { statement: string; values: unknown[] } {
  return {
    statement: `INSERT INTO section_exercise
      (id, class_section_id, exercise_id, sort_order, coach_notes,
       planned_repetitions, planned_weight_value, planned_weight_unit_id,
       planned_time_seconds, planned_distance_value, planned_distance_unit_id,
       planned_calories, planned_rest_seconds, planned_rounds, rm_percentage,
       suggested_scaling, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    values: [
      generateUUID(), sectionId, ex.exercise_id, sort,
      ex.coach_notes ?? null,
      ex.planned_repetitions ?? null, ex.planned_weight_value ?? null, ex.planned_weight_unit_id ?? null,
      ex.planned_time_seconds ?? null, ex.planned_distance_value ?? null, ex.planned_distance_unit_id ?? null,
      ex.planned_calories ?? null, ex.planned_rest_seconds ?? null, ex.planned_rounds ?? null,
      ex.rm_percentage ?? null, ex.suggested_scaling ?? null, ex.notes ?? null,
      now, now,
    ],
  };
}

async function copySectionTo(
  section: ClassSection,
  destClassId: string
): Promise<{ added: number; skipped: number }> {
  const db = getDatabase();
  const now = nowStr();
  const stmts: { statement: string; values: unknown[] }[] = [];

  // ¿Ya existe en destino una sección del mismo tipo?
  const secRes = await db.query(
    `SELECT id FROM class_section WHERE class_template_id = ? AND section_type_id = ? LIMIT 1`,
    [destClassId, section.section_type_id]
  );

  let destSectionId: string;
  let added = 0;
  let skipped = 0;

  if (!secRes.values?.length) {
    // Crear nueva sección en el destino
    destSectionId = generateUUID();
    const maxSortRes = await db.query(
      `SELECT COALESCE(MAX(sort_order), 0) as ms FROM class_section WHERE class_template_id = ?`,
      [destClassId]
    );
    const nextSort = ((maxSortRes.values?.[0]?.ms as number) ?? 0) + 1;

    stmts.push({
      statement: `INSERT INTO class_section
        (id, class_template_id, section_type_id, work_format_id, sort_order,
         visible_title, general_description, time_cap_seconds, total_rounds,
         rest_between_rounds_seconds, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      values: [
        destSectionId, destClassId, section.section_type_id,
        section.work_format_id ?? null, nextSort,
        section.visible_title ?? null, section.general_description ?? null,
        section.time_cap_seconds ?? null, section.total_rounds ?? null,
        section.rest_between_rounds_seconds ?? null, section.notes ?? null,
        now, now,
      ],
    });

    section.exercises.forEach((ex, i) => {
      stmts.push(buildExInsert(destSectionId, ex, i + 1, now));
    });
    added = section.exercises.length;

  } else {
    // Fusionar en sección existente
    destSectionId = secRes.values[0].id as string;

    const existExRes = await db.query(
      `SELECT exercise_id FROM section_exercise WHERE class_section_id = ?`,
      [destSectionId]
    );
    const existingIds = new Set((existExRes.values ?? []).map(r => r.exercise_id as string));

    const maxSortRes = await db.query(
      `SELECT COALESCE(MAX(sort_order), 0) as ms FROM section_exercise WHERE class_section_id = ?`,
      [destSectionId]
    );
    let nextSort = ((maxSortRes.values?.[0]?.ms as number) ?? 0) + 1;

    section.exercises.forEach(ex => {
      if (existingIds.has(ex.exercise_id)) {
        skipped++;
      } else {
        stmts.push(buildExInsert(destSectionId, ex, nextSort++, now));
        added++;
      }
    });
  }

  if (stmts.length > 0) {
    await db.executeSet(stmts, true);
    await saveDatabase();
  }

  return { added, skipped };
}

// ── Tipos locales ─────────────────────────────────────────────────────────────

interface CopyTarget {
  section: ClassSection;
  sourceClass: ClassTemplate;
}

// ── SectionRow ────────────────────────────────────────────────────────────────

function SectionRow({
  section,
  sourceClass,
  onCopy,
}: {
  section: ClassSection;
  sourceClass: ClassTemplate;
  onCopy: (s: ClassSection, c: ClassTemplate) => void;
}) {
  const dotColor = section.section_type_color ?? '#64748b';
  const exCount = section.exercises?.length ?? 0;
  const label = section.visible_title || section.section_type_name || 'Sección';

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800/40 transition-colors">
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
      <span className="flex-1 text-sm text-gray-200 truncate">{label}</span>
      <span className="text-xs text-gray-600 shrink-0 mr-1">
        {exCount} {exCount === 1 ? 'ej.' : 'ejs.'}
      </span>
      <button
        onClick={() => onCopy(section, sourceClass)}
        className="p-1.5 text-gray-500 hover:text-primary-400 hover:bg-primary-400/10 rounded-lg transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
        aria-label="Copiar sección"
        title="Copiar sección a otra clase"
      >
        <Copy size={14} />
      </button>
    </div>
  );
}

// ── ClassCard ─────────────────────────────────────────────────────────────────

function ClassCard({
  cls,
  expanded,
  fullData,
  loadingExpand,
  onToggle,
  onCopy,
}: {
  cls: ClassTemplate;
  expanded: boolean;
  fullData?: ClassTemplateWithSections;
  loadingExpand: boolean;
  onToggle: (cls: ClassTemplate) => void;
  onCopy: (s: ClassSection, c: ClassTemplate) => void;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={() => onToggle(cls)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800/50 transition-colors text-left"
      >
        {cls.is_favorite === 1 && (
          <Star size={13} className="text-yellow-400 fill-yellow-400 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{cls.name}</p>
          {(cls.date || cls.objective) && (
            <p className="text-gray-500 text-xs truncate mt-0.5">
              {cls.date && formatDate(cls.date)}
              {cls.date && cls.objective && ' · '}
              {cls.objective}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-gray-600">{cls.section_count ?? 0} secc.</span>
          {loadingExpand ? (
            <Loader2 size={14} className="text-gray-500 animate-spin" />
          ) : (
            <ChevronDown
              size={16}
              className={`text-gray-600 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            />
          )}
        </div>
      </button>

      {expanded && fullData && (
        <div className="border-t border-gray-800 divide-y divide-gray-800/60">
          {fullData.sections.length === 0 ? (
            <p className="px-4 py-3 text-xs text-gray-600">Esta clase no tiene secciones.</p>
          ) : (
            fullData.sections.map(section => (
              <SectionRow
                key={section.id}
                section={section}
                sourceClass={cls}
                onCopy={onCopy}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── CopyModalContent ──────────────────────────────────────────────────────────

function CopyModalContent({
  target,
  destMode,
  setDestMode,
  destClassId,
  setDestClassId,
  classSearch,
  setClassSearch,
  filteredClasses,
  newForm,
  setNewForm,
  copying,
  onConfirm,
  onCancel,
}: {
  target: CopyTarget;
  destMode: 'existing' | 'new';
  setDestMode: (m: 'existing' | 'new') => void;
  destClassId: string;
  setDestClassId: (id: string) => void;
  classSearch: string;
  setClassSearch: (s: string) => void;
  filteredClasses: ClassTemplate[];
  newForm: { name: string; date: string; objective: string };
  setNewForm: (f: { name: string; date: string; objective: string }) => void;
  copying: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const dotColor = target.section.section_type_color ?? '#64748b';
  const exCount = target.section.exercises?.length ?? 0;
  const secLabel = target.section.visible_title || target.section.section_type_name || 'Sección';

  return (
    <div className="space-y-4">
      {/* Origen */}
      <div className="bg-gray-800/60 rounded-xl p-3 flex items-center gap-3">
        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{secLabel}</p>
          <p className="text-gray-500 text-xs truncate">
            {exCount} ejercicio{exCount !== 1 ? 's' : ''} · de: {target.sourceClass.name}
          </p>
        </div>
      </div>

      {/* Selector de modo */}
      <div className="flex gap-2">
        <button
          onClick={() => setDestMode('existing')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            destMode === 'existing'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Clase existente
        </button>
        <button
          onClick={() => setDestMode('new')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
            destMode === 'new'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          <Plus size={14} />
          Clase nueva
        </button>
      </div>

      {/* Panel: clase existente */}
      {destMode === 'existing' && (
        <div className="space-y-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar clase…"
              value={classSearch}
              onChange={e => setClassSearch(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"
            />
          </div>
          <div className="max-h-52 overflow-y-auto space-y-1">
            {filteredClasses.length === 0 ? (
              <p className="text-center text-gray-600 text-sm py-6">Sin resultados</p>
            ) : (
              filteredClasses.map(cls => (
                <button
                  key={cls.id}
                  onClick={() => setDestClassId(cls.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors border ${
                    destClassId === cls.id
                      ? 'bg-primary-600/15 border-primary-600/40'
                      : 'bg-gray-800/60 border-transparent hover:bg-gray-800'
                  }`}
                >
                  {cls.is_favorite === 1 && (
                    <Star size={11} className="text-yellow-400 fill-yellow-400 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{cls.name}</p>
                    {cls.date && (
                      <p className="text-gray-500 text-xs">{formatDate(cls.date)}</p>
                    )}
                  </div>
                  {destClassId === cls.id && (
                    <div className="w-3.5 h-3.5 rounded-full bg-primary-500 shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Panel: clase nueva */}
      {destMode === 'new' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">
              Nombre <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="Nombre de la clase"
              value={newForm.name}
              onChange={e => setNewForm({ ...newForm, name: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Fecha (opcional)</label>
            <input
              type="date"
              value={newForm.date}
              onChange={e => setNewForm({ ...newForm, date: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Objetivo (opcional)</label>
            <input
              type="text"
              placeholder="Descripción u objetivo"
              value={newForm.objective}
              onChange={e => setNewForm({ ...newForm, objective: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>
      )}

      {/* Botones */}
      <div className="flex gap-3 pt-1">
        <button
          onClick={onCancel}
          disabled={copying}
          className="flex-1 bg-gray-800 text-white font-medium py-3 rounded-xl text-sm hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          disabled={copying}
          className="flex-1 bg-primary-600 text-white font-medium py-3 rounded-xl text-sm hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {copying ? (
            <><Loader2 size={14} className="animate-spin" /> Copiando…</>
          ) : (
            <><Copy size={14} /> Copiar</>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export function ClassesSectionsPage() {
  const navigate = useNavigate();

  const [classes, setClasses] = useState<ClassTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedData, setExpandedData] = useState<Record<string, ClassTemplateWithSections>>({});
  const [loadingExpand, setLoadingExpand] = useState<string | null>(null);

  // Estado del modal de copia
  const [copyTarget, setCopyTarget] = useState<CopyTarget | null>(null);
  const [destMode, setDestMode] = useState<'existing' | 'new'>('existing');
  const [destClassId, setDestClassId] = useState('');
  const [classSearch, setClassSearch] = useState('');
  const [newForm, setNewForm] = useState({ name: '', date: '', objective: '' });
  const [copying, setCopying] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const data = await getAll();
    // Favoritas primero, luego por fecha DESC
    data.sort((a, b) => {
      if (b.is_favorite !== a.is_favorite) return b.is_favorite - a.is_favorite;
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return b.date.localeCompare(a.date);
    });
    setClasses(data);
    setLoading(false);
  }

  async function toggleExpand(cls: ClassTemplate) {
    if (expandedId === cls.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(cls.id);
    if (!expandedData[cls.id]) {
      setLoadingExpand(cls.id);
      const full = await getById(cls.id);
      if (full) setExpandedData(prev => ({ ...prev, [cls.id]: full }));
      setLoadingExpand(null);
    }
  }

  function openCopy(section: ClassSection, sourceClass: ClassTemplate) {
    setCopyTarget({ section, sourceClass });
    setDestMode('existing');
    setDestClassId('');
    setClassSearch('');
    setNewForm({ name: '', date: '', objective: '' });
  }

  function closeCopy() {
    if (copying) return;
    setCopyTarget(null);
  }

  // Clases disponibles para destino (excluye la clase origen), filtradas por búsqueda
  const filteredDest = useMemo(() => {
    if (!copyTarget) return [];
    const q = classSearch.trim().toLowerCase();
    return classes
      .filter(c => c.id !== copyTarget.sourceClass.id)
      .filter(c => !q || c.name.toLowerCase().includes(q) || (c.date ?? '').includes(q));
  }, [classes, copyTarget, classSearch]);

  async function handleCopy() {
    if (!copyTarget) return;

    if (destMode === 'existing' && !destClassId) {
      toast.error('Seleccioná una clase destino');
      return;
    }
    if (destMode === 'new' && !newForm.name.trim()) {
      toast.error('El nombre de la clase es obligatorio');
      return;
    }

    setCopying(true);
    try {
      let targetId = destClassId;
      let destName: string;

      if (destMode === 'new') {
        targetId = await create({
          name: newForm.name.trim(),
          date: newForm.date || undefined,
          objective: newForm.objective.trim() || undefined,
          general_notes: undefined,
          estimated_duration_minutes: undefined,
          is_favorite: 0,
          template_type: 'my_classes',
          is_active: 1,
        }, []);
        destName = newForm.name.trim();
        // Refrescar lista para que aparezca la nueva clase
        await loadData();
      } else {
        destName = classes.find(c => c.id === destClassId)?.name ?? '';
      }

      const { added, skipped } = await copySectionTo(copyTarget.section, targetId);
      const secName = copyTarget.section.visible_title || copyTarget.section.section_type_name || 'Sección';

      // Mensaje de resultado
      let msg = `"${secName}" → "${destName}"`;
      if (added > 0 && skipped === 0) {
        msg += ` · ${added} ejercicio${added !== 1 ? 's' : ''} copiado${added !== 1 ? 's' : ''}`;
        toast.success(msg);
      } else if (added > 0) {
        msg += ` · ${added} copiado${added !== 1 ? 's' : ''}, ${skipped} ya existían`;
        toast.success(msg);
      } else {
        msg += ' · todos los ejercicios ya existían';
        toast.info(msg);
      }

      setCopyTarget(null);

      // Si la clase destino está expandida, refrescar sus datos
      if (expandedId === targetId) {
        const refreshed = await getById(targetId);
        if (refreshed) setExpandedData(prev => ({ ...prev, [targetId]: refreshed }));
      }
    } catch (err) {
      toast.error(`Error al copiar: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setCopying(false);
    }
  }

  const favorites = classes.filter(c => c.is_favorite === 1);
  const others = classes.filter(c => c.is_favorite === 0);

  return (
    <>
      <Header
        title="Clases"
        leftAction={
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ChevronLeft size={24} />
          </button>
        }
      />

      <div className="p-4 pb-24 space-y-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Cargando clases…</p>
          </div>
        ) : classes.length === 0 ? (
          <div className="text-center py-20 text-gray-500 text-sm">
            No hay clases registradas.
          </div>
        ) : (
          <>
            {/* Favoritas */}
            {favorites.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2 px-1">
                  <Star size={12} className="text-yellow-400 fill-yellow-400" />
                  <h2 className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">Favoritas</h2>
                </div>
                <div className="space-y-2">
                  {favorites.map(cls => (
                    <ClassCard
                      key={cls.id}
                      cls={cls}
                      expanded={expandedId === cls.id}
                      fullData={expandedData[cls.id]}
                      loadingExpand={loadingExpand === cls.id}
                      onToggle={toggleExpand}
                      onCopy={openCopy}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Otras */}
            {others.length > 0 && (
              <div>
                {favorites.length > 0 && (
                  <div className="flex items-center gap-1.5 mb-2 px-1">
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Otras clases</h2>
                  </div>
                )}
                <div className="space-y-2">
                  {others.map(cls => (
                    <ClassCard
                      key={cls.id}
                      cls={cls}
                      expanded={expandedId === cls.id}
                      fullData={expandedData[cls.id]}
                      loadingExpand={loadingExpand === cls.id}
                      onToggle={toggleExpand}
                      onCopy={openCopy}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        isOpen={!!copyTarget}
        onClose={closeCopy}
        title="Copiar sección"
        size="md"
      >
        {copyTarget && (
          <CopyModalContent
            target={copyTarget}
            destMode={destMode}
            setDestMode={setDestMode}
            destClassId={destClassId}
            setDestClassId={setDestClassId}
            classSearch={classSearch}
            setClassSearch={setClassSearch}
            filteredClasses={filteredDest}
            newForm={newForm}
            setNewForm={setNewForm}
            copying={copying}
            onConfirm={handleCopy}
            onCancel={closeCopy}
          />
        )}
      </Modal>
    </>
  );
}
