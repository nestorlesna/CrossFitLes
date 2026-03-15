// Página de gestión de grupos musculares
import { CatalogManager } from '../../../components/catalogs/CatalogManager';

export function MuscleGroupsPage() {
  return (
    <CatalogManager
      title="Grupos musculares"
      tableName="muscle_group"
      hasImage
      imageSubdir="muscles"
      fields={[
        {
          key: 'name',
          label: 'Nombre',
          type: 'text',
          required: true,
          placeholder: 'Ej: Pectorales',
        },
        {
          key: 'description',
          label: 'Descripción',
          type: 'textarea',
          placeholder: 'Descripción opcional',
        },
        {
          key: 'body_zone',
          label: 'Zona del cuerpo',
          type: 'select',
          options: [
            { value: 'upper_body', label: 'Tren superior' },
            { value: 'lower_body', label: 'Tren inferior' },
            { value: 'core', label: 'Core' },
            { value: 'full_body', label: 'Cuerpo completo' },
          ],
        },
      ]}
    />
  );
}
