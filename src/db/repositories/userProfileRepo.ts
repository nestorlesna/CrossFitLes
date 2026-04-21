// Repositorio para perfil de usuario, medidas corporales y fotos de progreso
import { getDatabase, saveDatabase } from '../database';
import { generateUUID } from '../../utils/formatters';
import { UserProfile, BodyMeasurement, ProgressPhoto, PhotoAngle } from '../../models/UserProfile';

function now(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

// ── Perfil básico ─────────────────────────────────────────────────────────────

export async function getProfile(): Promise<UserProfile | null> {
  const db = getDatabase();
  const result = await db.query(`SELECT * FROM user_profile LIMIT 1`);
  return (result.values?.[0] as UserProfile) ?? null;
}

export async function saveProfile(data: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
  const db = getDatabase();
  const timestamp = now();
  const existing = await getProfile();

  if (existing) {
    await db.run(
      `UPDATE user_profile
       SET full_name = ?, sex = ?, birth_date = ?, height_cm = ?,
           body_type = ?, experience_level = ?, updated_at = ?
       WHERE id = ?`,
      [
        data.full_name ?? null,
        data.sex ?? null,
        data.birth_date ?? null,
        data.height_cm ?? null,
        data.body_type ?? null,
        data.experience_level ?? null,
        timestamp,
        existing.id,
      ]
    );
  } else {
    await db.run(
      `INSERT INTO user_profile (id, full_name, sex, birth_date, height_cm, body_type, experience_level, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        generateUUID(),
        data.full_name ?? null,
        data.sex ?? null,
        data.birth_date ?? null,
        data.height_cm ?? null,
        data.body_type ?? null,
        data.experience_level ?? null,
        timestamp,
        timestamp,
      ]
    );
  }
  await saveDatabase();
}

// ── Medidas corporales ────────────────────────────────────────────────────────

export async function getMeasurements(): Promise<BodyMeasurement[]> {
  const db = getDatabase();
  const result = await db.query(
    `SELECT * FROM body_measurement ORDER BY measurement_date DESC, created_at DESC`
  );
  return (result.values ?? []) as BodyMeasurement[];
}

export async function getLatestMeasurement(): Promise<BodyMeasurement | null> {
  const db = getDatabase();
  const result = await db.query(
    `SELECT * FROM body_measurement ORDER BY measurement_date DESC, created_at DESC LIMIT 1`
  );
  return (result.values?.[0] as BodyMeasurement) ?? null;
}

export async function addMeasurement(
  data: Omit<BodyMeasurement, 'id' | 'bmi' | 'lean_mass_kg' | 'created_at' | 'updated_at'>
): Promise<string> {
  const db = getDatabase();
  const id = generateUUID();
  const timestamp = now();

  await db.run(
    `INSERT INTO body_measurement (
      id, measurement_date, weight_kg, body_fat_percentage,
      neck_cm, shoulders_cm, chest_cm, bicep_relaxed_cm, bicep_contracted_cm, forearm_cm,
      waist_cm, abdomen_cm,
      hip_cm, glutes_cm, thigh_cm, mid_thigh_cm, calf_cm,
      notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.measurement_date,
      data.weight_kg ?? null,
      data.body_fat_percentage ?? null,
      data.neck_cm ?? null,
      data.shoulders_cm ?? null,
      data.chest_cm ?? null,
      data.bicep_relaxed_cm ?? null,
      data.bicep_contracted_cm ?? null,
      data.forearm_cm ?? null,
      data.waist_cm ?? null,
      data.abdomen_cm ?? null,
      data.hip_cm ?? null,
      data.glutes_cm ?? null,
      data.thigh_cm ?? null,
      data.mid_thigh_cm ?? null,
      data.calf_cm ?? null,
      data.notes ?? null,
      timestamp,
      timestamp,
    ]
  );
  await saveDatabase();
  return id;
}

export async function deleteMeasurement(id: string): Promise<void> {
  const db = getDatabase();
  await db.run(`DELETE FROM body_measurement WHERE id = ?`, [id]);
  await saveDatabase();
}

// ── Fotos de progreso ─────────────────────────────────────────────────────────

export async function getPhotos(angle?: PhotoAngle): Promise<ProgressPhoto[]> {
  const db = getDatabase();
  let query = `SELECT * FROM progress_photo`;
  const params: any[] = [];
  if (angle) {
    query += ` WHERE angle = ?`;
    params.push(angle);
  }
  query += ` ORDER BY photo_date DESC, created_at DESC`;
  const result = await db.query(query, params);
  return (result.values ?? []) as ProgressPhoto[];
}

export async function addPhoto(data: Omit<ProgressPhoto, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
  const db = getDatabase();
  const id = generateUUID();
  const timestamp = now();

  await db.run(
    `INSERT INTO progress_photo (id, photo_date, angle, image_path, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, data.photo_date, data.angle, data.image_path, data.notes ?? null, timestamp, timestamp]
  );
  await saveDatabase();
  return id;
}

export async function deletePhoto(id: string): Promise<void> {
  const db = getDatabase();
  await db.run(`DELETE FROM progress_photo WHERE id = ?`, [id]);
  await saveDatabase();
}

// ── Helpers de cálculo ────────────────────────────────────────────────────────

/** IMC = peso(kg) / altura(m)² */
export function calcBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

/** Masa magra estimada (kg) = peso × (1 − % grasa / 100) */
export function calcLeanMass(weightKg: number, bodyFatPct: number): number {
  return weightKg * (1 - bodyFatPct / 100);
}

/** Edad en años a partir de fecha de nacimiento YYYY-MM-DD */
export function calcAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}
