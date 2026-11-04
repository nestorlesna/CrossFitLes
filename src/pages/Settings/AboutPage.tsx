// Página de información: identidad, contacto, licencias, créditos y deslinde de responsabilidad
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Mail, Shield, AlertTriangle, Heart, HardDrive, MessageCircle,
  Youtube, Github, Scale, BookOpen, ExternalLink,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { APP_NAME, APP_VERSION } from '../../utils/constants';
import { openFeedback } from '../../services/feedbackService';

const YOUTUBE_URL = 'https://www.youtube.com/@fitlesuy';
const REPO_URL = 'https://github.com/nestorlesna/CrossFitLes';
const DATASET_URL = 'https://github.com/hasaneyldrm/exercises-dataset';

function openExternal(url: string) {
  window.open(url, '_system', 'noopener,noreferrer');
}

// Fila de enlace dentro de una tarjeta
function LinkRow({ icon, label, detail, onClick }: {
  icon: ReactNode; label: string; detail?: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800/60 transition-colors text-left min-h-[44px]"
    >
      <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <span className="text-sm text-white block">{label}</span>
        {detail && <span className="text-xs text-gray-500 block truncate">{detail}</span>}
      </div>
      <ExternalLink size={14} className="text-gray-600 shrink-0" />
    </button>
  );
}

