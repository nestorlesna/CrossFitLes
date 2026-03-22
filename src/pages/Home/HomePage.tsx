// Pantalla de inicio - dashboard principal
import { useNavigate } from 'react-router-dom';
import { Dumbbell, LayoutTemplate, Calendar, BarChart2 } from 'lucide-react';
import { Header } from '../../components/layout/Header';

const quickActions = [
  { label: 'Nueva sesión',    icon: Calendar,       path: '/sesiones/nueva' },
  { label: 'Ejercicios',      icon: Dumbbell,       path: '/ejercicios'     },
  { label: 'Clases',          icon: LayoutTemplate, path: '/clases'         },
  { label: 'Estadísticas',    icon: BarChart2,      path: '/estadisticas'   },
];

export function HomePage() {
  const navigate = useNavigate();

  return (
    <>
      <Header title="CrossFit Tracker" />

      <div className="p-4 space-y-5">
        {/* Bienvenida */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 text-center">
          <Dumbbell size={44} className="mx-auto text-primary-500 mb-3" />
          <h2 className="text-xl font-bold text-white mb-1">¡Bienvenido!</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Registrá tus sesiones, seguí tus récords y gestioná tu biblioteca de ejercicios.
          </p>
        </div>

        {/* Accesos rápidos */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
            Accesos rápidos
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(({ label, icon: Icon, path }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-gray-800/60 hover:border-gray-700 transition-colors active:scale-95"
              >
                <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center">
                  <Icon size={20} className="text-primary-400" />
                </div>
                <span className="text-sm text-white font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
