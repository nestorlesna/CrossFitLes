// Migración v015: video de cabecera en la plantilla de clase
// Cuando la clase tiene un video, la sesión se ejecuta en modo "clase por video":
// se muestra el video a pantalla completa y al terminar se cierra la sesión igual
// que en la clase guiada por cronómetro (duración, calorías, sensación, etc.).
import { Migration } from '../../services/migrationService';

export const v015_class_template_video: Migration = {
  version: 15,
  name: 'v015_class_template_video',
  up: [
    `ALTER TABLE class_template ADD COLUMN video_url TEXT`,
    // Duración del video en segundos: permite cerrar la clase automáticamente al
    // terminar (los reproductores embebidos de terceros no avisan cuándo terminan).
    `ALTER TABLE class_template ADD COLUMN video_duration_seconds INTEGER`,
  ],
  down: [],
};
