import { Header } from '../../components/layout/Header';
import { Plus } from 'lucide-react';

export function SessionsPage() {
  return (
    <>
      <Header
        title="Sesiones"
        rightAction={
          <button className="text-primary-500 hover:text-primary-400 p-1">
            <Plus size={24} />
          </button>
        }
      />
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <p className="text-lg">Sesiones de entrenamiento</p>
        <p className="text-sm mt-1">Próximamente en Fase 4</p>
      </div>
    </>
  );
}
