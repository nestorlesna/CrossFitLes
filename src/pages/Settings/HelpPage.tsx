// Guía de ayuda completa: pensada para alguien que abre la app por primera vez
// y no sabe qué hacer. Explica cada flujo con ejemplos concretos, en especial
// la parte que suele confundir: las 4 formas de cargar una sesión.
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Dumbbell, CalendarDays, Timer, BarChart2, Settings, AlarmClock,
  ClipboardList, Play, ListChecks, Star, Database, HardDrive, Share2, Calculator,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { CollapsibleSection } from '../../components/ui/CollapsibleSection';

// ── Bloques reutilizables ────────────────────────────────────────────────────

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col gap-2">
      {children}
    </div>
  );
}

function StepList({ steps }: { steps: string[] }) {
  return (
    <ol className="flex flex-col gap-2">
      {steps.map((step, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="shrink-0 w-5 h-5 rounded-full bg-primary-600/20 text-primary-400 text-[11px] font-bold flex items-center justify-center mt-0.5">
            {i + 1}
          </span>
          <span className="text-sm text-gray-300 leading-relaxed">{step}</span>
        </li>
      ))}
    </ol>
  );
}

function FlowCard({
  icon, iconColor = 'text-primary-400', title, when, steps,
}: {
  icon: ReactNode; iconColor?: string; title: string; when: string; steps: string[];
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-gray-800 rounded-xl flex items-center justify-center shrink-0">
          <span className={iconColor}>{icon}</span>
        </div>
        <div>
          <p className="text-white font-bold text-sm">{title}</p>
          <p className="text-xs text-gray-500">{when}</p>
        </div>
      </div>
      <StepList steps={steps} />
    </div>
  );
}

