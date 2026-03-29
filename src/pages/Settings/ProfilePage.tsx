// Página de perfil básico del usuario
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, User } from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '../../components/layout/Header';
import {
  UserProfile, Sex, BodyType, ExperienceLevel,
  SEX_LABELS, BODY_TYPE_LABELS, EXPERIENCE_LABELS,
} from '../../models/UserProfile';
import { getProfile, saveProfile, calcAge } from '../../db/repositories/userProfileRepo';

interface FormState {
  full_name: string;
  sex: Sex | '';
  birth_date: string;
  height_cm: string;
  body_type: BodyType | '';
  experience_level: ExperienceLevel | '';
}

const EMPTY: FormState = {
  full_name: '',
  sex: '',
  birth_date: '',
  height_cm: '',
  body_type: '',
  experience_level: '',
};

function fromProfile(p: UserProfile): FormState {
  return {
    full_name:        p.full_name ?? '',
    sex:              (p.sex as Sex | '') ?? '',
    birth_date:       p.birth_date ?? '',
    height_cm:        p.height_cm != null ? String(p.height_cm) : '',
    body_type:        (p.body_type as BodyType | '') ?? '',
    experience_level: (p.experience_level as ExperienceLevel | '') ?? '',
  };
}

export function ProfilePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getProfile()
      .then(p => { if (p) setForm(fromProfile(p)); })
      .catch(() => toast.error('Error al cargar el perfil'))
      .finally(() => setLoading(false));
  }, []);

  const upd = (field: keyof FormState, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveProfile({
        full_name:        form.full_name || undefined,
        sex:              (form.sex as Sex) || undefined,
        birth_date:       form.birth_date || undefined,
        height_cm:        form.height_cm ? Number(form.height_cm) : undefined,
        body_type:        (form.body_type as BodyType) || undefined,
        experience_level: (form.experience_level as ExperienceLevel) || undefined,
      });
      toast.success('Perfil guardado');
    } catch {
      toast.error('Error al guardar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const age = form.birth_date ? calcAge(form.birth_date) : null;

  return (
    <>
      <Header
        title="Mis datos"
        leftAction={
          <button onClick={() => navigate(-1)} className="text-gray-400 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <ChevronLeft size={24} />
          </button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-500" />
        </div>
      ) : (
        <div className="flex flex-col gap-5 p-4 pb-24">

          {/* Avatar decorativo */}
          <div className="flex justify-center pt-2">
            <div className="w-16 h-16 rounded-full bg-primary-600/20 border border-primary-500/30 flex items-center justify-center">
              <User size={28} className="text-primary-400" />
            </div>
          </div>

          {/* ── Nombre ── */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</label>
            <input
              type="text"
              value={form.full_name}
              onChange={e => upd('full_name', e.target.value)}
              placeholder="Tu nombre completo"
              className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"
            />
          </div>

          {/* ── Datos básicos ── */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col gap-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Datos básicos</h3>

            {/* Sexo */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-500">Sexo</label>
              <div className="flex gap-2">
                {(Object.entries(SEX_LABELS) as [Sex, string][]).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => upd('sex', val)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${form.sex === val ? 'bg-primary-600 text-white' : 'bg-gray-800 text-gray-400'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Fecha de nacimiento */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-500">
                Fecha de nacimiento {age !== null && <span className="text-white font-semibold ml-1">({age} años)</span>}
              </label>
              <input
                type="date"
                value={form.birth_date}
                max={new Date().toISOString().split('T')[0]}
                onChange={e => upd('birth_date', e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500"
              />
            </div>

            {/* Altura */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-500">Altura (cm)</label>
              <input
                type="number" inputMode="decimal" min="100" max="250"
                value={form.height_cm}
                onChange={e => upd('height_cm', e.target.value)}
                placeholder="Ej: 175"
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>

          {/* ── Tipo de cuerpo ── */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col gap-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo de cuerpo <span className="font-normal normal-case text-gray-600">(opcional)</span></h3>
            <div className="flex gap-2">
              {(Object.entries(BODY_TYPE_LABELS) as [BodyType, string][]).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => upd('body_type', form.body_type === val ? '' : val)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors ${form.body_type === val ? 'bg-primary-600 text-white' : 'bg-gray-800 text-gray-400'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Ectomorfo: delgado y difícil de ganar masa. Mesomorfo: musculoso y atlético. Endomorfo: tendencia a acumular grasa.
            </p>
          </div>

          {/* ── Nivel de experiencia ── */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col gap-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nivel de experiencia</h3>
            <div className="flex gap-2">
              {(Object.entries(EXPERIENCE_LABELS) as [ExperienceLevel, string][]).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => upd('experience_level', val)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors ${form.experience_level === val ? 'bg-primary-600 text-white' : 'bg-gray-800 text-gray-400'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Guardar ── */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary-600 hover:bg-primary-700 active:scale-[0.98] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary-900/30 disabled:opacity-50"
          >
            {saving ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white" /> : <Save size={20} />}
            Guardar perfil
          </button>
        </div>
      )}
    </>
  );
}
