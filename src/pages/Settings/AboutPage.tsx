// Página de información, autoría y deslinde de responsabilidad
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Mail, Shield, AlertTriangle, Heart, HardDrive } from 'lucide-react';
import { Header } from '../../components/layout/Header';

export function AboutPage() {
  const navigate = useNavigate();

  return (
    <>
      <Header
        title="Acerca de"
        leftAction={
          <button
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
            src="/icon.svg"
            alt="CrossFit Les"
            className="w-24 h-24 rounded-3xl shadow-lg shadow-primary-900/30"
          />
          <div className="text-center">
            <h1 className="text-xl font-black text-white tracking-tight">CrossFit Les</h1>
            <p className="text-sm text-gray-500 mt-0.5">Registro personal de entrenamiento</p>
          </div>
        </div>

        {/* ── Autor ── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden divide-y divide-gray-800">
          <div className="px-4 py-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Autor</p>
            <p className="text-white font-semibold text-sm">Néstor Lesna</p>
          </div>
          <a
            href="mailto:nestor.lesna@gmail.com"
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800/60 transition-colors"
          >
            <Mail size={16} className="text-primary-400 shrink-0" />
            <span className="text-sm text-primary-400 underline underline-offset-2">nestor.lesna@gmail.com</span>
          </a>
        </div>

        {/* ── Uso personal ── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={16} className="text-primary-400 shrink-0" />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Uso del software</p>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">
            Esta aplicación fue desarrollada para uso <span className="text-white font-semibold">estrictamente personal</span>,
            con el fin de registrar y hacer seguimiento de sesiones de entrenamiento de CrossFit.
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
            No existe sincronización con la nube ni respaldo automático en servidores externos.
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

        {/* ── Copyright ── */}
        <div className="flex flex-col items-center gap-1.5 pt-2 pb-4">
          <div className="flex items-center gap-1.5 text-gray-600 text-xs">
            <span>Hecho con</span>
            <Heart size={12} className="text-red-500/70" fill="currentColor" />
            <span>por Néstor Lesna</span>
          </div>
          <p className="text-gray-700 text-xs">© {new Date().getFullYear()} — Todos los derechos reservados</p>
        </div>

      </div>
    </>
  );
}