export function HelpPage() {
  const navigate = useNavigate();

  return (
    <>
      <Header
        title="Ayuda"
        leftAction={
          <button aria-label="Volver"
            onClick={() => navigate(-1)}
            className="text-gray-400 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ChevronLeft size={24} />
          </button>
        }
      />

      <div className="flex flex-col gap-6 p-4 pb-24">

        {/* ── Intro ── */}
        <Card>
          <p className="text-sm text-gray-300 leading-relaxed">
            Esta guía explica <span className="text-white font-semibold">todo lo que hace la app</span>,
            paso a paso, con ejemplos. Si es tu primera vez, empezá por{' '}
            <span className="text-white font-semibold">&quot;¿Cómo cargo una sesión?&quot;</span>, que es lo que más
            confunde al principio.
          </p>
          <div className="grid grid-cols-5 gap-2 mt-1">
            {[
              { icon: <Dumbbell size={16} />, label: 'Ejercicios' },
              { icon: <CalendarDays size={16} />, label: 'Clases' },
              { icon: <Timer size={16} />, label: 'Sesiones' },
              { icon: <AlarmClock size={16} />, label: 'Timer' },
              { icon: <BarChart2 size={16} />, label: 'Stats' },
            ].map((t) => (
              <div key={t.label} className="flex flex-col items-center gap-1 text-gray-500">
                {t.icon}
                <span className="text-[9px] font-bold uppercase text-center leading-tight">{t.label}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Estas 5 secciones (+ Configuración) son los botones del menú de abajo. Siempre podés volver
            al inicio con el ícono de casa arriba a la izquierda.
          </p>
        </Card>

        {/* ── Sesiones: la parte que más confunde ── */}
        <CollapsibleSection title="¿Cómo cargo una sesión? (empezá acá)" defaultOpen>
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-400 px-1">
              Desde <span className="text-white font-semibold">Sesiones → botón + (arriba a la derecha)</span> tenés
              4 formas de cargar un entrenamiento. La pregunta clave para elegir es:{' '}
              <span className="text-white font-semibold">¿ya lo hiciste o lo vas a hacer ahora?</span> y, si lo vas
              a hacer ahora, <span className="text-white font-semibold">¿querés que el reloj te guíe o preferís ir a tu ritmo?</span>
            </p>

            <FlowCard
              icon={<ClipboardList size={18} />}
              iconColor="text-gray-400"
              title="Registrar sesión pasada"
              when="Ya hiciste el entrenamiento (hoy, ayer, la semana pasada) y solo querés dejarlo anotado. No hay reloj."
              steps={[
                'Sesiones → + → "Registrar sesión pasada".',
                'Elegí la clase/plantilla que hiciste y la fecha real en que la hiciste.',
                'Para cada ejercicio, cargá lo que realmente hiciste: reps, peso, tiempo, Rx o Scaled.',
                'Al final marcás cómo te sentiste (esfuerzo, sensación) y guardás. Queda como sesión completada de esa fecha, en el historial y en Estadísticas.',
              ]}
            />

            <FlowCard
              icon={<Play size={18} />}
              title="Sesión libre"
              when="Vas a entrenar ahora mismo, sin plantilla armada — improvisás sobre la marcha."
              steps={[
                'Sesiones → + → "Sesión libre".',
                'Se abre una sesión en blanco con un cronómetro simple.',
                'Buscás y agregás ejercicios uno por uno a medida que los vas haciendo, cargando reps/peso/tiempo de cada uno.',
                'Cuando terminás, guardás la sesión. Ideal para días sin clase planificada.',
              ]}
            />

            <FlowCard
              icon={<Timer size={18} />}
              title="Usar plantilla → Clase guiada"
              when="Vas a entrenar ahora, seguís una clase ya armada, y querés que el cronómetro te lleve solo de un ejercicio al siguiente (como en un box real, con música y todo)."
              steps={[
                'Sesiones → + → "Usar plantilla", elegís el modo "Clase guiada" (ícono de reloj).',
                'Elegís la clase de la lista (buscador arriba) y tocás para arrancar.',
                'Se abre el cronómetro a pantalla completa: cuenta regresiva, trabajo, descanso, siguiente sección… todo automático, con avisos sonoros y vibración.',
                'Podés pausar, saltar un paso o sumar 15 segundos en cualquier momento con los botones de abajo.',
                'Al terminar (o si tocás la bandera para cerrar antes), te pide cómo te sentiste y guarda la sesión completa.',
              ]}
            />

            <FlowCard
              icon={<ListChecks size={18} />}
              title="Usar plantilla → Manual"
              when="Vas a entrenar ahora, seguís una clase armada, pero preferís ir a tu propio ritmo y cargar vos cada resultado, sin que el reloj te apure."
              steps={[
                'Sesiones → + → "Usar plantilla", elegís el modo "Manual" (ícono de lista).',
                'Elegís la clase y arrancás.',
                'Vas ejercicio por ejercicio a tu ritmo: hay un cronómetro simple para cronometrar cada uno si querés, pero no avanza solo.',
                'Cargás reps/peso/tiempo real de cada ejercicio y marcás como completado.',
                'Al final, resumen y guardado igual que en el modo guiado.',
              ]}
            />

            <div className="bg-blue-950/30 border border-blue-800/40 rounded-xl p-3 flex flex-col gap-1">
              <p className="text-xs font-bold text-blue-300 uppercase tracking-wider">En resumen</p>
              <p className="text-xs text-blue-100/70 leading-relaxed">
                <span className="font-semibold text-white">¿Ya la hiciste?</span> → Registrar sesión pasada.{' '}
                <span className="font-semibold text-white">¿La hacés ahora sin plan?</span> → Sesión libre.{' '}
                <span className="font-semibold text-white">¿La hacés ahora con una clase armada?</span> → Usar
                plantilla, y ahí elegís si querés que el reloj te guíe (Clase guiada) o ir a tu aire (Manual).
              </p>
            </div>
          </div>
        </CollapsibleSection>

        {/* ── Ejercicios ── */}
        <CollapsibleSection title="Ejercicios">
          <div className="flex flex-col gap-3">
            <Card>
              <p className="text-sm text-gray-300 leading-relaxed">
                Es el catálogo de todos los movimientos disponibles (sentadillas, snatch, burpees, etc.), cada
                uno con imagen animada, músculos trabajados, equipamiento necesario y, si cargaste uno, video
                explicativo.
              </p>
              <StepList
                steps={[
                  'Ejercicios (menú de abajo) muestra la lista completa, con buscador y filtros por músculo/equipamiento/dificultad.',
                  'Tocá un ejercicio para ver su ficha completa (descripción, notas técnicas, video).',
                  'Botón + arriba a la derecha: crea un ejercicio nuevo si no encontrás el que buscás.',
                  'Los ejercicios se eligen desde acá cuando armás una Clase, no hace falta entrar primero a esta sección para entrenar.',
                ]}
              />
            </Card>
          </div>
        </CollapsibleSection>

        {/* ── Clases ── */}
        <CollapsibleSection title="Clases (plantillas de entrenamiento)">
          <Card>
            <p className="text-sm text-gray-300 leading-relaxed">
              Una &quot;clase&quot; es una plantilla de WOD: la planificás una vez (secciones + ejercicios + tiempos)
              y después la usás las veces que quieras desde Sesiones.
            </p>
            <StepList
              steps={[
                'Clases (menú de abajo) → botón + para crear una nueva.',
                'Le das nombre, fecha y objetivo, y armás las secciones (Entrada en calor, Activación, Fuerza, WOD, Vuelta a la calma…).',
                'Cada sección tiene un formato de trabajo (EMOM, AMRAP, For Time, Por rondas...) y una lista de ejercicios con sus reps/peso/tiempo planificados.',
                'La estrella marca una clase como favorita para encontrarla rápido.',
                'Una vez guardada, la clase queda lista para usarse desde Sesiones → + → Usar plantilla (guiada o manual).',
              ]}
            />
          </Card>
        </CollapsibleSection>

        {/* ── Timer libre ── */}
        <CollapsibleSection title="Timer (reloj libre)">
          <Card>
            <p className="text-sm text-gray-300 leading-relaxed">
              Un cronómetro configurable independiente de las clases: para calentar, hacer un Tabata suelto,
              o cualquier formato sin tener que armar una clase completa primero.
            </p>
            <StepList
              steps={[
                'Timer (menú de abajo, ícono de reloj despertador) → elegís un formato: For Time, AMRAP, EMOM, Tabata, Intervalos fijos o Intervalos variables.',
                'Completás los datos que pida (minutos, segundos de trabajo/descanso, rondas) y tocás "Guardar e iniciar".',
                'Se abre a pantalla completa: verde = trabajo, rojo = descanso, ámbar = preparación. Podés pausar, sumar 15 segundos o saltar de paso.',
                'En AMRAP hay un botón "+1 Ronda" para ir contando las rondas completas mientras entrenás.',
                'Las plantillas que guardás quedan listadas en la pantalla principal de Timer para volver a correrlas, editarlas, duplicarlas o borrarlas.',
              ]}
            />
            <p className="text-xs text-gray-600 mt-1">
              Esto es distinto del cronómetro de &quot;Clase guiada&quot;: ese corre los ejercicios de una clase
              planificada con imágenes y videos; el Timer es un reloj suelto sin ejercicios asociados.
            </p>
          </Card>
        </CollapsibleSection>

        {/* ── Estadísticas ── */}
        <CollapsibleSection title="Estadísticas">
          <Card>
            <p className="text-sm text-gray-300 leading-relaxed">
              Resume tu historial: sesiones completadas, volumen de entrenamiento, progreso de peso corporal
              y récords personales por ejercicio (se marcan solos cuando superás una marca anterior al cargar
              resultados de una sesión).
            </p>
          </Card>
        </CollapsibleSection>

        {/* ── Configuración ── */}
        <CollapsibleSection title="Configuración" defaultOpen>
          <div className="flex flex-col gap-3">
            <Card>
              <div className="flex items-center gap-2">
                <Star size={16} className="text-primary-400" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Mi perfil</p>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                Tus datos personales (sexo, edad, altura, nivel), medidas corporales a lo largo del tiempo
                (peso, composición, circunferencias) y fotos de progreso (frente, perfil, espalda). Todo esto
                alimenta las Estadísticas.
              </p>
            </Card>

            <Card>
              <div className="flex items-center gap-2">
                <Database size={16} className="text-primary-400" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Catálogos</p>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                Las listas de valores que usás al armar ejercicios y clases: grupos musculares, equipamiento,
                unidades de medida, niveles de dificultad, tags, tipos de sección y formatos de trabajo. También
                el Cronómetro: los tiempos por defecto, avisos sonoros y vibración que usa la Clase guiada
                cuando una clase no especifica un tiempo propio.
              </p>
              <p className="text-xs text-gray-600">
                Normalmente no hace falta tocar esto: ya vienen cargados con los valores típicos de CrossFit. Sirve
                para agregar uno nuevo (por ejemplo un equipamiento que no está) o ajustar los tiempos por defecto
                del cronómetro.
              </p>
            </Card>

            <Card>
              <div className="flex items-center gap-2">
                <Calculator size={16} className="text-primary-400" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Listados</p>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                Vistas de mantenimiento sobre lo ya cargado: qué ejercicios les falta imagen, músculos o video;
                detectar ejercicios duplicados; revisar las secciones de todas las clases (y copiarlas entre
                clases); archivar clases viejas; y corregir sesiones ya guardadas (duración, sensación, valores).
              </p>
            </Card>

            <Card>
              <div className="flex items-center gap-2">
                <HardDrive size={16} className="text-blue-400" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Gestión de datos</p>
              </div>
              <StepList
                steps={[
                  'Compartir: exportá una o varias clases (o ejercicios sueltos) a un archivo para enviárselo a otra persona; al importar uno, se suma a lo que ya tenés sin borrar nada.',
                  'Copia de seguridad: exportá TODA tu base de datos a un archivo, o restaurala desde un backup anterior. Es la única forma de no perder tus datos si cambiás de celular.',
                  'Tiempos del cronómetro: completa automáticamente los tiempos que falten en tus clases, estimándolos a partir de las reps/distancia/calorías de cada ejercicio.',
                  'Zona de peligro (Reset): cargar los datos base de ejemplo, o limpiar toda la base de datos. Usar con mucho cuidado, no tiene vuelta atrás salvo que tengas un backup.',
                ]}
              />
              <div className="mt-1 bg-blue-900/30 border border-blue-700/40 rounded-xl px-3 py-2.5 flex items-start gap-2">
                <Share2 size={14} className="text-blue-300 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-200/80 leading-relaxed">
                  Todos tus datos viven solo en este celular. <span className="font-bold text-blue-200">Hacé
                  una Copia de seguridad de vez en cuando</span> — si perdés el teléfono o desinstalás la app,
                  sin backup se pierde todo.
                </p>
              </div>
            </Card>
          </div>
        </CollapsibleSection>

        <div className="flex items-center gap-2 justify-center mt-2">
          <Settings size={14} className="text-gray-700" />
          <p className="text-xs text-gray-700">
            ¿Algo no quedó claro? Volvé a esta guía cuando quieras desde Configuración → Ayuda.
          </p>
        </div>
      </div>
    </>
  );
}
