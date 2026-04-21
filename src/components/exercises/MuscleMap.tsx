import React from 'react';

/**
 * MuscleMap component: High-fidelity anatomical representation (Front and Back).
 * Each muscle section is an independent path mapped to the new granular catalog.
 */

interface MuscleMapProps {
  primaryMuscles?: string[]; // Array of muscle group names or IDs
  secondaryMuscles?: string[]; // Array of muscle group names or IDs
  onMuscleClick?: (muscleName: string) => void;
  className?: string;
  size?: number | string;
  interactive?: boolean;
}

// Expansión de nombres de catálogo → nombres granulares del SVG
// Los músculos se guardan en BD con nombres simplificados (ej: 'Deltoides')
// pero el SVG usa nombres granulares (ej: 'Deltoides anterior').
const CATALOG_TO_SVG: Record<string, string[]> = {
  'deltoides':        ['Deltoides anterior', 'Deltoides lateral', 'Deltoides posterior'],
  'cuádriceps':       ['Recto femoral', 'Vasto lateral', 'Vasto medial', 'Vasto intermedio'],
  'glúteos':          ['Glúteo mayor', 'Glúteo medio'],
  'dorsales':         ['Dorsal ancho'],
  'trapecio':         ['Trapecio (superior)', 'Trapecio (medio)', 'Trapecio (inferior)'],
  'bíceps':           ['Bíceps braquial', 'Braquial anterior'],
  'tríceps':          ['Tríceps braquial'],
  'pantorrillas':     ['Gastrocnemio (gemelos)', 'Sóleo'],
  'core/abdominales': ['Recto abdominal', 'Oblicuo externo', 'Oblicuo interno', 'Erectores espinales'],
  'antebrazos':       ['Flexores antebrazo', 'Extensores antebrazo', 'Braquiorradial'],
  'pectorales':       ['Pectoral mayor', 'Pectoral menor'],
  'isquiotibiales':   ['Bíceps femoral', 'Semitendinoso', 'Semimembranoso'],
};

// Expande un array de nombres (catálogo o granulares) a nombres granulares SVG
function expandMuscleNames(names: string[]): string[] {
  const result: string[] = [];
  for (const name of names) {
    const key = name.toLowerCase().trim();
    if (CATALOG_TO_SVG[key]) {
      result.push(...CATALOG_TO_SVG[key]);
    } else {
      result.push(name);
    }
  }
  return result;
}

