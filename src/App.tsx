// Componente raíz con configuración de rutas
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/Home/HomePage';
import { ExercisesPage } from './pages/Exercises/ExercisesPage';
import { ExerciseFormPage } from './pages/Exercises/ExerciseFormPage';
import { ExerciseDetailPage } from './pages/Exercises/ExerciseDetailPage';
import { ClassesPage } from './pages/Classes/ClassesPage';
import { ClassTemplateFormPage } from './pages/Classes/ClassTemplateFormPage';
import { ClassTemplateDetailPage } from './pages/Classes/ClassTemplateDetailPage';
import { SessionsPage } from './pages/Sessions/SessionsPage';
import { NewSessionPage } from './pages/Sessions/NewSessionPage';
import { SessionExecutorPage } from './pages/Sessions/SessionExecutorPage';
import { SessionDetailPage } from './pages/Sessions/SessionDetailPage';
import { ManualSessionPage } from './pages/Sessions/ManualSessionPage';
import { FreeSessionPage } from './pages/Sessions/FreeSessionPage';
import { AboutPage } from './pages/Settings/AboutPage';
import { ProfilePage } from './pages/Settings/ProfilePage';
import { BodyMeasurementsPage } from './pages/Settings/BodyMeasurementsPage';
import { ProgressPhotosPage } from './pages/Settings/ProgressPhotosPage';
import { StatsPage } from './pages/Stats/StatsPage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { MuscleGroupsPage } from './pages/Settings/catalogs/MuscleGroupsPage';
import { EquipmentPage } from './pages/Settings/catalogs/EquipmentPage';
import { MeasurementUnitsPage } from './pages/Settings/catalogs/MeasurementUnitsPage';
import { DifficultyLevelsPage } from './pages/Settings/catalogs/DifficultyLevelsPage';
import { TagsPage } from './pages/Settings/catalogs/TagsPage';
import { SectionTypesPage } from './pages/Settings/catalogs/SectionTypesPage';
import { WorkFormatsPage } from './pages/Settings/catalogs/WorkFormatsPage';
import { ExerciseImagesPage } from './pages/Settings/ExerciseImagesPage';
import { ExerciseMusclesPage } from './pages/Settings/ExerciseMusclesPage';
import { ExerciseVideosPage } from './pages/Settings/ExerciseVideosPage';
import { DuplicateExercisesPage } from './pages/Settings/DuplicateExercisesPage';
import { InactiveClassesPage } from './pages/Settings/InactiveClassesPage';
import { DbProvider } from './components/DbProvider';

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <DbProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/inicio" replace />} />
            <Route path="inicio" element={<HomePage />} />
            <Route path="ejercicios" element={<ExercisesPage />} />
            <Route path="ejercicios/nuevo" element={<ExerciseFormPage />} />
            <Route path="ejercicios/:id" element={<ExerciseDetailPage />} />
            <Route path="ejercicios/:id/editar" element={<ExerciseFormPage />} />
            <Route path="clases" element={<ClassesPage />} />
            <Route path="clases/nueva" element={<ClassTemplateFormPage />} />
            <Route path="clases/:id" element={<ClassTemplateDetailPage />} />
            <Route path="clases/:id/editar" element={<ClassTemplateFormPage />} />
            <Route path="sesiones" element={<SessionsPage />} />
            <Route path="sesiones/nueva" element={<NewSessionPage />} />
            <Route path="sesiones/registrar" element={<ManualSessionPage />} />
            <Route path="sesiones/libre" element={<FreeSessionPage />} />
            <Route path="sesiones/:id/ejecutar" element={<SessionExecutorPage />} />
            <Route path="sesiones/:id" element={<SessionDetailPage />} />
            <Route path="estadisticas" element={<StatsPage />} />
            {/* Configuración y catálogos */}
            <Route path="configuracion" element={<SettingsPage />} />
            <Route path="configuracion/grupos-musculares" element={<MuscleGroupsPage />} />
            <Route path="configuracion/equipamiento" element={<EquipmentPage />} />
            <Route path="configuracion/unidades" element={<MeasurementUnitsPage />} />
            <Route path="configuracion/niveles-dificultad" element={<DifficultyLevelsPage />} />
            <Route path="configuracion/tags" element={<TagsPage />} />
            <Route path="configuracion/tipos-seccion" element={<SectionTypesPage />} />
            <Route path="configuracion/formatos-trabajo" element={<WorkFormatsPage />} />
            <Route path="configuracion/imagenes-ejercicios" element={<ExerciseImagesPage />} />
            <Route path="configuracion/musculos-ejercicios" element={<ExerciseMusclesPage />} />
            <Route path="configuracion/videos-ejercicios" element={<ExerciseVideosPage />} />
            <Route path="configuracion/ejercicios-duplicados" element={<DuplicateExercisesPage />} />
            <Route path="configuracion/clases-inactivas" element={<InactiveClassesPage />} />
            <Route path="configuracion/acerca-de" element={<AboutPage />} />
            <Route path="configuracion/perfil" element={<ProfilePage />} />
            <Route path="configuracion/medidas-corporales" element={<BodyMeasurementsPage />} />
            <Route path="configuracion/fotos-progreso" element={<ProgressPhotosPage />} />
          </Route>
        </Routes>
      </DbProvider>
      {/* Toast notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1f2937',
            color: '#f9fafb',
            border: '1px solid #374151',
          },
        }}
      />
    </BrowserRouter>
  );
}
