// Servicio de gestión de imágenes/media
// Funciona tanto en web (dev) como en nativo (Android/Capacitor)
// Las imágenes de usuario se almacenan en SQLite (tabla exercise_image)

import { Capacitor } from '@capacitor/core';
import { generateUUID } from '../utils/formatters';
import { getDatabase, saveDatabase } from '../db/database';

// Subtipos de directorios de media
type MediaSubdir = 'muscles' | 'equipment' | 'exercises' | 'other';

interface PickImageResult {
  // Ruta relativa para identificar la imagen (ej: exercises/uuid.svg)
  path: string;
  // Data URL base64 para mostrar en la UI
  dataUrl: string;
}

// ─── Guardar imagen en SQLite ──────────────────────────────────────────────

async function saveImageToSqlite(path: string, dataUrl: string): Promise<void> {
  const db = getDatabase();
  await db.run(
    `INSERT OR REPLACE INTO exercise_image (id, exercise_id, data_url) VALUES (?, ?, ?)`,
    [path, path.split('/')[1] ?? path, dataUrl]
  );
  await saveDatabase();
}

// ─── Leer imagen desde SQLite ──────────────────────────────────────────────

async function getImageFromSqlite(path: string): Promise<string | null> {
  try {
    const db = getDatabase();
    const result = await db.query(
      `SELECT data_url FROM exercise_image WHERE id = ?`,
      [path]
    );
    const rows = result.values as { data_url: string }[] | undefined;
    return rows && rows.length > 0 ? rows[0].data_url : null;
  } catch {
    return null;
  }
}

// ─── Eliminar imagen desde SQLite ──────────────────────────────────────────

async function deleteImageFromSqlite(path: string): Promise<void> {
  try {
    const db = getDatabase();
    await db.run(`DELETE FROM exercise_image WHERE id = ?`, [path]);
    await saveDatabase();
  } catch {
    console.warn('[Media] No se pudo eliminar imagen de SQLite:', path);
  }
}

// ─── Implementación WEB (file input) ───────────────────────────────────────

function pickImageWeb(subdir: MediaSubdir): Promise<PickImageResult> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        reject(new Error('No se seleccionó ninguna imagen'));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const ext = file.name.split('.').pop() ?? 'jpg';
        const filename = `${generateUUID()}.${ext}`;
        const path = `${subdir}/${filename}`;

        // Guardar en SQLite (compartido entre web y Android)
        saveImageToSqlite(path, dataUrl).catch((e) =>
          console.warn('[Media] Error guardando en SQLite:', e)
        );

        resolve({ path, dataUrl });
      };
      reader.onerror = () => reject(new Error('Error al leer la imagen'));
      reader.readAsDataURL(file);
    };

    input.oncancel = () => reject(new Error('Selección cancelada'));

    document.body.appendChild(input);
    input.click();

    setTimeout(() => {
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
    }, 60000);
  });
}

// ─── Implementación NATIVA (Android) ──────────────────────────────────────

async function pickImageNative(subdir: MediaSubdir): Promise<PickImageResult> {
  const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
  const { Filesystem, Directory } = await import('@capacitor/filesystem');

  const photo = await Camera.getPhoto({
    quality: 80,
    allowEditing: false,
    resultType: CameraResultType.Base64,
    source: CameraSource.Photos,
  });

  const base64Data = photo.base64String ?? '';
  const ext = photo.format ?? 'jpeg';
  const filename = `${generateUUID()}.${ext}`;
  const relativePath = `${subdir}/${filename}`;
  const fullPath = `crossfit-tracker/media/${relativePath}`;

  await Filesystem.writeFile({
    path: fullPath,
    data: base64Data,
    directory: Directory.Data,
    recursive: true,
  });

  // También guardar en SQLite para consistencia cross-platform
  const dataUrl = `data:image/${ext};base64,${base64Data}`;
  saveImageToSqlite(relativePath, dataUrl).catch((e) =>
    console.warn('[Media] Error guardando en SQLite:', e)
  );

  return { path: relativePath, dataUrl };
}

