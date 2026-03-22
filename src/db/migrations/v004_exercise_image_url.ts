import { Migration } from '../../services/migrationService';

export const v004_exercise_image_url: Migration = {
  version: 4,
  name: 'exercise_image_url',
  up: [`ALTER TABLE exercise ADD COLUMN image_url TEXT DEFAULT ''`],
  down: [`ALTER TABLE exercise DROP COLUMN image_url`],
};
