// Registry de migraciones - agregar nuevas migraciones aquí en orden
import { Migration } from '../../services/migrationService';
import { v001_initial } from './v001_initial';
import { v002_section_type_sort_order } from './v002_section_type_sort_order';
import { v003_exercise_video_long } from './v003_exercise_video_long';
import { v004_exercise_image_url } from './v004_exercise_image_url';
import { v005_clean_images } from './v005_clean_images';
import { v006_user_profile } from './v006_user_profile';
import { v007_met_calories } from './v007_met_calories';
import { v008_class_template_type } from './v008_class_template_type';
import { v009_exercise_images } from './v009_exercise_images';
import { v010_fix_exercise_image_fk } from './v010_fix_exercise_image_fk';
import { v011_timer_mode } from './v011_timer_mode';
import { v012_free_timer_templates } from './v012_free_timer_templates';
import { v013_session_result_class_section } from './v013_session_result_class_section';
import { v014_movilidad_section_type } from './v014_movilidad_section_type';

export const migrations: Migration[] = [
  v001_initial,
  v002_section_type_sort_order,
  v003_exercise_video_long,
  v004_exercise_image_url,
  v005_clean_images,
  v006_user_profile,
  v007_met_calories,
  v008_class_template_type,
  v009_exercise_images,
  v010_fix_exercise_image_fk,
  v011_timer_mode,
  v012_free_timer_templates,
  v013_session_result_class_section,
  v014_movilidad_section_type,
];
