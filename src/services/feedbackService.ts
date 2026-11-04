// "Enviar comentario": abre un chat de WhatsApp con el autor, con un mensaje pre-cargado
// que trae lo necesario para reproducir un problema (versión de la app, Android y modelo).
//
// Interruptor remoto: si el manifest.json del repo de contenido trae `feedbackUrl`, se usa
// ese destino (otro WhatsApp, un formulario, un mail...) sin necesidad de publicar un APK.
// Para cambiarlo: definir PUBLISHED_FEEDBACK_URL, "Publicar contenido" en dev y luego
// `.\scripts\release.ps1 -ContentOnly`. Sin internet o sin valor remoto se usa WhatsApp.

import { APP_SHORT_NAME, APP_VERSION } from '../utils/constants';
import { CONTENT_BASE_URL, MANIFEST_PATH } from './contentFormat';

// Número en formato internacional, sin "+" ni espacios (+598 99 447 598)
export const FEEDBACK_WHATSAPP = '59899447598';
const DEFAULT_FEEDBACK_URL = `https://wa.me/${FEEDBACK_WHATSAPP}`;

// Destino que se publica en manifest.json (null = no publicar override, se usa WhatsApp)
export const PUBLISHED_FEEDBACK_URL: string | null = null;

const MANIFEST_TIMEOUT_MS = 3000;

// "Android 14 · Pixel 7" a partir del userAgent del WebView (no hace falta otro plugin)
function describeDevice(): string {
  const ua = navigator.userAgent;
  const android = ua.match(/Android\s([\d.]+);\s*([^;)]+?)(?:\sBuild\/[^;)]*)?[;)]/);
  if (android) {
    const model = android[2].trim();
    return model && model !== 'K' ? `Android ${android[1]} · ${model}` : `Android ${android[1]}`;
  }
  return 'Navegador';
}

export function buildFeedbackMessage(): string {
  return [
    `¡Hola! Te escribo desde la app ${APP_SHORT_NAME} (v${APP_VERSION} · ${describeDevice()}).`,
    '',
    'Tipo (error / mejora / comentario): ',
    '¿Qué pasó o qué te gustaría?: ',
    '¿Qué esperabas que pasara?: ',
  ].join('\n');
}

// Lee el override remoto; ante cualquier problema devuelve null y se usa el destino embebido
async function fetchRemoteFeedbackUrl(): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), MANIFEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${CONTENT_BASE_URL}/${MANIFEST_PATH}?t=${Date.now()}`, {
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const manifest = await res.json();
    const url = manifest?.feedbackUrl;
    return typeof url === 'string' && /^(https:|mailto:)/.test(url) ? url : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function isWhatsAppUrl(url: string): boolean {
  return /^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(url);
}

export async function openFeedback(): Promise<void> {
  const base = (await fetchRemoteFeedbackUrl()) ?? DEFAULT_FEEDBACK_URL;
  const url = isWhatsAppUrl(base)
    ? `${base}${base.includes('?') ? '&' : '?'}text=${encodeURIComponent(buildFeedbackMessage())}`
    : base;
  // '_system': en Android lo abre fuera del WebView (la app de WhatsApp toma los links wa.me)
  window.open(url, '_system', 'noopener,noreferrer');
}
