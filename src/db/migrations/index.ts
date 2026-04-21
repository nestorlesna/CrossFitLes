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
];