export function AboutPage() {
  const navigate = useNavigate();

  return (
    <>
      <Header
        title="Acerca de"
        leftAction={
          <button aria-label="Volver"
            onClick={() => navigate(-1)}
            className="text-gray-400 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ChevronLeft size={24} />
          </button>
        }
      />

      <div className="flex flex-col gap-5 p-4 pb-24">

        {/* ── Identidad de la app ── */}
        <div className="flex flex-col items-center gap-3 pt-4 pb-2">
          <img
            src="/logo.png"
            alt="FitLesUY"
            className="w-24 h-24 rounded-full shadow-lg shadow-primary-900/30"
          />
          <div className="text-center">
            <h1 className="text-xl font-black text-white tracking-tight">{APP_NAME}</h1>
            <p className="text-sm text-gray-500 mt-0.5">Versión {APP_VERSION}</p>
            <p className="text-xs text-gray-600 mt-1">App gratuita y de código abierto del canal FitLesUY</p>
          </div>
        </div>

        {/* ── Contacto y enlaces ── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden divide-y divide-gray-800">
          <div className="px-4 py-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Autor</p>
            <p className="text-white font-semibold text-sm">Néstor Lesna</p>
          </div>
          <LinkRow
            icon={<MessageCircle size={16} className="text-green-400" />}
            label="Enviar comentario"
            detail="Errores, ideas o mejoras, por WhatsApp"
            onClick={() => { void openFeedback(); }}
          />
          <LinkRow
            icon={<Youtube size={16} className="text-red-400" />}
            label="Canal de YouTube"
            detail="youtube.com/@fitlesuy"
            onClick={() => openExternal(YOUTUBE_URL)}
          />
          <LinkRow
            icon={<Github size={16} className="text-gray-300" />}
            label="Código fuente"
            detail="github.com/nestorlesna/CrossFitLes"
            onClick={() => openExternal(REPO_URL)}
          />
          <LinkRow
            icon={<Mail size={16} className="text-primary-400" />}
            label="Email"
            detail="nestor.lesna@gmail.com"
            onClick={() => openExternal('mailto:nestor.lesna@gmail.com')}
          />
        </div>

        {/* ── Uso del software ── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={16} className="text-primary-400 shrink-0" />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Uso del software</p>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">
            Esta aplicación es <span className="text-white font-semibold">gratuita y de código abierto</span>,
            pensada para que la comunidad de FitLesUY planifique, registre y siga sus entrenamientos funcionales.
          </p>
          <p className="text-sm text-gray-300 leading-relaxed">
            Se recomienda siempre realizar los ejercicios bajo la supervisión o guía de un
            <span className="text-white font-semibold"> instructor o entrenador certificado</span>.
            La correcta ejecución técnica es fundamental para evitar lesiones.
          </p>
        </div>

        {/* ── Datos y backup ── */}
        <div className="bg-blue-950/30 border border-blue-800/40 rounded-2xl p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-1">
            <HardDrive size={16} className="text-blue-400 shrink-0" />
            <p className="text-xs font-semibold text-blue-400/80 uppercase tracking-wider">Datos y respaldo</p>
          </div>
          <p className="text-sm text-blue-100/70 leading-relaxed">
            Todos tus datos se almacenan <span className="text-white font-semibold">únicamente en este dispositivo</span>.
            La app no tiene cuentas ni recopila datos personales; no existe sincronización con la nube.
          </p>
          <p className="text-sm text-blue-100/70 leading-relaxed">
            Si perdés el dispositivo, lo restaurás a valores de fábrica o desinstalás la aplicación,
            <span className="text-white font-semibold"> todos los datos se perderán de forma irreversible</span> a menos que hayas realizado un respaldo previo.
          </p>
          <div className="mt-1 bg-blue-900/30 border border-blue-700/40 rounded-xl px-3 py-2.5 flex items-start gap-2">
            <AlertTriangle size={14} className="text-blue-300 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-200/80 leading-relaxed">
              <span className="font-bold text-blue-200">Realizá backups periódicos</span> desde
              <span className="font-semibold"> Configuración → Exportar / Importar datos</span>.
              La responsabilidad de resguardar la información es exclusivamente del usuario.
            </p>
          </div>
        </div>

        {/* ── Deslinde de responsabilidad ── */}
        <div className="bg-amber-950/30 border border-amber-800/40 rounded-2xl p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={16} className="text-amber-400 shrink-0" />
            <p className="text-xs font-semibold text-amber-500/80 uppercase tracking-wider">Deslinde de responsabilidad</p>
          </div>
          <p className="text-sm text-amber-200/70 leading-relaxed">
            El autor no se responsabiliza por lesiones, daños físicos o perjuicios de cualquier
            naturaleza que pudieran derivarse del uso de la información registrada en esta aplicación.
          </p>
          <p className="text-sm text-amber-200/70 leading-relaxed">
            Los datos de entrenamiento, pesos, repeticiones y tiempos cargados son de exclusiva
            responsabilidad del usuario. Ante cualquier duda sobre la intensidad o técnica de un
            ejercicio, consultá siempre con un profesional de la salud o del deporte.
          </p>
        </div>

        {/* ── Licencia ── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-1">
              <Scale size={16} className="text-primary-400 shrink-0" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Licencia</p>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              El <span className="text-white font-semibold">código</span> se publica bajo licencia
              <span className="text-white font-semibold"> MIT</span>. El <span className="text-white font-semibold">contenido</span> (ilustraciones
              de ejercicios, clases y challenges) bajo <span className="text-white font-semibold">CC BY 4.0</span>:
              podés reutilizarlo citando a Néstor Lesna / FitLesUY.
            </p>
            <p className="text-xs text-gray-500 leading-relaxed">
              El logo de FitLesUY es la marca del canal y no está incluido en esas licencias.
            </p>
          </div>
          <div className="border-t border-gray-800">
            <button
              onClick={() => navigate('/configuracion/acerca-de/licencias')}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800/60 transition-colors text-left min-h-[44px]"
            >
              <span className="flex-1 text-sm text-white">Licencias de terceros</span>
              <ChevronRight size={16} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* ── Créditos y fuentes de datos ── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen size={16} className="text-primary-400 shrink-0" />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Créditos y fuentes de datos</p>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">
            Para describir ejercicios (nombres, grupos musculares, equipamiento e instrucciones) se usó
            como referencia el <span className="text-white font-semibold">Exercises Dataset</span> de
            Hasan Emir Yıldırım, publicado bajo licencia MIT.
          </p>
          <p className="text-sm text-gray-300 leading-relaxed">
            Las imágenes y animaciones de ese dataset son © Gym visual (gymvisual.com) y
            <span className="text-white font-semibold"> no se incluyen</span> en esta app: todas las
            ilustraciones de ejercicios son propias.
          </p>
          <button
            onClick={() => openExternal(DATASET_URL)}
            className="self-start text-xs text-primary-400 underline underline-offset-2 min-h-[44px] flex items-center gap-1"
          >
            Ver Exercises Dataset <ExternalLink size={12} />
          </button>
        </div>

        {/* ── Pie ── */}
        <div className="flex flex-col items-center gap-1.5 pt-2 pb-4">
          <div className="flex items-center gap-1.5 text-gray-600 text-xs">
            <span>Hecho con</span>
            <Heart size={12} className="text-red-500/70" fill="currentColor" />
            <span>en Tacuarembó, Uruguay</span>
          </div>
          <p className="text-gray-700 text-xs">© {new Date().getFullYear()} Néstor Lesna · Código MIT · Contenido CC BY 4.0</p>
        </div>

      </div>
    </>
  );
}
