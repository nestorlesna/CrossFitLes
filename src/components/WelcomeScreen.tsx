// Pantalla del primer arranque (y de cada versión nueva del descargo): bienvenida + descargo de
// salud con aceptación obligatoria. Al continuar, DbProvider guarda la aceptación y, si la BD
// está vacía, carga los datos base.
import { useState } from 'react';
import { HeartPulse, Loader2 } from 'lucide-react';
import { APP_NAME } from '../utils/constants';
import { HEALTH_DISCLAIMER_POINTS, HEALTH_DISCLAIMER_TITLE } from '../data/healthDisclaimer';

interface WelcomeScreenProps {
  /** Instalación nueva: muestra el texto de bienvenida y avisa que se cargan los datos base */
  firstRun: boolean;
  busy: boolean;
  onAccept: () => void;
}

export function WelcomeScreen({ firstRun, busy, onAccept }: WelcomeScreenProps) {
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="min-h-dvh bg-gray-950 text-white flex flex-col">
      <div className="flex-1 overflow-y-auto px-5 pt-10 pb-6 max-w-lg w-full mx-auto">
        <div className="flex flex-col items-center text-center gap-3 mb-6">
          <img src="/logo.png" alt="" className="w-20 h-20 rounded-full" />
          {firstRun ? (
            <>
              <h1 className="text-xl font-bold">Bienvenido a {APP_NAME}</h1>
              <p className="text-sm text-gray-400 leading-relaxed">
                Registrá tus clases, sesiones y récords. Todo queda guardado en este celular.
              </p>
            </>
          ) : (
            <h1 className="text-xl font-bold">Actualizamos el aviso de salud</h1>
          )}
        </div>

        <section className="bg-amber-950/30 border border-amber-800/40 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <HeartPulse size={18} className="text-amber-400 shrink-0" />
            <h2 className="text-sm font-semibold text-amber-300">{HEALTH_DISCLAIMER_TITLE}</h2>
          </div>
          <ul className="flex flex-col gap-2.5">
            {HEALTH_DISCLAIMER_POINTS.map((point) => (
              <li key={point} className="flex gap-2 text-sm text-amber-100/80 leading-relaxed">
                <span className="text-amber-500 shrink-0">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </section>

        <label className="mt-5 flex items-start gap-3 cursor-pointer select-none min-h-[44px]">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            disabled={busy}
            className="mt-0.5 w-5 h-5 accent-primary-500 shrink-0"
          />
          <span className="text-sm text-gray-200">Leí y acepto</span>
        </label>
      </div>

      <div className="px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 max-w-lg w-full mx-auto">
        <button
          onClick={onAccept}
          disabled={!accepted || busy}
          className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:bg-gray-800 disabled:text-gray-500 text-white text-sm font-bold transition active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {busy && <Loader2 size={16} className="animate-spin" />}
          {busy ? 'Preparando ejercicios y clases…' : 'Continuar'}
        </button>
        {firstRun && !busy && (
          <p className="text-[11px] text-gray-500 text-center mt-2">
            Se cargan los ejercicios y las clases base. No hace falta internet.
          </p>
        )}
      </div>
    </div>
  );
}
