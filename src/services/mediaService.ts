// Servicio de gestión de imágenes/media
// Funciona tanto en web (dev) como en nativo (Android/Capacitor)

import { Capacitor } from '@capacitor/core';
import { generateUUID } from '../utils/formatters';

// Subtipos de directorios de media
type MediaSubdir = 'muscles' | 'equipment' | 'exercises' | 'other';

interface PickImageResult {
  // Ruta relativa para guardar en SQLite (ej: muscles/uuid.jpg)
  path: string;
  // Data URL base64 para mostrar en la UI
  dataUrl: string;
}

// Clave de prefijo para localStorage en modo web
const LOCAL_STORAGE_PREFIX = 'media_';

// ─── Implementación WEB ────────────────────────────────────────────────────

// Abre un input file invisible y devuelve la imagen seleccionada como base64
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

        // Guardar en localStorage para poder recuperarla después
        try {
          localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${path}`, dataUrl);
        } catch {
          // localStorage puede estar lleno; continuar igual
          console.warn('[Media] No se pudo guardar en localStorage:', path);
        }

        resolve({ path, dataUrl });
      };
      reader.onerror = () => reject(new Error('Error al leer la imagen'));
      reader.readAsDataURL(file);
    };

    // Manejar cancelación (el input pierde foco sin selección)
    input.oncancel = () => reject(new Error('Selección cancelada'));

    document.body.appendChild(input);
    input.click();

    // Limpiar el elemento del DOM después de usarlo
    setTimeout(() => {
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
    }, 60000);
  });
}

// Recupera una imagen guardada en localStorage por su path relativo
function getImageDisplayUrlWeb(path: string): string | null {
  return localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${path}`);
}

// Elimina una imagen de localStorage
function deleteImageWeb(path: string): void {
  localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}${path}`);
}

// ─── Implementación NATIVA (Android) ──────────────────────────────────────

// Selecciona y guarda una imagen usando Capacitor Camera + Filesystem
async function pickImageNative(subdir: MediaSubdir): Promise<PickImageResult> {
  // Importación dinámica para evitar errores en web donde no están disponibles
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

  // Guardar archivo en sistema de archivos del dispositivo
  await Filesystem.writeFile({
    path: fullPath,
    data: base64Data,
    directory: Directory.Data,
    recursive: true,
  });

  const dataUrl = `data:image/${ext};base64,${base64Data}`;
  return { path: relativePath, dataUrl };
}

// Lee una imagen del sistema de archivos nativo y la devuelve como data URL
async function getImageDisplayUrlNative(path: string): Promise<string | null> {
  try {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const fullPath = `crossfit-tracker/media/${path}`;
    const result = await Filesystem.readFile({
      path: fullPath,
      directory: Directory.Data,
    });
    const ext = path.split('.').pop() ?? 'jpeg';
    return `data:image/${ext};base64,${result.data}`;
  } catch {
    return null;
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

// Selecciona una imagen y la guarda; retorna path relativo y dataUrl para UI
export async function pickImage(subdir: MediaSubdir): Promise<PickImageResult> {
  if (Capacitor.getPlatform() === 'web') {
    return pickImageWeb(subdir);
  }
  return pickImageNative(subdir);
}

// Devuelve una data URL para mostrar una imagen dado su path relativo
export async function getImageDisplayUrl(path: string): Promise<string | null> {
  if (!path) return null;

  if (Capacitor.getPlatform() === 'web') {
    return getImageDisplayUrlWeb(path);
  }
  return getImageDisplayUrlNative(path);
}

// Elimina una imagen por su path relativo
export async function deleteImage(path: string): Promise<void> {
  if (!path) return;

  if (Capacitor.getPlatform() === 'web') {
    deleteImageWeb(path);
    return;
  }
  await deleteImageNative(path);
}
