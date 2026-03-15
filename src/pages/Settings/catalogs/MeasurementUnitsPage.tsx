// Página de gestión de unidades de medida
import { CatalogManager } from '../../../components/catalogs/CatalogManager';

export function MeasurementUnitsPage() {
  return (
    <CatalogManager
      title="Unidades de medida"
      tableName="measurement_unit"
      fields={[
        {
          key: 'name',
          label: 'Nombre',
          type: 'text',
          required: true,
          placeholder: 'Ej: Kilogramos',
        },
        {
          key: 'abbreviation',
          label: 'Abreviación',
          type: 'text',
          required: true,
          placeholder: 'Ej: kg',
        },
        {
          key: 'unit_type',
          label: 'Tipo',
          type: 'select',
          required: true,
          options: [
            { value: 'weight', label: 'Peso' },
            { value: 'repetitions', label: 'Repeticiones' },
            { value: 'calories', label: 'Calorías' },
            { value: 'time', label: 'Tiempo' },
            { value: 'distance', label: 'Distancia' },
          ],
        },
      ]}
    />
  );
}
