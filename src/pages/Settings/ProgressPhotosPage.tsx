// Página de fotos de progreso: galería con filtro por ángulo + agregar nuevas
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Trash2, Camera, X } from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '../../components/layout/Header';
import { Modal } from '../../components/ui/Modal';
import { ProgressPhoto, PhotoAngle, ANGLE_LABELS } from '../../models/UserProfile';
import { getPhotos, addPhoto, deletePhoto } from '../../db/repositories/userProfileRepo';
import { pickImage, getImageDisplayUrl } from '../../services/mediaService';

const ANGLES: PhotoAngle[] = ['front', 'side', 'back'];

interface AddPhotoForm {
  photo_date: string;
  angle: PhotoAngle;
  notes: string;
}

const EMPTY_FORM: AddPhotoForm = {
  photo_date: new Date().toISOString().split('T')[0],
  angle: 'front',
  notes: '',
};

// ── Miniatura de foto ─────────────────────────────────────────────────────────

function PhotoThumb({
  photo, onDelete,
}: { photo: ProgressPhoto; onDelete: () => void }) {
  const [src, setSrc] = useState<string | null>(null);
  const [enlarged, setEnlarged] = useState(false);

  useEffect(() => {
    getImageDisplayUrl(photo.image_path).then(setSrc);
  }, [photo.image_path]);

  return (
    <>
      <div className="relative rounded-2xl overflow-hidden bg-gray-800 aspect-[3/4] flex items-center justify-center group">
        {src
          ? <img src={src} alt={ANGLE_LABELS[photo.angle]} className="w-full h-full object-cover cursor-pointer" onClick={() => setEnlarged(true)} />
          : <Camera size={24} className="text-gray-600" />
        }
        {/* Overlay info */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-2">
          <p className="text-xs text-white font-semibold">{photo.photo_date}</p>
          {photo.notes && <p className="text-xs text-gray-300 truncate">{photo.notes}</p>}
        </div>
        {/* Botón borrar */}
        <button
          onClick={onDelete}
          className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity"
        >
          <Trash2 size={13} className="text-red-400" />
        </button>
      </div>

      {/* Visor ampliado */}
      {enlarged && src && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setEnlarged(false)}
        >
          <button className="absolute top-4 right-4 text-white" onClick={() => setEnlarged(false)}>
            <X size={28} />
          </button>
          <img src={src} alt="" className="max-w-full max-h-full rounded-xl object-contain" onClick={e => e.stopPropagation()} />
          <div className="absolute bottom-6 left-0 right-0 text-center">
            <p className="text-white font-semibold text-sm">{photo.photo_date} — {ANGLE_LABELS[photo.angle]}</p>
            {photo.notes && <p className="text-gray-400 text-xs mt-0.5">{photo.notes}</p>}
          </div>
        </div>
      )}
    </>
  );
}

// ── Página principal ─────────────────────────────────────────────────────────

