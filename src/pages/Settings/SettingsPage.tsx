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
  Info,
  User,
  Scale,
  Camera,
  Video,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { BackupSection } from '../../components/export/BackupSection';
import { ClassShareSection } from '../../components/export/ClassShareSection';
import { ClassSeederSection } from '../../components/export/ClassSeederSection';
import { MuscleSeederSection } from '../../components/export/MuscleSeederSection';
import { VideoSeederSection } from '../../components/export/VideoSeederSection';
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

        {/* ── Mi perfil ── */}
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
            Mi perfil
          </h2>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden divide-y divide-gray-800">
            <button
              onClick={() => navigate('/configuracion/perfil')}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-800/60 transition-colors text-left"
            >
              <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center shrink-0">
                <User size={16} className="text-primary-400" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm text-white block">Mis datos</span>
                <span className="text-xs text-gray-600">Sexo, edad, altura, nivel de experiencia</span>
              </div>
              <ChevronRight size={16} className="text-gray-600" />
            </button>
            <button
              onClick={() => navigate('/configuracion/medidas-corporales')}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-800/60 transition-colors text-left"
            >
              <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center shrink-0">
                <Scale size={16} className="text-primary-400" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm text-white block">Medidas corporales</span>
                <span className="text-xs text-gray-600">Peso, composición, circunferencias</span>
              </div>
              <ChevronRight size={16} className="text-gray-600" />
            </button>
            <button
              onClick={() => navigate('/configuracion/fotos-progreso')}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-800/60 transition-colors text-left"
            >
              <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center shrink-0">
                <Camera size={16} className="text-primary-400" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm text-white block">Fotos de progreso</span>
                <span className="text-xs text-gray-600">Frente, perfil y espalda</span>
              </div>
              <ChevronRight size={16} className="text-gray-600" />
            </button>
          </div>
        </section>

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

            {/* Videos */}
            <button
              onClick={() => navigate('/configuracion/videos-ejercicios')}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-800/60 transition-colors text-left"
            >
              <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center shrink-0">
                <Video size={16} className="text-primary-400" />
              </div>
              <span className="flex-1 text-sm text-white">Ejercicios con videos</span>
              <ChevronRight size={16} className="text-gray-600" />
            </button>
          </div>
        </section>

        {/* Compartir clases entre usuarios */}
        <ClassShareSection />

        {/* Clases predefinidas del profesor */}
        <ClassSeederSection />

        {/* Actualizar grupos musculares */}
        <MuscleSeederSection />

        {/* Asignar videos a ejercicios */}
        <VideoSeederSection />

        {/* Sección de backup */}
        <BackupSection />

        {/* Sección de reset */}
        <ResetSection />

        {/* Acerca de */}
        <section>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <button
              onClick={() => navigate('/configuracion/acerca-de')}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-800/60 transition-colors text-left"
            >
              <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center shrink-0">
                <Info size={16} className="text-primary-400" />
              </div>
              <span className="flex-1 text-sm text-white">Acerca de CrossFit Les</span>
              <ChevronRight size={16} className="text-gray-600" />
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
