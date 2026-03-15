// Badge con color de fondo dinámico
interface BadgeProps {
  label: string;
  color?: string;
  size?: 'sm' | 'md';
}

export function Badge({ label, color, size = 'md' }: BadgeProps) {
  const sizeClasses = size === 'sm'
    ? 'text-xs px-2 py-0.5'
    : 'text-sm px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses}`}
      style={
        color
          ? { backgroundColor: `${color}33`, color, border: `1px solid ${color}55` }
          : { backgroundColor: '#374151', color: '#9ca3af', border: '1px solid #4b5563' }
      }
    >
      {label}
    </span>
  );
}
