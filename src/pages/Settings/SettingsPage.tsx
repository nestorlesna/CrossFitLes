// Pantalla de configuración con secciones colapsables
import { useState } from 'react';
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
  Database,
  FileText,
  HardDrive,
  Copy,
  Archive,
  LayoutList,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { BackupSection } from '../../components/export/BackupSection';
import { ClassShareSection } from '../../components/export/ClassShareSection';
import { ResetSection } from '../../components/export/ResetSection';

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

// Cabecera colapsable reutilizable estilo ClassesPage
function SectionHeader({
  icon: Icon,
  title,
  expanded,
  onToggle,
}: {
  icon: React.ElementType;
  title: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-2 py-1"
    >
      <Icon size={16} className="text-primary-400 shrink-0" />
      <h2 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h2>
      <ChevronRight
        size={16}
        className={`text-gray-600 ml-auto transition-transform ${expanded ? 'rotate-90' : ''}`}
      />
    </button>
  );
}

export function SettingsPage() {
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(true);
  const [catalogsOpen, setCatalogsOpen] = useState(false);
  const [listingsOpen, setListingsOpen] = useState(false);
  const [dataMgmtOpen, setDataMgmtOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(true);

  return (
    <>
      <Header title="Configuración" />

      <div className="p-4 space-y-6 pb-24">

        {/* ── Mi perfil ── */}
        <div>
          <SectionHeader icon={User} title="Mi perfil" expanded={profileOpen} onToggle={() => setProfileOpen(!profileOpen)} />
          {profileOpen && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden divide-y divide-gray-800 mt-2">
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
          )}
        </div>

        {/* ── Catálogos ── */}
        <div>
          <SectionHeader icon={Database} title="Catálogos" expanded={catalogsOpen} onToggle={() => setCatalogsOpen(!catalogsOpen)} />
          {catalogsOpen && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden divide-y divide-gray-800 mt-2">
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
          )}
        </div>

        {/* ── Listados ── */}
        <div>
          <SectionHeader icon={FileText} title="Listados" expanded={listingsOpen} onToggle={() => setListingsOpen(!listingsOpen)} />
          {listingsOpen && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden divide-y divide-gray-800 mt-2">
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
              <button
                onClick={() => navigate('/configuracion/ejercicios-duplicados')}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-800/60 transition-colors text-left"
              >
                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center shrink-0">
                  <Copy size={16} className="text-red-400" />
                </div>
                <span className="flex-1 text-sm text-white">Ejercicios duplicados</span>
                <ChevronRight size={16} className="text-gray-600" />
              </button>
              <button
                onClick={() => navigate('/configuracion/clases')}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-800/60 transition-colors text-left"
              >
                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center shrink-0">
                  <LayoutList size={16} className="text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-white block">Clases</span>
                  <span className="text-xs text-gray-600">Ver secciones y copiar entre clases</span>
                </div>
                <ChevronRight size={16} className="text-gray-600" />
              </button>
              <button
                onClick={() => navigate('/configuracion/clases-inactivas')}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-800/60 transition-colors text-left"
              >
                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center shrink-0">
                  <Archive size={16} className="text-yellow-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-white block">Clases inactivas</span>
                  <span className="text-xs text-gray-600">Revisar y eliminar clases archivadas</span>
                </div>
                <ChevronRight size={16} className="text-gray-600" />
              </button>
            </div>
          )}
        </div>

        {/* ── Gestión de datos ── */}
        <div>
          <SectionHeader icon={HardDrive} title="Gestión de datos" expanded={dataMgmtOpen} onToggle={() => setDataMgmtOpen(!dataMgmtOpen)} />
          {dataMgmtOpen && (
            <div className="space-y-4 mt-2">
              <ClassShareSection />
              <BackupSection />
              <ResetSection />
            </div>
          )}
        </div>

        {/* ── Acerca de ── */}
        <div>
          <SectionHeader icon={Info} title="Acerca de" expanded={aboutOpen} onToggle={() => setAboutOpen(!aboutOpen)} />
          {aboutOpen && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden mt-2">
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
          )}
        </div>

      </div>
    </>
  );
}
