// Licencias de las bibliotecas de código abierto que usa la app.
// La lista se genera con `npm run licenses` (scripts/gen-third-party.mjs).
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ExternalLink } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import licenses from '../../data/thirdPartyLicenses.json';

const NOTICES_URL = 'https://github.com/nestorlesna/CrossFitLes/blob/master/THIRD_PARTY_NOTICES.md';

function openExternal(url: string) {
  window.open(url, '_system', 'noopener,noreferrer');
}

export function ThirdPartyLicensesPage() {
  const navigate = useNavigate();

  return (
    <>
      <Header
        title="Licencias de terceros"
        leftAction={
          <button aria-label="Volver"
            onClick={() => navigate(-1)}
            className="text-gray-400 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ChevronLeft size={24} />
          </button>
        }
      />

      <div className="flex flex-col gap-4 p-4 pb-24">
        <p className="text-sm text-gray-400 leading-relaxed">
          FitLesUY está construida con estas bibliotecas de código abierto (y sus dependencias).
          Gracias a quienes las mantienen.
        </p>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden divide-y divide-gray-800">
          {licenses.map(lib => (
            <button
              key={lib.name}
              onClick={() => lib.url && openExternal(lib.url)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800/60 transition-colors text-left min-h-[44px]"
            >
              <div className="flex-1 min-w-0">
                <span className="text-sm text-white block truncate">{lib.name}</span>
                <span className="text-xs text-gray-500">v{lib.version}</span>
              </div>
              <span className="text-xs font-semibold text-primary-400 bg-primary-500/10 rounded-md px-2 py-0.5 shrink-0">
                {lib.license}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={() => openExternal(NOTICES_URL)}
          className="self-start text-xs text-primary-400 underline underline-offset-2 min-h-[44px] flex items-center gap-1"
        >
          Ver los textos completos de las licencias <ExternalLink size={12} />
        </button>
      </div>
    </>
  );
}
