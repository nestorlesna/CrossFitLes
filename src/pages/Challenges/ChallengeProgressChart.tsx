// Gráficos de progreso de un challenge. Se carga bajo demanda (recharts es pesado).
// 1) Volumen real vs. planificado por sesión completada.
// 2) Repeticiones máximas de los tests (sólo challenges de meta).
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChallengeTest } from '../../models/Challenge';
import { ChallengeVolumePoint } from '../../db/repositories/challengeRepo';

interface ChallengeProgressChartProps {
  volume: ChallengeVolumePoint[];
  tests: ChallengeTest[];
  unit: 'reps' | 'seconds';
  color: string;
}

const TOOLTIP_STYLE = {
  contentStyle: { backgroundColor: '#171717', border: '1px solid #404040', borderRadius: '12px' },
  labelStyle: { color: '#fff', fontSize: '11px', marginBottom: '4px' },
  itemStyle: { fontSize: '12px' },
};

const AXIS = { stroke: '#737373', fontSize: 10, tickLine: false, axisLine: false } as const;

export default function ChallengeProgressChart({ volume, tests, unit, color }: ChallengeProgressChartProps) {
  const volumeData = volume.map((p) => ({
    label: `#${p.day_index}`,
    title: p.title,
    real: unit === 'seconds' ? p.actual_seconds : p.actual_reps,
    plan: unit === 'seconds' ? p.planned_seconds : p.planned_reps,
  }));

  const testData = tests
    .filter((t) => t.max_reps !== null && t.max_reps !== undefined)
    .map((t) => ({
      label: t.week === 0 ? 'Inicial' : `Sem. ${t.week}`,
      reps: t.max_reps,
    }));

  const unitLabel = unit === 'seconds' ? 'segundos' : 'repeticiones';

  return (
    <div className="space-y-4">
      <section className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
          Volumen por sesión
        </h3>
        <p className="text-[11px] text-gray-500 mb-3">Total de {unitLabel}: hecho vs. planificado</p>
        {volumeData.length === 0 ? (
          <p className="text-xs text-gray-600 py-8 text-center">
            Completá tu primera sesión para ver el gráfico
          </p>
        ) : (
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis dataKey="label" {...AXIS} />
                <YAxis {...AXIS} width={32} />
                <Tooltip
                  {...TOOLTIP_STYLE}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.title ?? ''}
                />
                <Bar dataKey="real" name="Hecho" fill={color} radius={[4, 4, 0, 0]} />
                <Line
                  type="monotone"
                  dataKey="plan"
                  name="Plan"
                  stroke="#9ca3af"
                  strokeDasharray="4 3"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {testData.length > 0 && (
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
            Repeticiones máximas
          </h3>
          <p className="text-[11px] text-gray-500 mb-3">Test inicial y retests</p>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={testData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis dataKey="label" {...AXIS} />
                <YAxis {...AXIS} width={32} allowDecimals={false} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Line
                  type="monotone"
                  dataKey="reps"
                  name="Máx. reps"
                  stroke={color}
                  strokeWidth={3}
                  dot={{ r: 4, fill: color, strokeWidth: 0 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </div>
  );
}
