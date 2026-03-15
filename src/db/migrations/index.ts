// Registry de migraciones - agregar nuevas migraciones aquí en orden
import { Migration } from '../../services/migrationService';
import { v001_initial } from './v001_initial';
import { v002_section_type_sort_order } from './v002_section_type_sort_order';

export const migrations: Migration[] = [
  v001_initial,
  v002_section_type_sort_order,
];
