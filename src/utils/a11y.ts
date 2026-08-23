import type { KeyboardEvent } from 'react';

/**
 * Permite activar con Enter o Espacio un elemento clicable que no es un <button>
 * nativo (por ejemplo una card que ya contiene botones y no puede anidarlos).
 * Usar siempre junto a role="button" y tabIndex={0}.
 */
export function onActivateKey(handler: () => void) {
  return (e: KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    // Dejar que los controles interactivos anidados manejen su propia tecla
    if (e.target !== e.currentTarget) return;
    e.preventDefault();
    handler();
  };
}
