// Selector de color con paleta de colores predefinidos
// Los colores se presentan como círculos clickeables; el seleccionado muestra anillo blanco

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

// Paleta de 16 colores de Tailwind
const PRESET_COLORS = [
  '#ef4444', // red-500
  '#f97316', // orange-500
  '#f59e0b', // amber-500
  '#22c55e', // green-500
  '#06b6d4', // cyan-500
  '#0ea5e9', // sky-500
  '#6366f1', // indigo-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#64748b', // slate-500
  '#94a3b8', // slate-400
  '#1f2937', // gray-800
  '#dc2626', // red-600
  '#16a34a', // green-600
  '#2563eb', // blue-600
  '#7c3aed', // violet-600
];

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {PRESET_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className="rounded-full transition-transform hover:scale-110"
          style={{
            width: 28,
            height: 28,
            backgroundColor: color,
            // Anillo blanco para el color seleccionado
            boxShadow: value === color
              ? `0 0 0 2px #111827, 0 0 0 4px #ffffff`
              : 'none',
          }}
          title={color}
        />
      ))}
    </div>
  );
}
