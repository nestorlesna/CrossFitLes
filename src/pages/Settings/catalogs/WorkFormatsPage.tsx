// Página de gestión de formatos de trabajo
import { CatalogManager } from '../../../components/catalogs/CatalogManager';

export function WorkFormatsPage() {
  return (
    <CatalogManager
      title="Formatos de trabajo"
      tableName="work_format"
      fields={[
        {
          key: 'name',
          label: 'Nombre',
          type: 'text',
          required: true,
          placeholder: 'Ej: AMRAP',
        },
        {
          key: 'description',
          label: 'Descripción',
          type: 'textarea',
          placeholder: 'Descripción opcional',
        },
        {
          key: 'has_time_cap',
          label: 'Tiene time cap',
          type: 'select',
          options: [
            { value: '1', label: 'Sí' },
            { value: '0', label: 'No' },
          ],
        },
        {
          key: 'has_rounds',
          label: 'Tiene rondas',
          type: 'select',
          options: [
            { value: '1', label: 'Sí' },
            { value: '0', label: 'No' },
          ],
        },
        {
          key: 'is_interval',
          label: 'Ventana fija (cronómetro)',
          type: 'select',
          options: [
            { value: '1', label: 'Intervalo fijo' },
            { value: '0', label: 'Sin intervalo' },
          ],
        },
        {
          key: 'default_interval_seconds',
          label: 'Segundos por ventana',
          type: 'number',
          placeholder: 'Ej: 60 para un EMOM',
        },
      ]}
    />
  );
}
