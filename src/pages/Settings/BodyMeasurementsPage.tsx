// Página de medidas corporales: historial + formulario para nueva medición
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Trash2, ChevronDown, ChevronUp, Scale, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '../../components/layout/Header';
import { Modal } from '../../components/ui/Modal';
import { BodyMeasurement } from '../../models/UserProfile';
import { Sex } from '../../models/UserProfile';
import {
  getMeasurements, addMeasurement, deleteMeasurement,
  getProfile, calcBMI, calcLeanMass,
} from '../../db/repositories/userProfileRepo';

// ── Fórmula U.S. Navy para % grasa corporal ──────────────────────────────────
function calcNavyBodyFat(
  sex: Sex | undefined,
  heightCm: number | undefined,
  neckCm: number | undefined,
  abdomenCm: number | undefined,  // hombres
  waistCm: number | undefined,    // mujeres
  hipCm: number | undefined,      // mujeres
): number | undefined {
  if (!heightCm || !neckCm || heightCm <= 0 || neckCm <= 0) return undefined;
  if (sex === 'male') {
    if (!abdomenCm || abdomenCm <= neckCm) return undefined;
    const bf = 86.010 * Math.log10(abdomenCm - neckCm) - 70.041 * Math.log10(heightCm) + 36.76;
    return bf > 0 ? Math.round(bf * 10) / 10 : undefined;
  }
  if (sex === 'female') {
    if (!waistCm || !hipCm || (waistCm + hipCm) <= neckCm) return undefined;
    const bf = 163.205 * Math.log10(waistCm + hipCm - neckCm) - 97.684 * Math.log10(heightCm) - 78.387;
    return bf > 0 ? Math.round(bf * 10) / 10 : undefined;
  }
  return undefined;
}

// ── Formulario de nueva medición ─────────────────────────────────────────────

interface MeasurementForm {
  measurement_date: string;
  weight_kg: string;
  body_fat_percentage: string;
  neck_cm: string;
  shoulders_cm: string;
  chest_cm: string;
  bicep_relaxed_cm: string;
  bicep_contracted_cm: string;
  forearm_cm: string;
  waist_cm: string;
  abdomen_cm: string;
  hip_cm: string;
  glutes_cm: string;
  thigh_cm: string;
  mid_thigh_cm: string;
  calf_cm: string;
  notes: string;
}

const EMPTY_FORM: MeasurementForm = {
  measurement_date: new Date().toISOString().split('T')[0],
  weight_kg: '', body_fat_percentage: '',
  neck_cm: '', shoulders_cm: '', chest_cm: '',
  bicep_relaxed_cm: '', bicep_contracted_cm: '', forearm_cm: '',
  waist_cm: '', abdomen_cm: '',
  hip_cm: '', glutes_cm: '', thigh_cm: '', mid_thigh_cm: '', calf_cm: '',
  notes: '',
};

function num(s: string): number | undefined {
  const n = parseFloat(s);
  return isNaN(n) ? undefined : n;
}

// Componente campo numérico reutilizable
function Field({ label, value, onChange, placeholder = '—' }: {
  label: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-500">{label}</label>
      <input
        type="number" inputMode="decimal" min="0"
        value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
      />
    </div>
  );
}

// ── Tarjeta de medición en el historial ──────────────────────────────────────

