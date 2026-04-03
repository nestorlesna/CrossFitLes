// Migración v008: agrega template_type a class_template
// 'my_classes' = clases del usuario, 'generic' = clases genéricas del sistema
import { Migration } from '../../services/migrationService';

export const v008_class_template_type: Migration = {
  version: 8,
  name: 'v008_class_template_type',
  up: [
    `ALTER TABLE class_template ADD COLUMN template_type TEXT DEFAULT 'my_classes'`,
    `CREATE INDEX IF NOT EXISTS idx_class_template_type ON class_template(template_type)`,
  ],
  down: [],
};
