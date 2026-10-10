// Challenges: los que están en curso arriba y el catálogo completo abajo
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, CheckCircle2, CalendarDays, Repeat, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '../../components/layout/Header';
import { PlansTabs } from '../../components/plans/PlansTabs';
import { TrainingPlan } from '../../models/TrainingPlan';
import { getChallenges, getChallenge } from '../../data/challenges';
import { LEVEL_LABEL } from '../../services/challengeEngine';
import { ChallengeLevel } from '../../models/Challenge';
import * as challengeRepo from '../../db/repositories/challengeRepo';

export function ChallengesPage() {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<TrainingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    challengeRepo
      .getEnrollments()
      .then(setEnrollments)
      .catch((err) => {
        console.error(err);
        toast.error('Error al cargar los challenges');
      })
      .finally(() => setLoading(false));
  }, []);

  const active = enrollments.filter((e) => e.status === 'active');
  const completedCodes = new Set(
    enrollments.filter((e) => e.status === 'completed').map((e) => e.challenge_code)
  );
  const activeCodes = new Set(active.map((e) => e.challenge_code));

  return (
    <>
      <Header title="Challenges" />

      <div className="px-4 py-4 space-y-5 pb-24">
        <PlansTabs active="challenges" />

        {/* ── En curso ── */}
        {!loading && active.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">En curso</h2>
            {active.map((plan) => {
              const def = getChallenge(plan.challenge_code);
              const total = plan.training_days ?? 0;
              const done = plan.completed_days ?? 0;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              return (
                <button
                  key={plan.id}
                  onClick={() => navigate(`/challenges/${plan.challenge_code}`)}
                  className="w-full text-left bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${def?.color ?? '#6b7280'}22` }}
                    >
                      <Trophy size={20} style={{ color: def?.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-white font-semibold truncate">{plan.name}</h3>
                      <p className="text-xs text-gray-500">
                        {plan.challenge_level
                          ? LEVEL_LABEL[plan.challenge_level as ChallengeLevel]
                          : '30 días'}
                        {plan.challenge_easy === 1 && ' · Versión fácil'}
                      </p>
                    </div>
                    <ChevronRight size={18} className="text-gray-600 shrink-0" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-[width] duration-300"
                        style={{ width: `${pct}%`, backgroundColor: def?.color }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 tabular-nums">
                      {done}/{total}
                    </span>
                  </div>
                </button>
              );
            })}
          </section>
        )}

        {/* ── Catálogo ── */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Catálogo</h2>
          <div className="grid grid-cols-1 gap-3">
            {getChallenges().map((def) => (
              <button
                key={def.code}
                onClick={() => navigate(`/challenges/${def.code}`)}
                className="w-full text-left bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors flex items-center gap-3"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${def.color}22` }}
                >
                  {def.kind === 'meta_reps' ? (
                    <Repeat size={20} style={{ color: def.color }} />
                  ) : (
                    <CalendarDays size={20} style={{ color: def.color }} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold truncate">{def.name}</h3>
                    {activeCodes.has(def.code) ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-600/20 text-primary-400 border border-primary-700 shrink-0">
                        En curso
                      </span>
                    ) : completedCodes.has(def.code) ? (
                      <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                    ) : null}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{def.summary}</p>
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    {def.kind === 'meta_reps' ? '6 semanas · 3 sesiones por semana' : '30 días'} ·{' '}
                    {def.equipment}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