export function MuscleMap({
  primaryMuscles = [],
  secondaryMuscles = [],
  onMuscleClick,
  className = '',
  size = '100%',
  interactive = false,
}: MuscleMapProps) {
  // Normalize names for comparison
  const normalize = (name: string) => name.toLowerCase().trim();
  const highlightedPrimary = expandMuscleNames(primaryMuscles).map(normalize);
  const highlightedSecondary = expandMuscleNames(secondaryMuscles).map(normalize);

  const getMuscleColor = (muscleNames: string[]) => {
    const isPrimary = muscleNames.some(msg => highlightedPrimary.includes(normalize(msg)));
    const isSecondary = muscleNames.some(msg => highlightedSecondary.includes(normalize(msg)));

    if (isPrimary) return '#ef4444'; // Red-500
    if (isSecondary) return '#f59e0b'; // Amber-500
    return '#374151'; // Gray-700
  };

  const handleMuscleClick = (muscleName: string) => {
    if (interactive && onMuscleClick) {
      onMuscleClick(muscleName);
    }
  };

  const muscleStyle = interactive ? { cursor: 'pointer', transition: 'fill 0.2s ease' } : {};

  return (
    <div className={`flex flex-col md:flex-row justify-around items-center gap-6 ${className}`} style={{ width: size, maxWidth: '100%' }}>
      
      {/* VISTA FRONTAL (ANTERIOR) */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Vista Frontal</span>
        <svg viewBox="0 0 200 400" className="h-[320px] w-auto drop-shadow-xl">
          <g id="front-body" fill="#1f2937" stroke="#111827" strokeWidth="0.8">
            {/* Cabeza y cuello */}
            <path d="M85,20 Q100,10 115,20 L115,40 Q100,50 85,40 Z" fill={getMuscleColor(['Cabeza y cuello'])} onClick={() => handleMuscleClick('Cabeza y cuello')} style={muscleStyle} />
            <path d="M90,40 L92,55 L108,55 L110,40 Z" fill={getMuscleColor(['Cabeza y cuello'])} />
            
            {/* Esternocleidomastoideo */}
            <path id="front-scm-left" d="M94,42 L97,55 L88,65 Z" fill={getMuscleColor(['Esternocleidomastoideo'])} onClick={() => handleMuscleClick('Esternocleidomastoideo')} style={muscleStyle} />
            <path id="front-scm-right" d="M106,42 L103,55 L112,65 Z" fill={getMuscleColor(['Esternocleidomastoideo'])} onClick={() => handleMuscleClick('Esternocleidomastoideo')} style={muscleStyle} />

            {/* HOMBROS: Deltoides anterior y lateral */}
            <path id="front-delt-ant-left" d="M78,65 L68,72 L68,105 Q75,85 82,65 Z" fill={getMuscleColor(['Deltoides anterior'])} onClick={() => handleMuscleClick('Deltoides anterior')} style={muscleStyle} />
            <path id="front-delt-lat-left" d="M68,72 L55,100 L68,115 L68,72 Z" fill={getMuscleColor(['Deltoides lateral'])} onClick={() => handleMuscleClick('Deltoides lateral')} style={muscleStyle} />
            
            <path id="front-delt-ant-right" d="M122,65 L132,72 L132,105 Q125,85 118,65 Z" fill={getMuscleColor(['Deltoides anterior'])} onClick={() => handleMuscleClick('Deltoides anterior')} style={muscleStyle} />
            <path id="front-delt-lat-right" d="M132,72 L145,100 L132,115 L132,72 Z" fill={getMuscleColor(['Deltoides lateral'])} onClick={() => handleMuscleClick('Deltoides lateral')} style={muscleStyle} />

            {/* PECHO: Pectoral mayor y menor */}
            <path id="pectoral-major-left" d="M85,65 L100,70 L100,120 L80,115 Q72,95 85,65" fill={getMuscleColor(['Pectoral mayor'])} onClick={() => handleMuscleClick('Pectoral mayor')} style={muscleStyle} />
            <path id="pectoral-minor-left" d="M78,75 L84,75 L82,95 Z" fill={getMuscleColor(['Pectoral menor'])} onClick={() => handleMuscleClick('Pectoral menor')} style={muscleStyle} />
            
            <path id="pectoral-major-right" d="M115,65 L100,70 L100,120 L120,115 Q128,95 115,65" fill={getMuscleColor(['Pectoral mayor'])} onClick={() => handleMuscleClick('Pectoral mayor')} style={muscleStyle} />
            <path id="pectoral-minor-right" d="M122,75 L116,75 L118,95 Z" fill={getMuscleColor(['Pectoral menor'])} onClick={() => handleMuscleClick('Pectoral menor')} style={muscleStyle} />

            {/* ABDOMEN: Recto y Oblicuos */}
            <g id="rectus-abdominis" onClick={() => handleMuscleClick('Recto abdominal')} style={muscleStyle}>
              <path d="M88,125 L98,125 L98,145 L88,145 Z" fill={getMuscleColor(['Recto abdominal'])} />
              <path d="M102,125 L112,125 L112,145 L102,145 Z" fill={getMuscleColor(['Recto abdominal'])} />
              <path d="M88,148 L98,148 L98,168 L88,168 Z" fill={getMuscleColor(['Recto abdominal'])} />
              <path d="M102,148 L112,148 L112,168 L102,168 Z" fill={getMuscleColor(['Recto abdominal'])} />
              <path d="M88,171 L97,171 L96,195 L88,195 Z" fill={getMuscleColor(['Recto abdominal'])} />
              <path d="M102,171 L112,171 L111,195 L103,195 Z" fill={getMuscleColor(['Recto abdominal'])} />
            </g>

            <path id="oblique-ext-left" d="M78,130 L85,130 L85,190 Q72,165 78,130" fill={getMuscleColor(['Oblicuo externo'])} onClick={() => handleMuscleClick('Oblicuo externo')} style={muscleStyle} />
            <path id="oblique-int-left" d="M82,135 L86,135 L86,180 Z" fill={getMuscleColor(['Oblicuo interno'])} onClick={() => handleMuscleClick('Oblicuo interno')} style={muscleStyle} />
            
            <path id="oblique-ext-right" d="M122,130 L115,130 L115,190 Q128,165 122,130" fill={getMuscleColor(['Oblicuo externo'])} onClick={() => handleMuscleClick('Oblicuo externo')} style={muscleStyle} />
            <path id="oblique-int-right" d="M118,135 L114,135 L114,180 Z" fill={getMuscleColor(['Oblicuo interno'])} onClick={() => handleMuscleClick('Oblicuo interno')} style={muscleStyle} />

            {/* BRAZOS: Bíceps, Braquial, Antebrazo */}
            <path id="biceps-left" d="M54,108 Q48,130 52,158 L63,158 Q66,130 63,108 Z" fill={getMuscleColor(['Bíceps braquial'])} onClick={() => handleMuscleClick('Bíceps braquial')} style={muscleStyle} />
            <path id="biceps-right" d="M146,108 Q152,130 148,158 L137,158 Q134,130 137,108 Z" fill={getMuscleColor(['Bíceps braquial'])} onClick={() => handleMuscleClick('Bíceps braquial')} style={muscleStyle} />
            
            <path id="brachialis-left" d="M50,135 L54,135 L54,155 L50,155 Z" fill={getMuscleColor(['Braquial anterior'])} onClick={() => handleMuscleClick('Braquial anterior')} style={muscleStyle} />
            <path id="brachialis-right" d="M150,135 L146,135 L146,155 L150,155 Z" fill={getMuscleColor(['Braquial anterior'])} onClick={() => handleMuscleClick('Braquial anterior')} style={muscleStyle} />

            <path id="braquiorradial-left" d="M52,165 L58,165 L56,215 L50,205 Z" fill={getMuscleColor(['Braquiorradial'])} onClick={() => handleMuscleClick('Braquiorradial')} style={muscleStyle} />
            <path id="braquiorradial-right" d="M148,165 L142,165 L144,215 L150,205 Z" fill={getMuscleColor(['Braquiorradial'])} onClick={() => handleMuscleClick('Braquiorradial')} style={muscleStyle} />

            <path id="flexors-left" d="M58,165 L64,165 L63,220 L58,220 Z" fill={getMuscleColor(['Flexores antebrazo'])} onClick={() => handleMuscleClick('Flexores antebrazo')} style={muscleStyle} />
            <path id="flexors-right" d="M142,165 L136,165 L137,220 L142,220 Z" fill={getMuscleColor(['Flexores antebrazo'])} onClick={() => handleMuscleClick('Flexores antebrazo')} style={muscleStyle} />

            {/* PIERNAS: Cuádriceps, Aductores, Tibial */}
            <path id="rectus-femoris-left" d="M82,210 Q78,260 85,310 L94,310 Q98,260 92,210 Z" fill={getMuscleColor(['Recto femoral'])} onClick={() => handleMuscleClick('Recto femoral')} style={muscleStyle} />
            <path id="rectus-femoris-right" d="M118,210 Q122,260 115,310 L106,310 Q102,260 108,210 Z" fill={getMuscleColor(['Recto femoral'])} onClick={() => handleMuscleClick('Recto femoral')} style={muscleStyle} />

            <path id="vastus-lat-left" d="M82,210 Q68,250 75,310 L82,310 Q78,260 82,210 Z" fill={getMuscleColor(['Vasto lateral'])} onClick={() => handleMuscleClick('Vasto lateral')} style={muscleStyle} />
            <path id="vastus-lat-right" d="M118,210 Q132,250 125,310 L118,310 Q122,260 118,210 Z" fill={getMuscleColor(['Vasto lateral'])} onClick={() => handleMuscleClick('Vasto lateral')} style={muscleStyle} />

            <path id="vastus-med-left" d="M94,285 Q100,300 94,310 L88,310 Q90,295 94,285" fill={getMuscleColor(['Vasto medial'])} onClick={() => handleMuscleClick('Vasto medial')} style={muscleStyle} />
            <path id="vastus-med-right" d="M106,285 Q100,300 106,310 L112,310 Q110,295 106,285" fill={getMuscleColor(['Vasto medial'])} onClick={() => handleMuscleClick('Vasto medial')} style={muscleStyle} />

            <path id="vastus-int-left" d="M90,240 L94,240 L94,270 L90,270 Z" fill={getMuscleColor(['Vasto intermedio'])} onClick={() => handleMuscleClick('Vasto intermedio')} style={muscleStyle} />
            <path id="vastus-int-right" d="M110,240 L106,240 L106,270 L110,270 Z" fill={getMuscleColor(['Vasto intermedio'])} onClick={() => handleMuscleClick('Vasto intermedio')} style={muscleStyle} />

            <path id="adductors-left" d="M94,215 L100,215 L100,250 L94,235 Z" fill={getMuscleColor(['Aductores'])} onClick={() => handleMuscleClick('Aductores')} style={muscleStyle} />
            <path id="adductors-right" d="M106,215 L100,215 L100,250 L106,235 Z" fill={getMuscleColor(['Aductores'])} onClick={() => handleMuscleClick('Aductores')} style={muscleStyle} />

            <path id="tibial-ant-left" d="M78,315 Q75,350 82,380 L90,380 L90,315 Z" fill={getMuscleColor(['Tibial anterior'])} onClick={() => handleMuscleClick('Tibial anterior')} style={muscleStyle} />
            <path id="tibial-ant-right" d="M122,315 Q125,350 118,380 L110,380 L110,315 Z" fill={getMuscleColor(['Tibial anterior'])} onClick={() => handleMuscleClick('Tibial anterior')} style={muscleStyle} />

            {/* Manos y Pies */}
            <circle cx="58" cy="245" r="8" fill="#4B5563" />
            <circle cx="142" cy="245" r="8" fill="#4B5563" />
            <path d="M68,385 L90,385 L90,395 L68,395 Z" fill="#4B5563" />
            <path d="M132,385 L110,385 L110,395 L132,395 Z" fill="#4B5563" />
          </g>
        </svg>
      </div>

      {/* VISTA POSTERIOR (TRASERA) */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Vista Posterior</span>
        <svg viewBox="0 0 200 400" className="h-[320px] w-auto drop-shadow-xl">
          <g id="back-body" fill="#1f2937" stroke="#111827" strokeWidth="0.8">
            {/* Cabeza y cuello */}
            <path d="M85,20 Q100,10 115,20 L115,40 Q100,50 85,40 Z" fill={getMuscleColor(['Cabeza y cuello', 'Trapecio (superior)'])} onClick={() => handleMuscleClick('Trapecio (superior)')} style={muscleStyle} />
            
            {/* TRAPECIO (Superior, Medio, Inferior) */}
            <path id="trap-sup-left" d="M100,55 L85,65 Q82,75 80,85 L100,92 Z" fill={getMuscleColor(['Trapecio (superior)'])} onClick={() => handleMuscleClick('Trapecio (superior)')} style={muscleStyle} />
            <path id="trap-sup-right" d="M100,55 L115,65 Q118,75 120,85 L100,92 Z" fill={getMuscleColor(['Trapecio (superior)'])} onClick={() => handleMuscleClick('Trapecio (superior)')} style={muscleStyle} />
            
            <path id="trap-mid" d="M100,92 L85,105 L100,135 L115,105 Z" fill={getMuscleColor(['Trapecio (medio)'])} onClick={() => handleMuscleClick('Trapecio (medio)')} style={muscleStyle} />
            <path id="trap-inf" d="M100,135 L92,150 L100,190 L108,150 Z" fill={getMuscleColor(['Trapecio (inferior)'])} onClick={() => handleMuscleClick('Trapecio (inferior)')} style={muscleStyle} />

            {/* DELTOIDES POSTERIOR */}
            <path id="back-delt-post-left" d="M78,65 Q65,75 58,100 L72,105 Q80,85 82,72 Z" fill={getMuscleColor(['Deltoides posterior'])} onClick={() => handleMuscleClick('Deltoides posterior')} style={muscleStyle} />
            <path id="back-delt-post-right" d="M122,65 Q135,75 142,100 L128,105 Q120,85 118,72 Z" fill={getMuscleColor(['Deltoides posterior'])} onClick={() => handleMuscleClick('Deltoides posterior')} style={muscleStyle} />

            {/* ESPALDA: Dorsal, Romboides, Erectores */}
            <path id="lat-left" d="M85,105 Q68,135 75,185 L100,195 L100,140 Z" fill={getMuscleColor(['Dorsal ancho'])} onClick={() => handleMuscleClick('Dorsal ancho')} style={muscleStyle} />
            <path id="lat-right" d="M115,105 Q132,135 125,185 L100,195 L100,140 Z" fill={getMuscleColor(['Dorsal ancho'])} onClick={() => handleMuscleClick('Dorsal ancho')} style={muscleStyle} />
            
            <path id="rhomboid-left" d="M90,95 L98,95 L98,125 L92,125 Z" fill={getMuscleColor(['Romboides'])} onClick={() => handleMuscleClick('Romboides')} style={muscleStyle} />
            <path id="rhomboid-right" d="M110,95 L102,95 L102,125 L108,125 Z" fill={getMuscleColor(['Romboides'])} onClick={() => handleMuscleClick('Romboides')} style={muscleStyle} />
            
            <path id="erector-left" d="M94,155 L100,155 L100,195 L94,195 Z" fill={getMuscleColor(['Erectores espinales'])} onClick={() => handleMuscleClick('Erectores espinales')} style={muscleStyle} />
            <path id="erector-right" d="M106,155 L100,155 L100,195 L106,195 Z" fill={getMuscleColor(['Erectores espinales'])} onClick={() => handleMuscleClick('Erectores espinales')} style={muscleStyle} />

            {/* TRÍCEPS y EXTENSORES */}
            <path id="triceps-left" d="M55,105 Q48,125 52,160 L63,160 Q66,125 63,105 Z" fill={getMuscleColor(['Tríceps braquial'])} onClick={() => handleMuscleClick('Tríceps braquial')} style={muscleStyle} />
            <path id="triceps-right" d="M145,105 Q152,125 148,160 L137,160 Q134,125 137,105 Z" fill={getMuscleColor(['Tríceps braquial'])} onClick={() => handleMuscleClick('Tríceps braquial')} style={muscleStyle} />

            <path id="extensors-left" d="M52,165 Q48,200 55,230 L65,225 Q65,195 62,165 Z" fill={getMuscleColor(['Extensores antebrazo'])} onClick={() => handleMuscleClick('Extensores antebrazo')} style={muscleStyle} />
            <path id="extensors-right" d="M148,165 Q152,200 145,230 L135,225 Q135,195 138,165 Z" fill={getMuscleColor(['Extensores antebrazo'])} onClick={() => handleMuscleClick('Extensores antebrazo')} style={muscleStyle} />

            {/* GLÚTEOS (Mayor y Medio) */}
            <path id="glute-med-left" d="M80,200 L88,200 L84,215 L72,210 Z" fill={getMuscleColor(['Glúteo medio'])} onClick={() => handleMuscleClick('Glúteo medio')} style={muscleStyle} />
            <path id="glute-med-right" d="M120,200 L112,200 L116,215 L128,210 Z" fill={getMuscleColor(['Glúteo medio'])} onClick={() => handleMuscleClick('Glúteo medio')} style={muscleStyle} />
            
            <path id="glute-max-left" d="M80,210 Q75,235 100,245 L100,205 L85,205 Z" fill={getMuscleColor(['Glúteo mayor'])} onClick={() => handleMuscleClick('Glúteo mayor')} style={muscleStyle} />
            <path id="glute-max-right" d="M120,210 Q125,235 100,245 L100,205 L115,205 Z" fill={getMuscleColor(['Glúteo mayor'])} onClick={() => handleMuscleClick('Glúteo mayor')} style={muscleStyle} />

            {/* ISQUIOTIBIALES (Bíceps femoral, Semitend/memb) */}
            <path id="biceps-femoris-left" d="M78,255 Q68,290 78,335 L88,335 Q84,290 88,255 Z" fill={getMuscleColor(['Bíceps femoral'])} onClick={() => handleMuscleClick('Bíceps femoral')} style={muscleStyle} />
            <path id="biceps-femoris-right" d="M122,255 Q132,290 122,335 L112,335 Q116,290 112,255 Z" fill={getMuscleColor(['Bíceps femoral'])} onClick={() => handleMuscleClick('Bíceps femoral')} style={muscleStyle} />
            
            <path id="semitend-left" d="M88,255 Q92,290 88,335 L98,335 Q102,290 98,255 Z" fill={getMuscleColor(['Semitendinoso'])} onClick={() => handleMuscleClick('Semitendinoso')} style={muscleStyle} />
            <path id="semimemb-left" d="M82,275 L86,275 L86,305 L82,305 Z" fill={getMuscleColor(['Semimembranoso'])} onClick={() => handleMuscleClick('Semimembranoso')} style={muscleStyle} />
            
            <path id="semitend-right" d="M112,255 Q108,290 112,335 L102,335 Q98,290 102,255 Z" fill={getMuscleColor(['Semitendinoso'])} onClick={() => handleMuscleClick('Semitendinoso')} style={muscleStyle} />
            <path id="semimemb-right" d="M118,275 L114,275 L114,305 L118,305 Z" fill={getMuscleColor(['Semimembranoso'])} onClick={() => handleMuscleClick('Semimembranoso')} style={muscleStyle} />

            {/* PANTORRILLA: Gastrocnemio y Sóleo */}
            <path id="gastroc-lat-left" d="M78,340 Q72,360 82,385 L85,385 L85,340 Z" fill={getMuscleColor(['Gastrocnemio (gemelos)'])} onClick={() => handleMuscleClick('Gastrocnemio (gemelos)')} style={muscleStyle} />
            <path id="gastroc-med-left" d="M92,340 Q98,360 88,385 L85,385 L85,340 Z" fill={getMuscleColor(['Gastrocnemio (gemelos)'])} onClick={() => handleMuscleClick('Gastrocnemio (gemelos)')} style={muscleStyle} />
            
            <path id="soleus-left" d="M72,355 L78,355 L75,385 L70,380 Z" fill={getMuscleColor(['Sóleo'])} onClick={() => handleMuscleClick('Sóleo')} style={muscleStyle} />
            <path id="soleus-right" d="M128,355 L122,355 L125,385 L130,380 Z" fill={getMuscleColor(['Sóleo'])} onClick={() => handleMuscleClick('Sóleo')} style={muscleStyle} />
            
            <path id="gastroc-lat-right" d="M122,340 Q128,360 118,385 L115,385 L115,340 Z" fill={getMuscleColor(['Gastrocnemio (gemelos)'])} onClick={() => handleMuscleClick('Gastrocnemio (gemelos)')} style={muscleStyle} />
            <path id="gastroc-med-right" d="M108,340 Q102,360 112,385 L115,385 L115,340 Z" fill={getMuscleColor(['Gastrocnemio (gemelos)'])} onClick={() => handleMuscleClick('Gastrocnemio (gemelos)')} style={muscleStyle} />

            {/* Manos y Pies */}
            <circle cx="58" cy="245" r="8" fill="#4B5563" />
            <circle cx="142" cy="245" r="8" fill="#4B5563" />
            <path d="M78,385 L95,385 L95,395 L78,395 Z" fill="#4B5563" />
            <path d="M122,385 L105,385 L105,395 L122,395 Z" fill="#4B5563" />
          </g>
        </svg>
      </div>
    </div>
  );
}