export function ProgressPhotosPage() {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [activeAngle, setActiveAngle] = useState<PhotoAngle | 'all'>('all');
  const [loading, setLoading] = useState(true);

  // Modal para agregar nueva foto
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState<AddPhotoForm>(EMPTY_FORM);
  const [pickedPath, setPickedPath] = useState<string | null>(null);
  const [pickedDataUrl, setPickedDataUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Modal confirmar borrado
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function load() {
    try {
      const data = await getPhotos();
      setPhotos(data);
    } catch {
      toast.error('Error al cargar fotos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const upd = (field: keyof AddPhotoForm, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handlePickImage = async () => {
    try {
      const result = await pickImage('other');
      setPickedPath(result.path);
      setPickedDataUrl(result.dataUrl);
    } catch {
      // El usuario canceló la selección
    }
  };

  const handleSave = async () => {
    if (!pickedPath) {
      toast.error('Seleccioná una foto primero');
      return;
    }
    setSaving(true);
    try {
      await addPhoto({
        photo_date: form.photo_date,
        angle:      form.angle,
        image_path: pickedPath,
        notes:      form.notes || undefined,
      });
      toast.success('Foto guardada');
      setShowAddModal(false);
      setForm(EMPTY_FORM);
      setPickedPath(null);
      setPickedDataUrl(null);
      await load();
    } catch {
      toast.error('Error al guardar la foto');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deletePhoto(deleteId);
      toast.success('Foto eliminada');
      setDeleteId(null);
      await load();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const filtered = activeAngle === 'all'
    ? photos
    : photos.filter(p => p.angle === activeAngle);

  return (
    <>
      <Header
        title="Fotos de progreso"
        leftAction={
          <button onClick={() => navigate(-1)} className="text-gray-400 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <ChevronLeft size={24} />
          </button>
        }
        rightAction={
          <button onClick={() => setShowAddModal(true)} className="text-primary-400 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <Plus size={24} />
          </button>
        }
      />

      <div className="flex flex-col gap-4 p-4 pb-24">

        {/* ── Filtro por ángulo ── */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveAngle('all')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${activeAngle === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-800 text-gray-400'}`}
          >
            Todas
          </button>
          {ANGLES.map(a => (
            <button
              key={a}
              onClick={() => setActiveAngle(a)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${activeAngle === a ? 'bg-primary-600 text-white' : 'bg-gray-800 text-gray-400'}`}
            >
              {ANGLE_LABELS[a]}
            </button>
          ))}
        </div>

        {/* ── Galería ── */}
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-gray-900/50 border border-gray-800 border-dashed rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
            <Camera size={36} className="text-gray-700 opacity-30" />
            <p className="text-gray-500 text-sm">
              {activeAngle === 'all' ? 'Aún no hay fotos registradas.' : `No hay fotos de ${ANGLE_LABELS[activeAngle as PhotoAngle]}.`}
            </p>
            <p className="text-gray-600 text-xs">Presioná el <span className="text-primary-500">+</span> para agregar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(p => (
              <PhotoThumb key={p.id} photo={p} onDelete={() => setDeleteId(p.id)} />
            ))}
          </div>
        )}
      </div>

      {/* ── Modal agregar foto ── */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Agregar foto">
        <div className="flex flex-col gap-4">

          {/* Preview / selector */}
          <button
            onClick={handlePickImage}
            className="w-full aspect-[3/4] max-h-64 rounded-2xl bg-gray-800 border-2 border-dashed border-gray-700 flex flex-col items-center justify-center gap-2 overflow-hidden"
          >
            {pickedDataUrl
              ? <img src={pickedDataUrl} alt="preview" className="w-full h-full object-cover" />
              : <>
                  <Camera size={32} className="text-gray-600" />
                  <span className="text-sm text-gray-500">Tomar o elegir foto</span>
                </>
            }
          </button>

          {/* Fecha */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Fecha</label>
            <input
              type="date" value={form.photo_date}
              max={new Date().toISOString().split('T')[0]}
              onChange={e => upd('photo_date', e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500"
            />
          </div>

          {/* Ángulo */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Ángulo</label>
            <div className="flex gap-2">
              {ANGLES.map(a => (
                <button
                  key={a}
                  onClick={() => upd('angle', a)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors ${form.angle === a ? 'bg-primary-600 text-white' : 'bg-gray-800 text-gray-400'}`}
                >
                  {ANGLE_LABELS[a]}
                </button>
              ))}
            </div>
          </div>

          {/* Notas */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Notas <span className="text-gray-600">(opcional)</span></label>
            <input
              type="text" value={form.notes}
              onChange={e => upd('notes', e.target.value)}
              placeholder="Ej: 1 mes de entrenamiento"
              className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowAddModal(false)}
              className="flex-1 py-3 rounded-xl bg-gray-800 text-gray-300 text-sm font-semibold"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !pickedPath}
              className="flex-1 py-3 rounded-xl bg-primary-600 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white" /> : null}
              Guardar
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal confirmar borrado */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Eliminar foto">
        <div className="flex flex-col gap-4">
          <p className="text-gray-300 text-sm">¿Eliminás esta foto? La acción no se puede deshacer.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteId(null)} className="flex-1 py-3 rounded-xl bg-gray-800 text-gray-300 text-sm font-semibold">Cancelar</button>
            <button onClick={handleDelete} className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-semibold">Eliminar</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