// Lee una imagen del sistema de archivos nativo y devuelve una URL HTTP accesible por WebView.
// Usa Capacitor.convertFileSrc() para evitar las limitaciones de data URIs en Android WebView
// (imágenes grandes en base64 no se renderizan correctamente en WebView de Android).
async function getImageDisplayUrlNative(path: string): Promise<string | null> {
  try {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const fullPath = `crossfit-tracker/media/${path}`;

    // Obtener URI del archivo y convertir a URL HTTP para WebView
    const uriResult = await Filesystem.getUri({
      path: fullPath,
      directory: Directory.Data,
    });
    return Capacitor.convertFileSrc(uriResult.uri);
  } catch {
    // El archivo no existe en el filesystem (puede ser una imagen importada solo en SQLite)
    return null;
  }
}

// Asegura que una imagen almacenada en SQLite también exista en el filesystem nativo.
// Se usa como paso de reparación al importar imágenes desde backups en Android.
async function ensureImageInFilesystem(path: string, dataUrl: string): Promise<void> {
  try {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const fullPath = `crossfit-tracker/media/${path}`;
    const base64 = dataUrl.split(',')[1];
    if (!base64) return;
    await Filesystem.writeFile({
      path: fullPath,
      data: base64,
      directory: Directory.Data,
      recursive: true,
    });
  } catch {
    console.warn('[Media] No se pudo escribir imagen al filesystem:', path);
  }
}

// Elimina una imagen del sistema de archivos nativo
async function deleteImageNative(path: string): Promise<void> {
  try {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const fullPath = `crossfit-tracker/media/${path}`;
    await Filesystem.deleteFile({
      path: fullPath,
      directory: Directory.Data,
    });
  } catch {
    console.warn('[Media] No se pudo eliminar el archivo:', path);
  }
}

// ─── API PÚBLICA ───────────────────────────────────────────────────────────

export async function pickImage(subdir: MediaSubdir): Promise<PickImageResult> {
  if (Capacitor.getPlatform() === 'web') {
    return pickImageWeb(subdir);
  }
  return pickImageNative(subdir);
}

// Devuelve una URL para mostrar una imagen dado su path relativo o una ruta estática.
// En Android, prioriza el sistema de archivos (URL HTTP via convertFileSrc) sobre el
// data_url de SQLite, para evitar las limitaciones de data URIs grandes en WebView.
export async function getImageDisplayUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;

  // 1. Si es una ruta estática de la aplicación (Assets) o ya es una data URL
  if (path.startsWith('/img/') || path.startsWith('http') || path.startsWith('data:')) {
    return path;
  }

  // 2. En Android, intentar primero el sistema de archivos nativo.
  //    El filesystem da URLs HTTP que el WebView maneja sin límites de tamaño,
  //    a diferencia de los data URIs base64 que pueden fallar con imágenes grandes.
  if (Capacitor.getPlatform() !== 'web') {
    const nativeResult = await getImageDisplayUrlNative(path);
    if (nativeResult) return nativeResult;
  }

  // 3. Intentar en SQLite (fuente principal en web, fallback en Android)
  const sqliteResult = await getImageFromSqlite(path);
  if (sqliteResult) {
    // En Android: si la imagen estaba solo en SQLite (no en filesystem), la migra al
    // filesystem para que las próximas consultas usen la URL HTTP más eficiente.
    if (Capacitor.getPlatform() !== 'web') {
      ensureImageInFilesystem(path, sqliteResult).catch(() => {});
    }
    return sqliteResult;
  }

  return null;
}

// Elimina una imagen por su path relativo
export async function deleteImage(path: string): Promise<void> {
  if (!path) return;

  // Eliminar de SQLite
  await deleteImageFromSqlite(path);

  // Eliminar de filesystem nativo si aplica
  if (Capacitor.getPlatform() !== 'web') {
    await deleteImageNative(path);
  }
}
