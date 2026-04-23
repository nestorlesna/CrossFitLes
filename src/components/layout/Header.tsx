// Componente Header - barra superior de la app

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { House } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  leftAction?: React.ReactNode;
}

export function Header({ title, subtitle, rightAction, leftAction }: HeaderProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isHome = pathname === '/inicio';

  const defaultLeft = !isHome && !leftAction ? (
    <button
      onClick={() => navigate('/inicio')}
      className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors active:scale-90"
      aria-label="Ir al inicio"
    >
      <House size={20} />
    </button>
  ) : leftAction;

  return (
    <header className="bg-gray-900 border-b border-gray-800 safe-top sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Acción izquierda (ej: botón de volver o casa) */}
        <div className="w-10">
          {defaultLeft}
        </div>

        {/* Título centrado */}
        <div className="flex-1 text-center">
          <h1 className="text-lg font-semibold text-white truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs text-gray-400 truncate">{subtitle}</p>
          )}
        </div>

        {/* Acción derecha (ej: botón de agregar) */}
        <div className="w-10 flex justify-end">
          {rightAction}
        </div>
      </div>
    </header>
  );
}
