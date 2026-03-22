// Servicio de backup avanzado: exportar e importar datos de la BD y MEDIA como archivo ZIP
// Permite migrar el sistema completo entre dispositivos, incluyendo imágenes.

import { Capacitor } from '@capacitor/core';
import JSZip from 'jszip';
import { getDatabase } from '../db/database';
import { APP_VERSION } from '../utils/constants';

// Orden de tablas respetando dependencias (padres primero)
const TABLE_ORDER = [
  'muscle_group',
  'equipment',
  'measurement_unit',
  'difficulty_level',
  'tag',
  'section_type',
  'work_format',
  'exercise',
  'exercise_muscle_group',
  'exercise_equipment',
  'exercise_section_type',
  'exercise_unit',
  'exercise_tag',
  'class_template',
  'class_section',
  'section_exercise',
  'training_session',
  'session_exercise_result',
  'personal_record',
] as const;

// Estructura del JSON interno del ZIP
interface BackupJson {
  meta: {
    app: string;
    version: string;
    exportDate: string;
    schemaVersion: number;
    tables: number;
    totalRecords: number;
  };
  data: Record<string, Record<string, unknown>[]>;
}

// ─── EXPORTACIÓN ────────────────────────────────────────────────────────────

/**
 * Exporta base de datos y archivos multimedia en un archivo .zip
 */
export async function exportData(): Promise<void> {
  const db = getDatabase();
  const zip = new JSZip();

  // 1. Obtener datos de la base de datos
  const versionResult = await db.query('SELECT MAX(version) as version FROM _migrations');
  const schemaVersion = (versionResult.values?.[0]?.version as number) ?? 0;

  const data: Record<string, Record<string, unknown>[]> = {};
  let totalRecords = 0;

  for (const table of TABLE_ORDER) {
    const result = await db.query(`SELECT * FROM ${table}`);
    const rows = (result.values ?? []) as Record<string, unknown>[];
    data[table] = rows;
    totalRecords += rows.length;
  }

  const backupJson: BackupJson = {
    meta: {
      app: 'CrossFit Session Tracker',
      version: APP_VERSION,
      exportDate: new Date().toISOString(),
      schemaVersion,
      tables: TABLE_ORDER.length,
      totalRecords,
    },
    data,
  };

  zip.file('data.json', JSON.stringify(backupJson, null, 2));

  // 2. Incluir archivos multimedia (Media)
  const mediaFolder = zip.folder('media');
  
  if (Capacitor.getPlatform() === 'web') {
    // Modo WEB: Leer de localStorage
    const prefix = 'media_';
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) {
        const path = key.replace(prefix, '');
        const dataUrl = localStorage.getItem(key);
        if (dataUrl) {
          // Extraer base64 pura
          const base64 = dataUrl.split(',')[1];
          mediaFolder?.file(path, base64, { base64: true });
        }
      }
    }
  } else {
    // Modo NATIVO: Leer de Filesystem
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const subdirs = ['muscles', 'equipment', 'exercises', 'other'];
    const basePath = 'crossfit-tracker/media';

    for (const subdir of subdirs) {
      try {
        const fullDir = `${basePath}/${subdir}`;
        const dirContent = await Filesystem.readdir({
          path: fullDir,
          directory: Directory.Data,
        });

        for (const file of dirContent.files) {
          const fileData = await Filesystem.readFile({
            path: `${fullDir}/${file.name}`,
            directory: Directory.Data,
          });
          mediaFolder?.file(`${subdir}/${file.name}`, fileData.data, { base64: true });
        }
      } catch (e) {
        // El directorio puede no existir si no hay fotos allí
        console.warn(`[Backup] No se pudo leer directorio ${subdir}:`, e);
      }
    }
  }

  // 3. Generar el ZIP final
  const content = await zip.generateAsync({ type: 'blob' });
  const fileName = `crossfit-backup-${formatDateForFile(new Date())}.zip`;

  if (Capacitor.getPlatform() === 'web') {
    // Descarga en navegador
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    // Guardar y compartir en Nativo (Android)
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');

    // Convertir blob a base64 para Filesystem
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve) => {
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.readAsDataURL(content);
    });

    const base64Data = await base64Promise;

    // Guardar en un lugar temporal para compartir
    const cachePath = `backups/${fileName}`;
    await Filesystem.writeFile({
      path: cachePath,
      data: base64Data,
      directory: Directory.Cache,
      recursive: true,
    });

    const uriResult = await Filesystem.getUri({
      path: cachePath,
      directory: Directory.Cache,
    });

    await Share.share({
      title: 'Backup de CrossFit Tracker',
      text: 'Aquí tienes la copia de seguridad de tus datos.',
      url: uriResult.uri,
      dialogTitle: 'Exportar Backup',
    });
  }
}

