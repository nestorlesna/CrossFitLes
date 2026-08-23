// Control segmentado que alterna entre las clases y los planes de entrenamiento
import { useNavigate } from 'react-router-dom';
import { LayoutTemplate, CalendarRange } from 'lucide-react';

interface PlansTabsProps {
  active: 'classes' | 'plans';
}

export function PlansTabs({ active }: PlansTabsProps) {
  const navigate = useNavigate();

  const tabs = [
    { key: 'classes' as const, label: 'Clases', icon: LayoutTemplate, path: '/clases' },
    { key: 'plans' as const, label: 'Planes', icon: CalendarRange, path: '/planes' },
  ];

  return (
    <div className="flex bg-gray-900 border border-gray-800 rounded-xl p-1 gap-1">
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        const Icon = tab.icon;
        return (
          <button
            key={tab.key}
            onClick={() => !isActive && navigate(tab.path)}
            aria-current={isActive ? 'page' : undefined}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors min-h-[40px] ${
              isActive
                ? 'bg-primary-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Icon size={16} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