function MeasurementCard({
  m, heightCm, onDelete,
}: { m: BodyMeasurement; heightCm?: number; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);

  const bmi = m.weight_kg && heightCm ? calcBMI(m.weight_kg, heightCm) : null;
  const lean = m.weight_kg && m.body_fat_percentage
    ? calcLeanMass(m.weight_kg, m.body_fat_percentage) : null;

  const measureGroups = [
    {
      label: 'Parte superior',
      rows: [
        ['Cuello', m.neck_cm], ['Hombros', m.shoulders_cm], ['Pecho', m.chest_cm],
        ['Bíceps relaj.', m.bicep_relaxed_cm], ['Bíceps contra.', m.bicep_contracted_cm],
        ['Antebrazo', m.forearm_cm],
      ],
    },
    {
      label: 'Parte media',
      rows: [['Cintura', m.waist_cm], ['Abdomen', m.abdomen_cm]],
    },
    {
      label: 'Parte inferior',
      rows: [
        ['Cadera', m.hip_cm], ['Glúteos', m.glutes_cm],
        ['Muslo (ancho)', m.thigh_cm], ['Muslo medio', m.mid_thigh_cm],
        ['Pantorrilla', m.calf_cm],
      ],
    },
  ];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      {/* Cabecera */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3.5 gap-3 hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex flex-col items-start">
          <span className="text-sm font-bold text-white">{m.measurement_date}</span>
          <div className="flex gap-3 mt-0.5 flex-wrap">
            {m.weight_kg && <span className="text-xs text-gray-400">{m.weight_kg} kg</span>}
            {m.waist_cm && <span className="text-xs text-gray-400">Cintura {m.waist_cm} cm</span>}
            {bmi && <span className="text-xs text-gray-400">IMC {bmi.toFixed(1)}</span>}
            {m.body_fat_percentage && <span className="text-xs text-gray-400">Grasa {m.body_fat_percentage}%</span>}
          </div>
        </div>
        {expanded ? <ChevronUp size={16} className="text-gray-500 shrink-0" /> : <ChevronDown size={16} className="text-gray-500 shrink-0" />}
      </button>

      {/* Detalle expandido */}
      {expanded && (
        <div className="px-4 pb-4 flex flex-col gap-4 border-t border-gray-800">
          {/* Métricas calculadas */}
          {(bmi || lean) && (
            <div className="flex gap-3 pt-3 flex-wrap">
              {bmi && (
                <div className="flex-1 bg-gray-800 rounded-xl px-3 py-2 text-center min-w-[80px]">
                  <p className="text-xs text-gray-500">IMC</p>
                  <p className="text-lg font-black text-white">{bmi.toFixed(1)}</p>
                  <p className="text-xs text-gray-600">{bmiCategory(bmi)}</p>
                </div>
              )}
              {lean && (
                <div className="flex-1 bg-gray-800 rounded-xl px-3 py-2 text-center min-w-[80px]">
                  <p className="text-xs text-gray-500">Masa magra</p>
                  <p className="text-lg font-black text-white">{lean.toFixed(1)}</p>
                  <p className="text-xs text-gray-600">kg</p>
                </div>
              )}
              {m.body_fat_percentage && (
                <div className="flex-1 bg-gray-800 rounded-xl px-3 py-2 text-center min-w-[80px]">
                  <p className="text-xs text-gray-500">Grasa</p>
                  <p className="text-lg font-black text-white">{m.body_fat_percentage}%</p>
                  <p className="text-xs text-gray-600">corporal</p>
                </div>
              )}
            </div>
          )}

          {/* Medidas por grupo */}
          {measureGroups.map(g => {
            const filled = g.rows.filter(([, v]) => v != null);
            if (!filled.length) return null;
            return (
              <div key={g.label}>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{g.label}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {filled.map(([label, val]) => (
                    <div key={label as string} className="flex justify-between items-center py-1 border-b border-gray-800/60">
                      <span className="text-xs text-gray-400">{label as string}</span>
                      <span className="text-sm font-semibold text-white">{val} cm</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {m.notes && (
            <p className="text-xs text-gray-500 italic">{m.notes}</p>
          )}

          {/* Borrar */}
          <button
            onClick={onDelete}
            className="flex items-center gap-2 text-red-500/70 text-xs hover:text-red-400 transition-colors self-end"
          >
            <Trash2 size={14} /> Eliminar medición
          </button>
        </div>
      )}
    </div>
  );
}

function bmiCategory(bmi: number): string {
  if (bmi < 18.5) return 'Bajo peso';
  if (bmi < 25)   return 'Normal';
  if (bmi < 30)   return 'Sobrepeso';
  return 'Obesidad';
}

// ── Página principal ─────────────────────────────────────────────────────────

export function BodyMeasurementsPage() {
  const navigate = useNavigate();
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [heightCm, setHeightCm] = useState<number | undefined>();
  const [sex, setSex] = useState<Sex | undefined>();
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<MeasurementForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function load() {
    try {
      const [ms, profile] = await Promise.all([getMeasurements(), getProfile()]);
      setMeasurements(ms);
      if (profile?.height_cm) setHeightCm(profile.height_cm);
      if (profile?.sex) setSex(profile.sex);
    } catch {
      toast.error('Error al cargar medidas');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const upd = (field: keyof MeasurementForm, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  // Estimación U.S. Navy: se recalcula cada vez que cambian las medidas relevantes
  const navyEstimate = useMemo(() => calcNavyBodyFat(
    sex,
    heightCm,
    num(form.neck_cm),
    num(form.abdomen_cm),
    num(form.waist_cm),
    num(form.hip_cm),
  ), [sex, heightCm, form.neck_cm, form.abdomen_cm, form.waist_cm, form.hip_cm]);

  const handleSave = async () => {
    if (!form.measurement_date) {
      toast.error('Ingresá la fecha de medición');
      return;
    }
    setSaving(true);
    try {
      await addMeasurement({
        measurement_date:    form.measurement_date,
        weight_kg:           num(form.weight_kg),
        body_fat_percentage: num(form.body_fat_percentage),
        neck_cm:             num(form.neck_cm),
        shoulders_cm:        num(form.shoulders_cm),
        chest_cm:            num(form.chest_cm),
        bicep_relaxed_cm:    num(form.bicep_relaxed_cm),
        bicep_contracted_cm: num(form.bicep_contracted_cm),
        forearm_cm:          num(form.forearm_cm),
        waist_cm:            num(form.waist_cm),
        abdomen_cm:          num(form.abdomen_cm),
        hip_cm:              num(form.hip_cm),
        glutes_cm:           num(form.glutes_cm),
        thigh_cm:            num(form.thigh_cm),
        mid_thigh_cm:        num(form.mid_thigh_cm),
        calf_cm:             num(form.calf_cm),
        notes:               form.notes || undefined,
      });
      toast.success('Medición guardada');
      setForm(EMPTY_FORM);
      setShowForm(false);
      await load();
    } catch {
      toast.error('Error al guardar la medición');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMeasurement(deleteId);
      toast.success('Medición eliminada');
      setDeleteId(null);
      await load();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  return (
    <>
      <Header
        title="Medidas corporales"
        leftAction={
          <button onClick={() => navigate(-1)} className="text-gray-400 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <ChevronLeft size={24} />
          </button>
        }
        rightAction={
          <button onClick={() => setShowForm(s => !s)} className="text-primary-400 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <Plus size={24} />
          </button>
        }
      />

      <div className="flex flex-col gap-4 p-4 pb-24">

        {/* ── Formulario nueva medición ── */}
        {showForm && (
          <div className="bg-gray-900 border border-primary-500/30 rounded-2xl p-4 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Scale size={16} className="text-primary-400" /> Nueva medición
            </h3>

            {/* Fecha */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Fecha</label>
              <input
                type="date" value={form.measurement_date}
                max={new Date().toISOString().split('T')[0]}
                onChange={e => upd('measurement_date', e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
              />
            </div>

            {/* Peso y grasa */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Peso (kg)"        value={form.weight_kg}          onChange={v => upd('weight_kg', v)} />
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">% Grasa corporal</label>
                <input
                  type="number" inputMode="decimal" min="0" max="70"
                  value={form.body_fat_percentage}
                  onChange={e => upd('body_fat_percentage', e.target.value)}
                  placeholder="—"
                  className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
                />
                {navyEstimate !== undefined && (
                  <button
                    type="button"
                    onClick={() => upd('body_fat_percentage', String(navyEstimate))}
                    className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 transition-colors self-start mt-0.5"
                  >
                    <Wand2 size={11} />
                    Est. Navy: {navyEstimate}%
                  </button>
                )}
              </div>
            </div>

            {/* Parte superior */}
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider -mb-1">Parte superior</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Cuello (cm)"            value={form.neck_cm}             onChange={v => upd('neck_cm', v)} />
              <Field label="Hombros (cm)"           value={form.shoulders_cm}        onChange={v => upd('shoulders_cm', v)} />
              <Field label="Pecho (cm)"             value={form.chest_cm}            onChange={v => upd('chest_cm', v)} />
              <Field label="Bíceps relajado (cm)"   value={form.bicep_relaxed_cm}    onChange={v => upd('bicep_relaxed_cm', v)} />
              <Field label="Bíceps contraído (cm)"  value={form.bicep_contracted_cm} onChange={v => upd('bicep_contracted_cm', v)} />
              <Field label="Antebrazo (cm)"         value={form.forearm_cm}          onChange={v => upd('forearm_cm', v)} />
            </div>

            {/* Parte media */}
            <div className="flex items-center justify-between -mb-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Parte media</p>
              {navyEstimate !== undefined && (
                <span className="text-xs text-primary-500/70">usado en fórmula Navy</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Cintura (cm)"  value={form.waist_cm}   onChange={v => upd('waist_cm', v)} />
              <Field label="Abdomen (cm)"  value={form.abdomen_cm} onChange={v => upd('abdomen_cm', v)} />
            </div>

            {/* Parte inferior */}
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider -mb-1">Parte inferior</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Cadera (cm)"         value={form.hip_cm}       onChange={v => upd('hip_cm', v)} />
              <Field label="Glúteos (cm)"        value={form.glutes_cm}    onChange={v => upd('glutes_cm', v)} />
              <Field label="Muslo ancho (cm)"    value={form.thigh_cm}     onChange={v => upd('thigh_cm', v)} />
              <Field label="Muslo medio (cm)"    value={form.mid_thigh_cm} onChange={v => upd('mid_thigh_cm', v)} />
              <Field label="Pantorrilla (cm)"    value={form.calf_cm}      onChange={v => upd('calf_cm', v)} />
            </div>

            {/* Notas */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Notas</label>
              <input
                type="text" value={form.notes}
                onChange={e => upd('notes', e.target.value)}
                placeholder="Observaciones..."
                className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"
              />
            </div>

            {/* Indicación sobre la estimación */}
            {!navyEstimate && (sex === 'male' || sex === 'female') && heightCm && (
              <p className="text-xs text-gray-600">
                Para estimar % grasa (fórmula U.S. Navy) ingresá:{' '}
                {sex === 'male'
                  ? 'Cuello + Abdomen'
                  : 'Cuello + Cintura + Cadera'
                }.
              </p>
            )}
            <p className="text-xs text-gray-600">Tomá las medidas siempre en las mismas condiciones (misma hora, idealmente en ayunas).</p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-3 rounded-xl bg-gray-800 text-gray-300 text-sm font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 rounded-xl bg-primary-600 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white" /> : null}
                Guardar
              </button>
            </div>
          </div>
        )}

        {/* ── Historial ── */}
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-500" />
          </div>
        ) : measurements.length === 0 ? (
          <div className="bg-gray-900/50 border border-gray-800 border-dashed rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
            <Scale size={36} className="text-gray-700 opacity-30" />
            <p className="text-gray-500 text-sm">Aún no hay mediciones registradas.</p>
            <p className="text-gray-600 text-xs">Presioná el <span className="text-primary-500">+</span> para agregar la primera.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {measurements.map(m => (
              <MeasurementCard
                key={m.id}
                m={m}
                heightCm={heightCm}
                onDelete={() => setDeleteId(m.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal confirmación borrado */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Eliminar medición">
        <div className="flex flex-col gap-4">
          <p className="text-gray-300 text-sm">¿Eliminás esta medición? La acción no se puede deshacer.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteId(null)} className="flex-1 py-3 rounded-xl bg-gray-800 text-gray-300 text-sm font-semibold">Cancelar</button>
            <button onClick={handleDelete} className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-semibold">Eliminar</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
