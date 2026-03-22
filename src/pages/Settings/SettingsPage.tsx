// Pantalla de configuración con acceso a todos los catálogos
import { useNavigate } from 'react-router-dom';
import {
  Dumbbell,
  Layers,
  Ruler,
  BarChart2,
  Tag,
  Layout,
  Timer,
  ChevronRight,
  ImagePlay,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { BackupSection } from '../../components/export/BackupSection';
import { ResetSection } from '../../components/export/ResetSection';

// Definición de cada entrada del menú de catálogos
const catalogItems = [
  {
    label: 'Grupos musculares',
    icon: Layers,
    path: '/configuracion/grupos-musculares',
  },
  {
    label: 'Equipamiento',
    icon: Dumbbell,
    path: '/configuracion/equipamiento',
  },
  {
    label: 'Unidades de medida',
    icon: Ruler,
    path: '/configuracion/unidades',
  },
  {
    label: 'Niveles de dificultad',
    icon: BarChart2,
    path: '/configuracion/niveles-dificultad',
  },
  {
    label: 'Tags',
    icon: Tag,
    path: '/configuracion/tags',
  },
  {
    label: 'Tipos de sección',
    icon: Layout,
    path: '/configuracion/tipos-seccion',
  },
  {
    label: 'Formatos de trabajo',
    icon: Timer,
    path: '/configuracion/formatos-trabajo',
  },
];

export function SettingsPage() {
  const navigate = useNavigate();

  return (
    <>
      <Header title="Configuración" />

      <div className="p-4 space-y-6">
        {/* Sección de catálogos */}
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
            Catálogos
          </h2>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden divide-y divide-gray-800">
            {catalogItems.map(({ label, icon: Icon, path }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-800/60 transition-colors text-left"
              >
                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-primary-400" />
                </div>
                <span className="flex-1 text-sm text-white">{label}</span>
                <ChevronRight size={16} className="text-gray-600" />
              </button>
            ))}
          </div>
        </section>

        {/* Sección de listados */}
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
            Listados
          </h2>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden divide-y divide-gray-800">
            {/* Imágenes */}
            <button
              onClick={() => navigate('/configuracion/imagenes-ejercicios')}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-800/60 transition-colors text-left"
            >
              <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center shrink-0">
                <ImagePlay size={16} className="text-primary-400" />
              </div>
              <span className="flex-1 text-sm text-white">Imágenes de ejercicios</span>
              <ChevronRight size={16} className="text-gray-600" />
            </button>

            {/* Músculos */}
            <button
              onClick={() => navigate('/configuracion/musculos-ejercicios')}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-800/60 transition-colors text-left"
            >
              <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center shrink-0">
                <Layers size={16} className="text-primary-400" />
              </div>
              <span className="flex-1 text-sm text-white">Ejercicios con grupos musculares</span>
              <ChevronRight size={16} className="text-gray-600" />
            </button>
          </div>
        </section>

        {/* Sección de backup */}
        <BackupSection />

        {/* Sección de reset */}
        <ResetSection />
      </div>
    </>
  );
}
