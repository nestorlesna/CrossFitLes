// Página de gestión de equipamiento
import { CatalogManager } from '../../../components/catalogs/CatalogManager';

export function EquipmentPage() {
  return (
    <CatalogManager
      title="Equipamiento"
      tableName="equipment"
      hasImage
      imageSubdir="equipment"
      fields={[
        {
          key: 'name',
          label: 'Nombre',
          type: 'text',
          required: true,
          placeholder: 'Ej: Barra olímpica',
        },
        {
          key: 'description',
          label: 'Descripción',
          type: 'textarea',
          placeholder: 'Descripción opcional',
        },
        {
          key: 'category',
          label: 'Categoría',
          type: 'select',
          options: [
            { value: 'barbell', label: 'Barra' },
            { value: 'dumbbell', label: 'Mancuerna' },
            { value: 'kettlebell', label: 'Kettlebell' },
            { value: 'machine', label: 'Máquina' },
            { value: 'bodyweight', label: 'Peso corporal' },
            { value: 'cardio', label: 'Cardio' },
            { value: 'other', label: 'Otro' },
          ],
        },
      ]}
    />
  );
}