// ─── IMPORTACIÓN ────────────────────────────────────────────────────────────

/**
 * Importa base de datos y archivos multimedia desde un Blob ZIP
 */
export async function importDataFromZip(zipFile: Blob): Promise<{ totalRecords: number }> {
  const zip = await JSZip.loadAsync(zipFile);
  
  // 1. Extraer data.json
  const jsonFile = zip.file('data.json');
  if (!jsonFile) throw new Error('El archivo ZIP no contiene el archivo data.json requerido.');
  
  const jsonContent = await jsonFile.async('string');
  const backup: BackupJson = JSON.parse(jsonContent);

  // Validaciones básicas
  if (backup.meta?.app !== 'CrossFit Session Tracker') {
    throw new Error('El archivo no pertenece a CrossFit Session Tracker.');
  }

  const db = getDatabase();
  let totalRecords = 0;

  // 2. Limpiar media actual e importar media nueva
  if (Capacitor.getPlatform() === 'web') {
    // Borrar registros media en localStorage
    const prefix = 'media_';
    const keysToDelete: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(prefix)) keysToDelete.push(key);
    }
    keysToDelete.forEach(k => localStorage.removeItem(k));

    // Importar del ZIP
    const mediaFolder = zip.folder('media');
    if (mediaFolder) {
      const files: string[] = [];
      mediaFolder.forEach((relativePath) => {
        if (!mediaFolder.file(relativePath)?.dir) files.push(relativePath);
      });

      for (const relativePath of files) {
        const file = mediaFolder.file(relativePath);
        if (file) {
          const base64 = await file.async('base64');
          const ext = relativePath.split('.').pop() ?? 'jpeg';
          localStorage.setItem(`${prefix}${relativePath}`, `data:image/${ext};base64,${base64}`);
        }
      }
    }
  } else {
    // Nativo: Borrar carpeta media completa e importar del ZIP
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const basePath = 'crossfit-tracker/media';

    try {
      await Filesystem.rmdir({
        path: basePath,
        directory: Directory.Data,
        recursive: true
      });
    } catch { /* Ignorar si no existe */ }

    const mediaFolder = zip.folder('media');
    if (mediaFolder) {
      const files: string[] = [];
      mediaFolder.forEach((relativePath) => {
        if (!mediaFolder.file(relativePath)?.dir) files.push(relativePath);
      });

      for (const relativePath of files) {
        const file = mediaFolder.file(relativePath);
        if (file) {
          const base64 = await file.async('base64');
          await Filesystem.writeFile({
            path: `${basePath}/${relativePath}`,
            data: base64,
            directory: Directory.Data,
            recursive: true
          });
        }
      }
    }
  }

  // 3. Importar Base de Datos
  const deleteOrder = [...TABLE_ORDER].reverse();
  await db.execute('PRAGMA foreign_keys = OFF;');

  try {
    // Borrar datos anteriores
    for (const table of deleteOrder) {
      await db.execute(`DELETE FROM ${table}`);
    }

    // Insertar datos nuevos
    for (const table of TABLE_ORDER) {
      const rows = backup.data[table];
      if (!rows || rows.length === 0) continue;

      for (const row of rows) {
        const keys = Object.keys(row);
        const values = Object.values(row);
        const placeholders = keys.map(() => '?').join(', ');

        await db.run(
          `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`,
          values as (string | number | null)[]
        );
      }
      totalRecords += rows.length;
    }
  } finally {
    await db.execute('PRAGMA foreign_keys = ON;');
  }

  return { totalRecords };
}


// Auxiliares (mantener compatibilidad con UI actual)
export async function countRecords(): Promise<Record<string, number>> {
  const db = getDatabase();
  const counts: Record<string, number> = {};
  for (const table of TABLE_ORDER) {
    const result = await db.query(`SELECT COUNT(*) as count FROM ${table}`);
    counts[table] = (result.values?.[0]?.count as number) ?? 0;
  }
  return counts;
}

function formatDateForFile(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

