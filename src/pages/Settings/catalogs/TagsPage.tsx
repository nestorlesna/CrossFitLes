// Página de gestión de tags
import { CatalogManager } from '../../../components/catalogs/CatalogManager';

export function TagsPage() {
  return (
    <CatalogManager
      title="Tags"
      tableName="tag"
      fields={[
        {
          key: 'name',
          label: 'Nombre',
          type: 'text',
          required: true,
          placeholder: 'Ej: cardio',
        },
        {
          key: 'color',
          label: 'Color',
          type: 'color',
        },
      ]}
    />
  );
}
