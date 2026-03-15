// Pantalla de inicio - dashboard principal
import { Header } from '../../components/layout/Header';
import { Dumbbell } from 'lucide-react';

export function HomePage() {
  return (
    <>
      <Header title="CrossFit Tracker" subtitle="Panel principal" />
      <div className="p-4 space-y-4">
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 text-center">
          <Dumbbell size={48} className="mx-auto text-primary-500 mb-3" />
          <h2 className="text-xl font-bold text-white mb-1">¡Bienvenido!</h2>
          <p className="text-gray-400 text-sm">
            Tu tracker de sesiones CrossFit está listo.
            Navega con los íconos de abajo para comenzar.
          </p>
        </div>

        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Estado del proyecto
          </h3>
          <div className="space-y-2">
            {[
              { fase: 'Fase 0', nombre: 'Scaffolding', done: true },
              { fase: 'Fase 1', nombre: 'Catálogos', done: false },
              { fase: 'Fase 2', nombre: 'Ejercicios', done: false },
              { fase: 'Fase 3', nombre: 'Plantillas', done: false },
              { fase: 'Fase 4', nombre: 'Sesiones', done: false },
              { fase: 'Fase 5', nombre: 'Estadísticas', done: false },
              { fase: 'Fase 6', nombre: 'Exportación', done: false },
            ].map((item) => (
              <div key={item.fase} className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${item.done ? 'bg-green-500' : 'bg-gray-700'}`} />
                <span className="text-xs text-gray-500">{item.fase}</span>
                <span className={`text-sm ${item.done ? 'text-white' : 'text-gray-500'}`}>
                  {item.nombre}
                </span>
                {item.done && <span className="text-xs text-green-500 ml-auto">✓ Completada</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
