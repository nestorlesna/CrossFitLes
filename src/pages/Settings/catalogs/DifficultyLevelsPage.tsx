// Página de gestión de niveles de dificultad
import { CatalogManager } from '../../../components/catalogs/CatalogManager';

export function DifficultyLevelsPage() {
  return (
    <CatalogManager
      title="Niveles de dificultad"
      tableName="difficulty_level"
      fields={[
        {
          key: 'name',
          label: 'Nombre',
          type: 'text',
          required: true,
          placeholder: 'Ej: Básico',
        },
        {
          key: 'description',
          label: 'Descripción',
          type: 'textarea',
          placeholder: 'Descripción opcional',
        },
        {
          key: 'color',
          label: 'Color',
          type: 'color',
        },
        {
          key: 'numeric_value',
          label: 'Valor numérico',
          type: 'number',
          placeholder: 'Ej: 1',
        },
      ]}
    />
  );
}
