// Guía de ayuda completa: pensada para alguien que abre la app por primera vez
// y no sabe qué hacer. Explica cada flujo con ejemplos concretos, en especial
// la parte que suele confundir: las 4 formas de cargar una sesión. Incluye una tarjeta de
// Novedades (planes, challenges, clases por video, contenido online) con acceso directo.
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Dumbbell, CalendarDays, Timer, BarChart2, Settings, AlarmClock,
  ClipboardList, Play, ListChecks, Star, Database, HardDrive, Share2, Calculator,
  CalendarRange, Trophy, Video, Cloud, Home, Sparkles, ChevronRight, Lightbulb,
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

// Recuadro de consejo / ejemplo dentro de una sección
function Tip({ children }: { children: ReactNode }) {
  return (
    <div className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-3 flex items-start gap-2">
      <Lightbulb size={14} className="text-amber-400 shrink-0 mt-0.5" />
      <p className="text-xs text-amber-100/80 leading-relaxed">{children}</p>
    </div>
  );
}

// Título chico con ícono para separar bloques dentro de una tarjeta
function CardTitle({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-primary-400">{icon}</span>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{children}</p>
    </div>
  );
}

// Novedades: acceso directo a cada funcionalidad nueva
const NEWS = [
  {
    icon: <CalendarRange size={16} />, title: 'Planes de entrenamiento', path: '/planes',
    text: 'Organizá varias semanas: qué clase toca cada día, con calendario, racha y adherencia.',
  },
  {
    icon: <Trophy size={16} />, title: 'Challenges', path: '/challenges',
    text: 'Retos de calistenia (100 flexiones, plancha de 5 min…) que te arman las series según tu nivel.',
  },
  {
    icon: <Video size={16} />, title: 'Clases por video', path: '/clases',
    text: 'Pegale un video (YouTube, Facebook, TikTok…) a una clase y entrená siguiéndolo.',
  },
  {
    icon: <Cloud size={16} />, title: 'Contenido online', path: '/configuracion',
    text: 'Bajá clases, ejercicios, planes y challenges nuevos sin perder lo tuyo.',
  },
];

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
            al inicio con el ícono de casa arriba a la izquierda. <span className="text-gray-400">Planes</span> y{' '}
            <span className="text-gray-400">Challenges</span> no tienen botón propio: están como pestañas dentro de
            Clases (Clases · Planes · Challenges) y como accesos directos en Inicio.
          </p>
        </Card>

        {/* ── Novedades ── */}
        <div className="bg-primary-600/10 border border-primary-700/50 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-primary-400" />
            <p className="text-xs font-bold text-primary-300 uppercase tracking-wider">Novedades</p>
          </div>
          {NEWS.map((n) => (
            <button
              key={n.title}
              onClick={() => navigate(n.path)}
              className="flex items-center gap-3 text-left bg-gray-900/60 border border-gray-800 rounded-xl p-3 min-h-[44px] active:scale-[0.98] transition-transform"
            >
              <span className="text-primary-400 shrink-0">{n.icon}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm text-white font-semibold">{n.title}</span>
                <span className="block text-xs text-gray-400 leading-snug">{n.text}</span>
              </span>
              <ChevronRight size={16} className="text-gray-600 shrink-0" />
            </button>
          ))}
          <p className="text-[11px] text-gray-500">
            Tocá una para ir directo. Más abajo cada una tiene su explicación paso a paso.
          </p>
        </div>

        {/* ── Inicio ── */}
        <CollapsibleSection title="Inicio: qué me toca hoy">
          <Card>
            <CardTitle icon={<Home size={16} />}>La pantalla de inicio</CardTitle>
            <p className="text-sm text-gray-300 leading-relaxed">
              Es lo primero que ves al abrir la app y te dice qué hacer:
            </p>
            <StepList
              steps={[
                'Si dejaste una sesión a medias, aparece arriba para retomarla.',
                'Si tenés un plan activo, muestra el entrenamiento de hoy (o el próximo, si hoy es descanso) con un botón para arrancarlo ahí mismo.',
                'Si estás haciendo uno o más challenges, cada uno muestra su sesión del día con su botón "Empezar".',
                'Abajo están los accesos directos: Nueva sesión, Ejercicios, Clases, Planes, Challenges y Estadísticas.',
              ]}
            />
          </Card>
        </CollapsibleSection>

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
                'Si la clase tiene un video cargado (aparece la etiqueta "video" en la lista), en vez del cronómetro se abre el video a pantalla completa: entrenás siguiéndolo y la sesión se cierra sola cuando termina, o antes con la bandera.',
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

            <Tip>
              Si seguís un <span className="font-semibold text-white">plan</span> o un{' '}
              <span className="font-semibold text-white">challenge</span>, no hace falta pasar por acá: arrancás el
              entrenamiento del día desde Inicio o desde el propio plan/challenge, y al terminarlo se marca solo como
              hecho. Igual queda guardado en Sesiones como cualquier otro.
            </Tip>
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
                  'El botón "Ver videos / Sin videos" muestra u oculta, en cada tarjeta, el video corto y el explicativo del ejercicio. La lista va por páginas: abajo elegís cuántos ver por página.',
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
                'Las clases se separan en "Mis Clases" y "Clases Genéricas" (colapsable); podés mover una de un grupo al otro.',
                'Una vez guardada, la clase queda lista para usarse desde Sesiones → + → Usar plantilla (guiada o manual), o para asignarla a un día de un plan.',
              ]}
            />
          </Card>

          <Card>
            <CardTitle icon={<Video size={16} />}>Clase por video</CardTitle>
            <p className="text-sm text-gray-300 leading-relaxed">
              Sirve para clases que seguís desde un video (una rutina de YouTube, un reel de Facebook, un TikTok…).
            </p>
            <StepList
              steps={[
                'Al crear o editar la clase, pegá el link en "Video de la clase". Abajo aparece una vista previa para comprobar que se reconoce.',
                'Cargá la "Duración del video (mm:ss)": con eso la sesión se cierra sola al terminar el video y se calcula la duración y las calorías.',
                'Si querés que queden registrados, agregá también los ejercicios en las secciones, como en cualquier clase.',
                'Para entrenar: Sesiones → + → Usar plantilla → Clase guiada → elegís la clase. Se abre el video a pantalla completa en lugar del cronómetro.',
              ]}
            />
          </Card>
        </CollapsibleSection>

        {/* ── Planes ── */}
        <CollapsibleSection title="Planes de entrenamiento">
          <div className="flex flex-col gap-3">
            <Card>
              <p className="text-sm text-gray-300 leading-relaxed">
                Un plan es tu programación de varias semanas: dice qué entrenás cada día. Por ejemplo
                &quot;Fuerza 4 semanas&quot;, lunes, miércoles y viernes. La app te muestra qué toca hoy, marca lo que
                ya hiciste y te avisa si te atrasaste.
              </p>
              <p className="text-xs text-gray-500">
                Dónde está: Clases → pestaña <span className="text-gray-300">Planes</span>, o Inicio → Planes.
              </p>
            </Card>

            <FlowCard
              icon={<CalendarRange size={18} />}
              title="1. Crear el plan"
              when="Le das nombre y estructura; la app genera los días sola."
              steps={[
                'Planes → "Nuevo plan". Poné nombre y, si querés, un objetivo (ej: "Subir sentadilla").',
                'Elegí el modo de programación (no se puede cambiar después):',
                '• Fechas fijas: cada día cae en una fecha del calendario. Elegís fecha de inicio, cantidad de semanas y qué días de la semana entrenás. Podés marcar los demás días como descanso.',
                '• Secuencial: Día 1, Día 2, Día 3… sin fechas. Elegís semanas y días por semana; el plan avanza cuando entrenás, sin importar qué día sea. Ideal si no tenés horarios fijos.',
                'Al guardar se crean todos los días vacíos ("sin asignar"). Falta decir qué se hace en cada uno.',
              ]}
            />

            <FlowCard
              icon={<ListChecks size={18} />}
              title="2. Asignar qué se hace cada día"
              when="Tocás un día del plan → Editar día (o Asignar entrenamiento)."
              steps={[
                'Clase: elegís una de tus clases ya armadas (con buscador).',
                'Armar día: armás ese día con ejercicios sueltos (reps, peso, segundos, rondas) sin crear una clase aparte. No aparece en la lista de Clases.',
                'Descanso: el día queda marcado como descanso (ícono de luna).',
                'Con "Agregar día" sumás días extra al final del plan.',
              ]}
            />

            <FlowCard
              icon={<Play size={18} />}
              title="3. Entrenar y seguir el avance"
              when="Desde Inicio o tocando el día dentro del plan."
              steps={[
                'Tocá el día → "Empezar con cronómetro" (igual que Clase guiada) o "Cargar a mano" (igual que Manual). También podés arrancarlo directo desde Inicio.',
                'Al finalizar la sesión, el día se marca solo como completado (tilde verde) y desde ahí podés "Ver el resultado".',
                'Si un día no lo vas a hacer: "Saltear". Si te equivocaste: "Reabrir".',
                'Arriba ves el avance: % de días hechos, Adherencia, Racha y Pendientes. En fechas fijas podés cambiar entre vista Calendario y Agenda.',
                'Si te atrasaste aparece "N días atrasados → Correr el plan": mueve todo lo pendiente unos días hacia adelante. Para mover un solo día, usá "Reprogramar" en ese día.',
              ]}
            />

            <Card>
              <CardTitle icon={<Star size={16} />}>Estados del plan</CardTitle>
              <p className="text-sm text-gray-300 leading-relaxed">
                Solo puede haber <span className="text-white font-semibold">un plan Activo</span> a la vez (es el que se
                ve en Inicio). Un plan recién creado queda Activo enseguida y el que tenías antes pasa a Archivado.
                &quot;Duplicar&quot; copia un plan como Borrador (útil para repetir uno que te gustó); lo ponés en marcha
                con &quot;Activar plan&quot; desde la lista. Cuando hacés todos los días, el plan queda Completado.
              </p>
            </Card>
          </div>
        </CollapsibleSection>

        {/* ── Challenges ── */}
        <CollapsibleSection title="Challenges de calistenia">
          <div className="flex flex-col gap-3">
            <Card>
              <p className="text-sm text-gray-300 leading-relaxed">
                Retos con peso corporal que te llevan a una meta: 100 flexiones, 200 abdominales, 200 sentadillas,
                150 fondos en silla, 150 zancadas, 50 burpees, plancha de 5 minutos, y retos de 30 días. La app arma
                cada sesión (series, repeticiones y descansos) y la ajusta según cómo te va.
              </p>
              <p className="text-xs text-gray-500">
                Dónde está: Clases → pestaña <span className="text-gray-300">Challenges</span>, o Inicio → Challenges.
                Arriba ves los que tenés &quot;En curso&quot; y abajo el &quot;Catálogo&quot; completo.
              </p>
            </Card>

            <FlowCard
              icon={<Trophy size={18} />}
              title="Empezar un challenge"
              when="Tocá uno del catálogo para ver de qué se trata."
              steps={[
                'Leé el aviso de seguridad y el equipamiento que necesitás.',
                'En los challenges de meta (ej: 100 flexiones) primero hacés un test inicial: todas las repeticiones seguidas que puedas con buena técnica. Con ese número la app te asigna nivel Principiante, Intermedio o Avanzado.',
                'Elegí la fecha de inicio. Son 3 sesiones por semana con un día de descanso entre medio. Los de "30 días" son diarios.',
                'Si el ejercicio te cuesta, marcá "Usar la versión fácil" (ej: flexiones de rodillas).',
                'Abajo ves cómo será el primer día. Tocá "Empezar challenge".',
              ]}
            />

            <FlowCard
              icon={<Play size={18} />}
              title="Hacer la sesión del día"
              when='Desde Inicio, o en el challenge → botón "Empezar" del día que toca.'
              steps={[
                'La pantalla te guía serie por serie. Las series por repeticiones esperan a que termines: ajustás con + / − las reps que hiciste de verdad y seguís.',
                'Los descansos corren solos, con aviso sonoro cuando termina.',
                'La última serie suele ser "al máximo": hacé todas las que puedas.',
                'Al final te pregunta cómo te sentiste y el día queda completado. Si cortaste a la mitad, el botón dice "Retomar".',
              ]}
            />

            <Card>
              <CardTitle icon={<ClipboardList size={16} />}>Retests, atrasos y gráfico</CardTitle>
              <StepList
                steps={[
                  'En algunas semanas aparece "Retest de la semana N": hacés otra vez el máximo y la app recalcula tu nivel antes de seguir. No podés avanzar sin cargarlo.',
                  'Si una semana te quedó grande, tocá "No pude completar" en esa semana para repetirla.',
                  'Si te salteaste 2 o más sesiones aparece "Reprogramar desde hoy", que corre los días pendientes.',
                  'El gráfico muestra el volumen de cada sesión y los resultados de tus tests, para ver cómo progresás.',
                  'Podés tener varios challenges a la vez y además un plan activo: no se pisan entre sí.',
                ]}
              />
            </Card>

            <Tip>
              Ejemplo: en el test de flexiones hiciste 12, así que te toca nivel Intermedio. El lunes la app te pide
              algo como 8-10-8-8-al máximo con 60 s de descanso. Cada semana sube un poco, hasta llegar a 100.
            </Tip>
          </div>
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
        <CollapsibleSection title="Configuración">
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
                clases); archivar clases viejas; probar si un link de video se reproduce bien; y corregir sesiones
                ya guardadas (duración, sensación, valores).
              </p>
            </Card>

            <Card>
              <CardTitle icon={<Cloud size={16} />}>Contenido online</CardTitle>
              <p className="text-sm text-gray-300 leading-relaxed">
                Cada tanto se publican clases, ejercicios (con sus imágenes), planes y challenges nuevos. Con{' '}
                <span className="text-white font-semibold">&quot;Actualizar contenido&quot;</span> los bajás a tu
                celular (hace falta internet). Debajo del botón ves qué versión tenés y cuándo actualizaste.
              </p>
              <StepList
                steps={[
                  'Suma lo nuevo y actualiza lo que cambió en la versión publicada.',
                  'Nunca toca lo que creaste o editaste vos: eso queda como está (el resumen avisa cuántos no se cambiaron por eso).',
                  'No borra ni modifica tus sesiones, resultados ni récords.',
                ]}
              />
              <p className="text-xs text-gray-600">
                &quot;Publicar contenido&quot; aparece solo en la versión de administrador, no hace falta usarlo.
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
                  'Fusionar ejercicios: si tenés el mismo ejercicio cargado dos veces, pasa todas sus clases, sesiones y récords a uno solo y borra el otro.',
                  'Ejercicios sin uso: lista los ejercicios que no están en ninguna clase, sesión ni récord para borrarlos y limpiar el catálogo. Antes de borrar podés desmarcar los que quieras conservar. No se puede deshacer.',
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
