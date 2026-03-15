// Página de gestión de tipos de sección
import { CatalogManager } from '../../../components/catalogs/CatalogManager';

export function SectionTypesPage() {
  return (
    <CatalogManager
      title="Tipos de sección"
      tableName="section_type"
      fields={[
        {
          key: 'name',
          label: 'Nombre',
          type: 'text',
          required: true,
          placeholder: 'Ej: Entrada en calor',
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
          key: 'icon',
          label: 'Ícono (nombre Lucide)',
          type: 'text',
          placeholder: 'Ej: Flame',
        },
        {
          key: 'default_order',
          label: 'Orden por defecto',
          type: 'number',
          placeholder: 'Ej: 1',
        },
      ]}
    />
  );
}
