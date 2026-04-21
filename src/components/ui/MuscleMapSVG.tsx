// Mapa corporal SVG con músculos coloreados
// Muestra vista frontal y posterior con regiones resaltadas según activación.
// primary  → verde primario (#C1FF00)
// secondary → naranja (#f97316)
// inactive  → azul-gris oscuro (#1e293b)

import React from 'react';

// ── Mapeo nombre BD → región(es) SVG ─────────────────────────────────────────
const MUSCLE_MAP: Record<string, string[]> = {
  // Nombres simples (seedService.ts)
  'Pectorales':         ['chest_l', 'chest_r'],
  'Dorsales':           ['lat_l', 'lat_r'],
  'Deltoides':          ['shoulder_l', 'shoulder_r', 'rear_delt_l', 'rear_delt_r'],
  'Bíceps':             ['bicep_l', 'bicep_r'],
  'Tríceps':            ['tricep_l', 'tricep_r'],
  'Trapecio':           ['trap'],
  'Antebrazos':         ['forearm_l', 'forearm_r', 'forearm_back_l', 'forearm_back_r'],
  'Cuádriceps':         ['quad_l', 'quad_r'],
  'Isquiotibiales':     ['hamstring_l', 'hamstring_r'],
  'Glúteos':            ['glute_l', 'glute_r'],
  'Pantorrillas':       ['tibialis_l', 'tibialis_r', 'gastro_l', 'gastro_r'],
  'Core/Abdominales':   ['abs', 'oblique_l', 'oblique_r'],

  // Nombres detallados (seedService2.ts) — vista anterior
  'Pectoral mayor':         ['chest_l', 'chest_r'],
  'Pectoral menor':         ['chest_l', 'chest_r'],
  'Deltoides anterior':     ['shoulder_l', 'shoulder_r'],
  'Deltoides lateral':      ['shoulder_l', 'shoulder_r'],
  'Bíceps braquial':        ['bicep_l', 'bicep_r'],
  'Braquial anterior':      ['bicep_l', 'bicep_r'],
  'Braquiorradial':         ['forearm_l', 'forearm_r'],
  'Flexores antebrazo':     ['forearm_l', 'forearm_r'],
  'Recto abdominal':        ['abs'],
  'Oblicuo externo':        ['oblique_l', 'oblique_r'],
  'Oblicuo interno':        ['oblique_l', 'oblique_r'],
  'Recto femoral':          ['quad_l', 'quad_r'],
  'Vasto lateral':          ['quad_l', 'quad_r'],
  'Vasto medial':           ['quad_l', 'quad_r'],
  'Vasto intermedio':       ['quad_l', 'quad_r'],
  'Aductores':              ['adductor_l', 'adductor_r'],
  'Tibial anterior':        ['tibialis_l', 'tibialis_r'],
  'Cabeza y cuello':        [],
  'Esternocleidomastoideo': [],

  // Nombres detallados — vista posterior
  'Trapecio (superior)':    ['trap'],
  'Trapecio (medio)':       ['trap'],
  'Trapecio (inferior)':    ['trap'],
  'Dorsal ancho':           ['lat_l', 'lat_r'],
  'Romboides':              ['rhomboid'],
  'Erectores espinales':    ['erector'],
  'Deltoides posterior':    ['rear_delt_l', 'rear_delt_r'],
  'Tríceps braquial':       ['tricep_l', 'tricep_r'],
  'Extensores antebrazo':   ['forearm_back_l', 'forearm_back_r'],
  'Glúteo mayor':           ['glute_l', 'glute_r'],
  'Glúteo medio':           ['glute_l', 'glute_r'],
  'Bíceps femoral':         ['hamstring_l', 'hamstring_r'],
  'Semitendinoso':          ['hamstring_l', 'hamstring_r'],
  'Semimembranoso':         ['hamstring_l', 'hamstring_r'],
  'Gastrocnemio (gemelos)': ['gastro_l', 'gastro_r'],
  'Sóleo':                  ['gastro_l', 'gastro_r'],
};

