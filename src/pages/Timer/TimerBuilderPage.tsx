import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Plus, Trash2, Copy, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '../../components/layout/Header';
import { FreeTimerConfig, FreeTimerPreset, PRESET_LABELS } from '../../models/FreeTimer';
import {
  buildForTime, buildAmrap, buildEmom, buildTabata, buildIntervalsFixed, buildIntervalsVariable,
  VariableRound,
} from '../../services/freeTimerPresets';
import { create, update, getById } from '../../db/repositories/freeTimerTemplateRepo';

const PRESET_ORDER: FreeTimerPreset[] = [
  'for_time', 'amrap', 'emom', 'tabata', 'intervals_fixed', 'intervals_variable',
];

function NumberField({ label, value, onChange, suffix }: { label: string; value: number; onChange: (v: number) => void; suffix?: string }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-bold text-gray-500 uppercase">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
          className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500"
        />
        {suffix && <span className="text-xs text-gray-500 shrink-0">{suffix}</span>}
      </div>
    </label>
  );
}

export function TimerBuilderPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [preset, setPreset] = useState<FreeTimerPreset>(
    (searchParams.get('preset') as FreeTimerPreset) || 'for_time'
  );
  const [name, setName] = useState('');

  // For Time
  const [hasCap, setHasCap] = useState(false);
  const [capMinutes, setCapMinutes] = useState(20);
  // AMRAP
  const [amrapMinutes, setAmrapMinutes] = useState(12);
  // EMOM
  const [emomInterval, setEmomInterval] = useState(60);
  const [emomMinutes, setEmomMinutes] = useState(12);
  const [emomLabels, setEmomLabels] = useState('');
  // Tabata
  const [tabataWork, setTabataWork] = useState(20);
  const [tabataRest, setTabataRest] = useState(10);
  const [tabataRounds, setTabataRounds] = useState(8);
  // Intervalos fijos
  const [ifWork, setIfWork] = useState(40);
  const [ifRest, setIfRest] = useState(20);
  const [ifRounds, setIfRounds] = useState(10);
  // Intervalos variables
  const [varRounds, setVarRounds] = useState<VariableRound[]>([{ workSeconds: 40, restSeconds: 20 }]);

  // ── Cargar plantilla existente ──
  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      try {
        const tpl = await getById(id);
        if (cancelled) return;
        if (!tpl) {
          toast.error('Plantilla no encontrada');
          navigate('/timer');
          return;
        }
        const config: FreeTimerConfig = JSON.parse(tpl.config_json);
        setPreset(config.preset);
        setName(config.name);
        const params = config.presetParams as Record<string, any>;

        if (config.preset === 'for_time') {
          setHasCap(Boolean(params.timeCapSeconds));
          if (params.timeCapSeconds) setCapMinutes(Math.round(params.timeCapSeconds / 60));
        } else if (config.preset === 'amrap') {
          setAmrapMinutes(params.minutes ?? 12);
        } else if (config.preset === 'emom') {
          setEmomInterval(params.intervalSeconds ?? 60);
          setEmomMinutes(params.totalMinutes ?? 12);
          setEmomLabels((params.labelsCycle ?? []).join(', '));
        } else if (config.preset === 'tabata') {
          setTabataWork(params.workSeconds ?? 20);
          setTabataRest(params.restSeconds ?? 10);
          setTabataRounds(params.rounds ?? 8);
        } else if (config.preset === 'intervals_fixed') {
          setIfWork(params.workSeconds ?? 40);
          setIfRest(params.restSeconds ?? 20);
          setIfRounds(params.rounds ?? 10);
        } else if (config.preset === 'intervals_variable') {
          setVarRounds(params.rounds ?? [{ workSeconds: 40, restSeconds: 20 }]);
        }
      } catch {
        if (!cancelled) toast.error('Error al cargar la plantilla');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  const defaultName = useMemo(() => PRESET_LABELS[preset], [preset]);

  const buildConfig = (): FreeTimerConfig => {
    const finalName = name.trim() || defaultName;
    switch (preset) {
      case 'for_time':
        return buildForTime({ name: finalName, timeCapSeconds: hasCap ? capMinutes * 60 : null });
      case 'amrap':
        return buildAmrap({ name: finalName, minutes: amrapMinutes });
      case 'emom':
        return buildEmom({
          name: finalName,
          intervalSeconds: emomInterval,
          totalMinutes: emomMinutes,
          labelsCycle: emomLabels.split(',').map((l) => l.trim()).filter(Boolean),
        });
      case 'tabata':
        return buildTabata({ name: finalName, workSeconds: tabataWork, restSeconds: tabataRest, rounds: tabataRounds });
      case 'intervals_fixed':
        return buildIntervalsFixed({ name: finalName, workSeconds: ifWork, restSeconds: ifRest, rounds: ifRounds });
      case 'intervals_variable':
      default:
        return buildIntervalsVariable({ name: finalName, rounds: varRounds });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const config = buildConfig();
      if (isEditing && id) {
        config.id = id;
        await update(id, config);
        toast.success('Plantilla actualizada');
        navigate('/timer');
      } else {
        await create(config);
        navigate(`/timer/${config.id}/correr`);
      }
    } catch {
      toast.error('Error al guardar la plantilla');
    } finally {
      setSaving(false);
    }
  };

  const updateVarRound = (index: number, changes: Partial<VariableRound>) => {
    setVarRounds((rounds) => rounds.map((r, i) => (i === index ? { ...r, ...changes } : r)));
  };
  const removeVarRound = (index: number) => {
    setVarRounds((rounds) => rounds.filter((_, i) => i !== index));
  };
  const duplicateVarRound = (index: number) => {
    setVarRounds((rounds) => [...rounds.slice(0, index + 1), { ...rounds[index] }, ...rounds.slice(index + 1)]);
  };
  const moveVarRound = (index: number, dir: -1 | 1) => {
    setVarRounds((rounds) => {
      const target = index + dir;
      if (target < 0 || target >= rounds.length) return rounds;
      const copy = [...rounds];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary-500" />
      </div>
    );
  }

  return (
    <>
      <Header title={isEditing ? 'Editar timer' : 'Nuevo timer'} />

      <div className="p-4 flex flex-col gap-6 pb-28">
        {/* Selector de preset */}
        <div className="flex flex-wrap gap-2">
          {PRESET_ORDER.map((p) => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              className={`px-3 py-2 rounded-full text-xs font-bold border transition-colors ${
                preset === p
                  ? 'bg-primary-600 border-primary-600 text-white'
                  : 'bg-gray-900 border-gray-800 text-gray-400'
              }`}
            >
              {PRESET_LABELS[p]}
            </button>
          ))}
        </div>

        {/* Nombre */}
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold text-gray-500 uppercase">Nombre</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={defaultName}
            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500"
          />
        </label>

        {/* Campos por preset */}
        {preset === 'for_time' && (
          <div className="flex flex-col gap-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={hasCap}
                onChange={(e) => setHasCap(e.target.checked)}
                className="w-5 h-5 accent-primary-500"
              />
              <span className="text-sm text-gray-300">Time cap</span>
            </label>
            {hasCap && <NumberField label="Minutos" value={capMinutes} onChange={setCapMinutes} suffix="min" />}
          </div>
        )}

        {preset === 'amrap' && (
          <NumberField label="Minutos" value={amrapMinutes} onChange={setAmrapMinutes} suffix="min" />
        )}

        {preset === 'emom' && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="Cada" value={emomInterval} onChange={setEmomInterval} suffix="seg" />
              <NumberField label="Duración total" value={emomMinutes} onChange={setEmomMinutes} suffix="min" />
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-gray-500 uppercase">
                EMOM alternado (opcional)
              </span>
              <input
                type="text"
                value={emomLabels}
                onChange={(e) => setEmomLabels(e.target.value)}
                placeholder="Burpees, Cal Row, Sit-ups"
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500"
              />
              <span className="text-xs text-gray-600">Separado por comas. Rota por minuto.</span>
            </label>
          </div>
        )}

        {preset === 'tabata' && (
          <div className="grid grid-cols-3 gap-3">
            <NumberField label="Trabajo" value={tabataWork} onChange={setTabataWork} suffix="seg" />
            <NumberField label="Descanso" value={tabataRest} onChange={setTabataRest} suffix="seg" />
            <NumberField label="Rondas" value={tabataRounds} onChange={setTabataRounds} />
          </div>
        )}

        {preset === 'intervals_fixed' && (
          <div className="grid grid-cols-3 gap-3">
            <NumberField label="Trabajo" value={ifWork} onChange={setIfWork} suffix="seg" />
            <NumberField label="Descanso" value={ifRest} onChange={setIfRest} suffix="seg" />
            <NumberField label="Rondas" value={ifRounds} onChange={setIfRounds} />
          </div>
        )}

        {preset === 'intervals_variable' && (
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-gray-500 uppercase">Rondas</span>
            {varRounds.map((round, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 w-5 shrink-0">{i + 1}</span>
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <NumberField
                    label="Trabajo"
                    value={round.workSeconds}
                    onChange={(v) => updateVarRound(i, { workSeconds: v })}
                    suffix="seg"
                  />
                  <NumberField
                    label="Descanso"
                    value={round.restSeconds}
                    onChange={(v) => updateVarRound(i, { restSeconds: v })}
                    suffix="seg"
                  />
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button onClick={() => moveVarRound(i, -1)} disabled={i === 0} className="text-gray-500 disabled:opacity-20">
                    <ChevronUp size={16} />
                  </button>
                  <button onClick={() => moveVarRound(i, 1)} disabled={i === varRounds.length - 1} className="text-gray-500 disabled:opacity-20">
                    <ChevronDown size={16} />
                  </button>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button onClick={() => duplicateVarRound(i)} className="text-gray-500 hover:text-white">
                    <Copy size={16} />
                  </button>
                  <button
                    onClick={() => removeVarRound(i)}
                    disabled={varRounds.length <= 1}
                    className="text-gray-500 hover:text-red-400 disabled:opacity-20"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={() => setVarRounds((r) => [...r, { workSeconds: 40, restSeconds: 20 }])}
              className="flex items-center justify-center gap-2 border border-dashed border-gray-700 text-gray-400 rounded-xl py-3 text-sm font-bold"
            >
              <Plus size={16} />
              Agregar ronda
            </button>
          </div>
        )}
      </div>

      <div className="fixed bottom-16 left-0 right-0 p-4 bg-gray-950/95 border-t border-gray-800 safe-bottom">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-xl py-4 font-bold disabled:opacity-50"
        >
          {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Guardar e iniciar'}
        </button>
      </div>
    </>
  );
}
