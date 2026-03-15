import { Header } from '../../components/layout/Header';

export function StatsPage() {
  return (
    <>
      <Header title="Estadísticas" />
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <p className="text-lg">Estadísticas y progresión</p>
        <p className="text-sm mt-1">Próximamente en Fase 5</p>
      </div>
    </>
  );
}