// ── Colores ───────────────────────────────────────────────────────────────────
const C_INACTIVE  = '#1e293b';
const C_INACTIVE_BORDER = '#334155';
const C_PRIMARY   = '#C1FF00';
const C_SECONDARY = '#f97316';
const C_HEAD      = '#374151';
const C_BODY_BG   = '#111827';

interface Props {
  primaryMuscles:   string[];
  secondaryMuscles: string[];
}

export function MuscleMapSVG({ primaryMuscles, secondaryMuscles }: Props) {
  // Construir sets de region IDs activos
  const primaryRegions   = new Set<string>();
  const secondaryRegions = new Set<string>();

  for (const name of primaryMuscles) {
    for (const region of MUSCLE_MAP[name] ?? []) primaryRegions.add(region);
  }
  for (const name of secondaryMuscles) {
    for (const region of MUSCLE_MAP[name] ?? []) {
      if (!primaryRegions.has(region)) secondaryRegions.add(region);
    }
  }

  // Helper para color de relleno de una región
  function fill(id: string): string {
    if (primaryRegions.has(id))   return C_PRIMARY;
    if (secondaryRegions.has(id)) return C_SECONDARY;
    return C_INACTIVE;
  }
  function stroke(id: string): string {
    if (primaryRegions.has(id))   return '#84cc16';
    if (secondaryRegions.has(id)) return '#ea580c';
    return C_INACTIVE_BORDER;
  }
  function opacity(id: string): number {
    if (primaryRegions.has(id) || secondaryRegions.has(id)) return 0.92;
    return 0.55;
  }

  // Props SVG para una región
  const r = (id: string) => ({
    fill:    fill(id),
    stroke:  stroke(id),
    strokeWidth: 1,
    opacity: opacity(id),
  });

  return (
    <svg
      viewBox="0 0 280 340"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-[320px] mx-auto"
      style={{ maxHeight: '320px' }}
    >
      {/* ────────────────────────────────────────────────────────────────────
          VISTA FRONTAL — figura centrada en x=70
      ──────────────────────────────────────────────────────────────────── */}

      {/* Silueta de fondo: torso y piernas */}
      <path
        d="M63,38 Q50,44 38,56 L32,82 L27,132 L22,152 L33,152 L38,132 L42,82
           Q42,68 47,64 L47,136 Q47,148 43,158 L40,220 L37,290 L57,290
           L60,220 L63,158 Q67,145 70,142 Q73,145 77,158 L80,220 L83,290
           L103,290 L100,220 L97,158 Q93,148 93,136 L93,64 Q98,68 98,82
           L102,132 L107,152 L118,152 L113,132 L108,82 L102,56 Q90,44 77,38 Z"
        fill={C_BODY_BG}
        stroke="#1e293b"
        strokeWidth="1.5"
      />

      {/* Cabeza */}
      <circle cx="70" cy="24" r="14" fill={C_HEAD} stroke="#475569" strokeWidth="1.5" />

      {/* ── Brazos: hombros ── */}
      <ellipse id="shoulder_l" cx="46" cy="67" rx="15" ry="10" {...r('shoulder_l')} />
      <ellipse id="shoulder_r" cx="94" cy="67" rx="15" ry="10" {...r('shoulder_r')} />

      {/* ── Pectorales ── */}
      <path id="chest_l"
        d="M57,59 Q64,56 70,59 L70,77 Q63,81 57,77 Q54,70 57,59 Z"
        {...r('chest_l')} />
      <path id="chest_r"
        d="M70,59 Q76,56 83,59 Q86,70 83,77 Q77,81 70,77 Z"
        {...r('chest_r')} />

      {/* ── Bíceps ── */}
      <ellipse id="bicep_l" cx="36" cy="98" rx="9" ry="20" {...r('bicep_l')} />
      <ellipse id="bicep_r" cx="104" cy="98" rx="9" ry="20" {...r('bicep_r')} />

      {/* ── Antebrazos frente ── */}
      <ellipse id="forearm_l" cx="31" cy="132" rx="7.5" ry="16" {...r('forearm_l')} />
      <ellipse id="forearm_r" cx="109" cy="132" rx="7.5" ry="16" {...r('forearm_r')} />

      {/* ── Abdominales ── */}
      <rect id="abs" x="57" y="83" width="26" height="38" rx="5" {...r('abs')} />
      {/* Líneas de separación abs (decorativas) */}
      {(primaryRegions.has('abs') || secondaryRegions.has('abs')) && (
        <>
          <line x1="57" y1="96" x2="83" y2="96" stroke={C_BODY_BG} strokeWidth="1.5" opacity="0.6" />
          <line x1="57" y1="109" x2="83" y2="109" stroke={C_BODY_BG} strokeWidth="1.5" opacity="0.6" />
          <line x1="70" y1="83" x2="70" y2="121" stroke={C_BODY_BG} strokeWidth="1"   opacity="0.5" />
        </>
      )}

      {/* ── Oblicuos ── */}
      <path id="oblique_l"
        d="M47,86 Q41,94 41,110 Q45,118 51,114 Q56,106 56,90 Z"
        {...r('oblique_l')} />
      <path id="oblique_r"
        d="M93,86 Q99,94 99,110 Q95,118 89,114 Q84,106 84,90 Z"
        {...r('oblique_r')} />

      {/* ── Cuádriceps ── */}
      <ellipse id="quad_l" cx="56" cy="182" rx="17" ry="30" {...r('quad_l')} />
      <ellipse id="quad_r" cx="84" cy="182" rx="17" ry="30" {...r('quad_r')} />

      {/* ── Aductores (encima de cuádriceps) ── */}
      <ellipse id="adductor_l" cx="66" cy="182" rx="7" ry="25"
        fill={fill('adductor_l')} stroke={stroke('adductor_l')} strokeWidth="1" opacity={opacity('adductor_l') * 0.85} />
      <ellipse id="adductor_r" cx="74" cy="182" rx="7" ry="25"
        fill={fill('adductor_r')} stroke={stroke('adductor_r')} strokeWidth="1" opacity={opacity('adductor_r') * 0.85} />

      {/* ── Tibial / frente pantorrilla ── */}
      <ellipse id="tibialis_l" cx="53" cy="254" rx="10" ry="22" {...r('tibialis_l')} />
      <ellipse id="tibialis_r" cx="87" cy="254" rx="10" ry="22" {...r('tibialis_r')} />

      {/* Etiqueta FRENTE */}
      <text x="70" y="325" textAnchor="middle"
        fontFamily="ui-sans-serif,system-ui,sans-serif" fontSize="8"
        fontWeight="700" fill="#475569" letterSpacing="2">FRENTE</text>


      {/* ────────────────────────────────────────────────────────────────────
          VISTA POSTERIOR — figura centrada en x=210
      ──────────────────────────────────────────────────────────────────── */}

      {/* Silueta de fondo */}
      <path
        d="M203,38 Q190,44 178,56 L172,82 L167,132 L162,152 L173,152 L178,132 L182,82
           Q182,68 187,64 L187,136 Q187,148 183,158 L180,220 L177,290 L197,290
           L200,220 L203,158 Q207,145 210,142 Q213,145 217,158 L220,220 L223,290
           L243,290 L240,220 L237,158 Q233,148 233,136 L233,64 Q238,68 238,82
           L242,132 L247,152 L258,152 L253,132 L248,82 L242,56 Q230,44 217,38 Z"
        fill={C_BODY_BG}
        stroke="#1e293b"
        strokeWidth="1.5"
      />

      {/* Cabeza */}
      <circle cx="210" cy="24" r="14" fill={C_HEAD} stroke="#475569" strokeWidth="1.5" />

      {/* ── Trapecio ── */}
      <path id="trap"
        d="M210,38 Q224,50 230,66 Q226,89 210,91 Q194,89 190,66 Q196,50 210,38 Z"
        {...r('trap')} />

      {/* ── Deltoides posterior ── */}
      <ellipse id="rear_delt_l" cx="186" cy="67" rx="15" ry="10" {...r('rear_delt_l')} />
      <ellipse id="rear_delt_r" cx="234" cy="67" rx="15" ry="10" {...r('rear_delt_r')} />

      {/* ── Dorsales (latissimus) ── */}
      <path id="lat_l"
        d="M190,67 Q180,82 178,102 Q180,120 192,124 Q205,120 204,106 Q202,84 196,70 Z"
        {...r('lat_l')} />
      <path id="lat_r"
        d="M230,67 Q240,82 242,102 Q240,120 228,124 Q215,120 216,106 Q218,84 224,70 Z"
        {...r('lat_r')} />

      {/* ── Romboides ── */}
      <path id="rhomboid"
        d="M204,67 L216,67 L218,88 L210,93 L202,88 Z"
        {...r('rhomboid')} />

      {/* ── Erectores espinales ── */}
      <path id="erector"
        d="M203,97 L203,136 Q207,141 210,141 Q213,141 217,136 L217,97 Q213,93 210,93 Q207,93 203,97 Z"
        {...r('erector')} />

      {/* ── Tríceps ── */}
      <ellipse id="tricep_l" cx="176" cy="98" rx="9" ry="20" {...r('tricep_l')} />
      <ellipse id="tricep_r" cx="244" cy="98" rx="9" ry="20" {...r('tricep_r')} />

      {/* ── Antebrazos posterior ── */}
      <ellipse id="forearm_back_l" cx="171" cy="132" rx="7.5" ry="16" {...r('forearm_back_l')} />
      <ellipse id="forearm_back_r" cx="249" cy="132" rx="7.5" ry="16" {...r('forearm_back_r')} />

      {/* ── Glúteos ── */}
      <ellipse id="glute_l" cx="196" cy="164" rx="20" ry="19" {...r('glute_l')} />
      <ellipse id="glute_r" cx="224" cy="164" rx="20" ry="19" {...r('glute_r')} />

      {/* ── Isquiotibiales ── */}
      <ellipse id="hamstring_l" cx="196" cy="207" rx="16" ry="27" {...r('hamstring_l')} />
      <ellipse id="hamstring_r" cx="224" cy="207" rx="16" ry="27" {...r('hamstring_r')} />

      {/* ── Pantorrillas posterior (gastrocnemio) ── */}
      <ellipse id="gastro_l" cx="193" cy="260" rx="13" ry="22" {...r('gastro_l')} />
      <ellipse id="gastro_r" cx="227" cy="260" rx="13" ry="22" {...r('gastro_r')} />

      {/* Etiqueta ESPALDA */}
      <text x="210" y="325" textAnchor="middle"
        fontFamily="ui-sans-serif,system-ui,sans-serif" fontSize="8"
        fontWeight="700" fill="#475569" letterSpacing="2">ESPALDA</text>

      {/* ── Leyenda ── */}
      <g transform="translate(90, 330)">
        <rect x="0" y="0" width="8" height="8" rx="2" fill={C_PRIMARY} />
        <text x="11" y="7.5" fontFamily="ui-sans-serif,system-ui,sans-serif" fontSize="7" fill="#9ca3af">Principal</text>
        <rect x="58" y="0" width="8" height="8" rx="2" fill={C_SECONDARY} />
        <text x="69" y="7.5" fontFamily="ui-sans-serif,system-ui,sans-serif" fontSize="7" fill="#9ca3af">Secundario</text>
      </g>
    </svg>
  );
}
