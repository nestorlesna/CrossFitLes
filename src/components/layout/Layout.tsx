// Componente Layout principal - envuelve todas las páginas

import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

export function Layout() {
  return (
    <div className="flex flex-col min-h-dvh bg-gray-950">
      {/* Contenido principal con padding inferior para el BottomNav */}
      <main className="flex-1 pb-safe overflow-y-auto">
        <Outlet />
      </main>

      {/* Navegación inferior */}
      <BottomNav />
    </div>
  );
}
