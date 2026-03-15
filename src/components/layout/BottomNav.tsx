// Componente BottomNav - navegación inferior de la app

import React from 'react';
import { NavLink } from 'react-router-dom';
import { Dumbbell, CalendarDays, Timer, BarChart2, Settings } from 'lucide-react';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const navItems: NavItem[] = [
  { to: '/ejercicios', icon: <Dumbbell size={22} />, label: 'Ejercicios' },
  { to: '/clases', icon: <CalendarDays size={22} />, label: 'Clases' },
  { to: '/sesiones', icon: <Timer size={22} />, label: 'Sesiones' },
  { to: '/estadisticas', icon: <BarChart2 size={22} />, label: 'Stats' },
  { to: '/configuracion', icon: <Settings size={22} />, label: 'Config' },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 safe-bottom z-50">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                isActive
                  ? 'text-primary-500'
                  : 'text-gray-500 hover:text-gray-300'
              }`
            }
          >
            {item.icon}
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
