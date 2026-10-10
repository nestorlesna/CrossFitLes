// Formato del contenido publicado en el repo público CrossFitLes-content.
// Lo comparten contentPublishService (genera) y contentSyncService (aplica).
//
// Estructura del repo:
//   manifest.json          ← chico, se baja primero para saber si hay algo nuevo
//   content/content.json   ← catálogos, ejercicios (con imagen), clases y planes
//
// Las referencias entre entidades van por "key" (global_key del publicador), nunca por el
// id local: cada dispositivo genera sus propios ids al importar.

import type { ChallengeDefinition } from '../models/Challenge';

const CONTENT_OWNER = 'nestorlesna';
const CONTENT_REPO = 'CrossFitLes-content';
const CONTENT_BRANCH = 'main';

// raw.githubusercontent tiene CORS abierto y caché corta (~5 min).
// VITE_CONTENT_BASE_URL=/__content/raw permite probar en dev contra el clon local (ver vite.config.ts).
export const CONTENT_BASE_URL =
  import.meta.env.VITE_CONTENT_BASE_URL ||
  `https://raw.githubusercontent.com/${CONTENT_OWNER}/${CONTENT_REPO}/${CONTENT_BRANCH}`;
export const MANIFEST_PATH = 'manifest.json';
export const CONTENT_PATH = 'content/content.json';

export const CONTENT_APP = 'CrossFit Session Tracker';

// Versión del formato del archivo. Subirla sólo ante cambios incompatibles: las apps viejas
// verán "actualizá la app" en vez de importar datos que no entienden.
export const CONTENT_FORMAT = 1;

export const CATALOG_TABLES = [
  'muscle_group',
  'equipment',
  'measurement_unit',
  'difficulty_level',
  'tag',
  'section_type',
  'work_format',
] as const;
export type CatalogTable = (typeof CATALOG_TABLES)[number];

export type Row = Record<string, unknown>;

export interface ContentCounts {
  exercises: number;
  classes: number;
  plans: number;
  challenges?: number;
}

export interface ContentManifest {
  app: string;
  format: number;
  contentVersion: number;
  publishedAt: string;
  contentHash: string;
  counts: ContentCounts;
  files: { path: string; size: number }[];
}

// Imagen embebida de un ejercicio (SVG o foto) como data URL
export interface RemoteImage {
  path: string;
  dataUrl: string;
}

export interface RemoteExercise {
  key: string;
  hash: string;
  row: Row; // columnas de exercise sin id/claves de sync/fechas; catálogos por id del publicador
  relations: {
    muscle_groups: { muscle_group_id: string; is_primary: number }[];
    equipment: { equipment_id: string; is_required: number }[];
    section_types: { section_type_id: string }[];
    units: { measurement_unit_id: string; is_default: number }[];
    tags: { tag_id: string }[];
  };
  image: RemoteImage | null;
}

export interface RemoteSection {
  row: Row; // section_type_id / work_format_id por id del publicador
  exercises: (Row & { exercise_key: string })[];
}

export interface RemoteClass {
  key: string;
  hash: string;
  row: Row;
  sections: RemoteSection[];
}

export interface RemotePlanDay {
  row: Row; // day_index, scheduled_date, day_type, title, notes
  class_key: string | null; // día que apunta a una clase publicada
  template: Omit<RemoteClass, 'key' | 'hash'> | null; // plantilla privada del día (is_plan_day = 1)
}

export interface RemotePlan {
  key: string;
  hash: string;
  row: Row;
  days: RemotePlanDay[];
}

export interface ContentFile {
  app: string;
  format: number;
  contentVersion: number;
  publishedAt: string;
  catalogs: Record<CatalogTable, Row[]>;
  exercises: RemoteExercise[];
  classes: RemoteClass[];
  plans: RemotePlan[];
  // Opcional: contenidos viejos no lo traen. Definiciones completas, con ejercicios por nombre.
  challenges?: ChallengeDefinition[];
}

// Columnas propias de cada dispositivo: nunca viajan en el contenido
export const LOCAL_ONLY_COLUMNS = [
  'id',
  'global_key',
  'origin',
  'remote_hash',
  'user_modified',
  'created_at',
  'updated_at',
];

export function stripLocalColumns(row: Row, extra: string[] = []): Row {
  const out: Row = {};
  for (const [k, v] of Object.entries(row)) {
    if (!LOCAL_ONLY_COLUMNS.includes(k) && !extra.includes(k)) out[k] = v;
  }
  return out;
}

// Hash rápido y estable (cyrb53) para detectar cambios entre publicaciones
export function hashString(str: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, '0');
}

export function hashOf(value: unknown): string {
  return hashString(JSON.stringify(value));
}

// Nombre normalizado para comparar (minúsculas, sin acentos ni espacios extra)
export function normalizeName(name: unknown): string {
  return String(name ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function nowSql(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}
