// Registry de migraciones - agregar nuevas migraciones aquí en orden
import { Migration } from '../../services/migrationService';
import { v001_initial } from './v001_initial';
import { v002_section_type_sort_order } from './v002_section_type_sort_order';
import { v003_exercise_video_long } from './v003_exercise_video_long';
import { v004_exercise_image_url } from './v004_exercise_image_url';

export const migrations: Migration[] = [
  v001_initial,
  v002_section_type_sort_order,
  v003_exercise_video_long,
  v004_exercise_image_url,
];
