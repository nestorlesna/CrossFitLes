// Calendario mensual de un plan: cada celda muestra el estado del día programado
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PlanDay } from '../../models/TrainingPlan';

interface PlanCalendarProps {
  days: PlanDay[];
  month: Date;
  onMonthChange: (month: Date) => void;
  onSelectDay: (day: PlanDay) => void;
  selectedDayId?: string;
}

// Color del punto según el estado del día
function dotClass(day: PlanDay): string {
  if (day.day_type === 'rest') return 'bg-gray-600';
  if (day.status === 'completed') return 'bg-green-500';
  if (day.status === 'skipped') return 'bg-red-500/70';
  if (!day.class_template_id) return 'bg-gray-600 ring-1 ring-gray-500';
  return 'bg-primary-500';
}

export function PlanCalendar({
  days,
  month,
  onMonthChange,
  onSelectDay,
  selectedDayId,
}: PlanCalendarProps) {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const monthDays = eachDayOfInterval({ start, end });
  const firstDayOfWeek = (getDay(start) + 6) % 7; // lunes como primer día

  // Índice por fecha para pintar rápido cada celda
  const byDate = new Map<string, PlanDay[]>();
  for (const d of days) {
    if (!d.scheduled_date) continue;
    const list = byDate.get(d.scheduled_date) ?? [];
    list.push(d);
    byDate.set(d.scheduled_date, list);
  }

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      {/* Navegación del mes */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <button
          aria-label="Mes anterior"
          onClick={() => onMonthChange(subMonths(month, 1))}
          className="p-2 text-gray-400 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-white font-medium capitalize">
          {format(month, 'MMMM yyyy', { locale: es })}
        </span>
        <button
          aria-label="Mes siguiente"
          onClick={() => onMonthChange(addMonths(month, 1))}
          className="p-2 text-gray-400 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Encabezados de días */}
      <div className="grid grid-cols-7 border-b border-gray-800">
        {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'].map((d) => (
          <div key={d} className="text-center text-xs text-gray-500 py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Grid de días */}
      <div className="grid grid-cols-7">
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="py-3" />
        ))}

        {monthDays.map((date) => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const dayList = byDate.get(dateStr) ?? [];
          const first = dayList[0];
          const isToday = dateStr === todayStr;
          const isSelected = !!first && first.id === selectedDayId;

          return (
            <button
              key={dateStr}
              onClick={() => first && onSelectDay(first)}
              disabled={!first}
              aria-label={
                first
                  ? `${format(date, "d 'de' MMMM", { locale: es })}: ${
                      first.title || first.template_name || 'sin asignar'
                    }`
                  : format(date, "d 'de' MMMM", { locale: es })
              }
              className={`flex flex-col items-center py-2 px-1 min-h-[52px] transition-colors ${
                isSelected ? 'bg-primary-600/20' : first ? 'hover:bg-gray-800' : ''
              }`}
            >
              <span
                className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                  isToday
                    ? 'bg-primary-600 text-white'
                    : first
                    ? 'text-gray-200'
                    : 'text-gray-600'
                }`}
              >
                {format(date, 'd')}
              </span>
              <span className="h-2 mt-0.5 flex items-center gap-0.5">
                {dayList.slice(0, 3).map((d) => (
                  <span key={d.id} className={`w-1.5 h-1.5 rounded-full ${dotClass(d)}`} />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      {/* Referencia de colores */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 border-t border-gray-800 text-[11px] text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary-500" /> Programado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Completado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500/70" /> Salteado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-600" /> Descanso / sin asignar
        </span>
      </div>
    </div>
  );
}

