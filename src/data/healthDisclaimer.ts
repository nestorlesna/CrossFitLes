// Descargo de salud: lo acepta el usuario en el primer arranque (WelcomeScreen) y se repite en
// Acerca de. Si cambia el texto de forma relevante, subir HEALTH_DISCLAIMER_VERSION: la app lo
// vuelve a pedir a todos. Mantener igual al de la página de Términos (Fase 5).

export const HEALTH_DISCLAIMER_VERSION = 1;

export const HEALTH_DISCLAIMER_TITLE = 'Antes de entrenar';

export const HEALTH_DISCLAIMER_POINTS: string[] = [
  'Esta app es una herramienta para registrar tus entrenamientos. No es asesoramiento médico ni profesional.',
  'Consultá a un médico antes de empezar, sobre todo si tenés problemas cardíacos, lesiones, estás embarazada o tenés más de 40 años y no venías haciendo actividad.',
  'Los pesos, tiempos, repeticiones y escalados de las clases son sugerencias: adaptalos a tu nivel.',
  'Si sentís dolor, mareo o falta de aire, pará.',
  'Menores de 18 años, sólo con la supervisión de un adulto o un entrenador.',
  'Usás la app bajo tu propia responsabilidad: el autor no responde por lesiones ni daños derivados de su uso.',
];
