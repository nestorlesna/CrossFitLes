// Migración v021: el "video explicativo" (video_long_path) pasa a ser el short propio del canal
// FitLesUY (https://www.youtube.com/@FitLesUY/shorts) en los ejercicios que ya tienen uno.
//
// Los ejercicios se identifican por nombre (los ids son locales de cada dispositivo) y nunca se
// tocan los editados por el usuario (user_modified = 1). El video corto (video_path) no cambia.
import { Migration } from '../../services/migrationService';

const sqlStr = (s: string) => `'${s.replace(/'/g, "''")}'`;

// [nombre del ejercicio, id del short en YouTube]
const VIDEOS: [string, string][] = [
  ['March in Place', 'PHWkDN4Znoo'],
  ['Arm Circles', 'HS7MJrdsk4w'],
  ['Dynamic Warm-Up', 'o3-ytL_ReA4'],
  ['Dead Bug with Band Resistance', 'Lg3uw3-VUk8'],
  ['Dead Bug Hold with Dumbbell', 'jY1h2QZaezw'],
  ['Dead Bug', 'CM61w_n5u8s'],
  ['Barbell High Hang Squat Clean', 'AZJd-W6UX2g'],
  ['Barbell Hang Clean', 'GLrYmhgwCmc'],
  ['Barbell Squat Clean', '9Lgxnt4cthQ'],
  ['Band External Rotation', 'xikGlUaG3sE'],
  ['Band Pass-Through', 'UMRiHkocS4Q'],
  ['Band Pull-Apart', 'UHpBIGqq_7M'],
  ['Box Step-Up', 'wdCXfEUHvrA'],
  ['Box Jump-Over', 'nOborecxcS0'],
  ['Box Jump', 'WrhU452mlbw'],
  ['Supine Figure-4 Stretch', 'om2LBlCVY4Q'],
  ['Pigeon Pose', '4O6YbbmBtKQ'],
  ['Alternating 90/90 Into Shin Box', 'i3m5FNtO4y4'],
  ['Dynamic Hollow Hold', '-zcoalZVNDg'],
  ['Hollow Rock', 'y6oz3X6cWVw'],
  ['Hollow Hold', '1oRugI1TFgM'],
  ['Barbell High Hang Power Clean', 'enFXDetFgVk'],
  ['Barbell Hang Power Clean', 'OXVmoa-r2Zc'],
  ['Power Clean', 'KUH9IYjMcDQ'],
  ['Band Triceps Pushdown', '7zH0SOBkaYc'],
  ['Barbell Bicep Curl', 'Fh-C00-UTZ0'],
  ['Cobra Pose', 'mRthiV8u7cE'],
  ['Barbell Muscle Snatch', '2PvHgCThWaI'],
  ['Barbell Deadlift', 'NhRlgjzNuwE'],
  ['Barbell Hang Power Snatch', 'o5guIJ0BltQ'],
  ['Alternating Single Arm Dumbbell Power Snatch', 'M9Q_h-473fc'],
  ['Air Squat', 'm9bpMsuR_I8'],
  ['Assault Bike', 'Ipn_q7jZpNA'],
  ['90/90 Hip Rotation', 'zT6Qhd28sIw'],
  ['Overhead Triceps Stretch', '41rifhpbkh4'],
  ['Half Kneeling Hip Flexor Stretch', 'bUrewFPJp2E'],
  ['Barbell Back Squat', '1Gnk3JDDs3A'],
  ['Wall Ball Shot', '739bkdUhh5w'],
  ['Supine Spinal Twist', 'pmikAsyIpFU'],
  ['General Stretching', '42JLrCpb7qE'],
  ['Rowing', 'nEF63sYn7AQ'],
  ['Running', 'zDi_f_UMKPI'],
  ['Squat to Stand', 'rognkqgRrqM'],
];

const up = VIDEOS.map(
  ([name, id]) =>
    `UPDATE exercise
        SET video_long_path = ${sqlStr(`https://www.youtube.com/watch?v=${id}`)}, updated_at = datetime('now')
      WHERE name = ${sqlStr(name)} AND COALESCE(user_modified, 0) = 0`
);

export const v021_fitlesuy_explainer_videos: Migration = {
  version: 21,
  name: 'v021_fitlesuy_explainer_videos',
  up,
  // Corrección de datos: no se revierte
  down: [],
};
