// Componente Header - barra superior de la app

import React from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  leftAction?: React.ReactNode;
}

export function Header({ title, subtitle, rightAction, leftAction }: HeaderProps) {
  return (
    <header className="bg-gray-900 border-b border-gray-800 safe-top sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Acción izquierda (ej: botón de volver) */}
        <div className="w-10">
          {leftAction}
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
