// Componente genérico de gestión de catálogos (CRUD completo)
// Recibe configuración y renderiza listado, búsqueda, formulario modal y reordenamiento

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Loader2, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '../layout/Header';
import { SearchBar } from '../ui/SearchBar';
import { Modal } from '../ui/Modal';
import { ColorPicker } from '../ui/ColorPicker';
import { Badge } from '../ui/Badge';
import { CatalogRecord } from '../../models/catalogs';
import * as catalogRepo from '../../db/repositories/catalogRepo';
import { pickImage, getImageDisplayUrl, deleteImage } from '../../services/mediaService';

// Definición de un campo del formulario
export interface CatalogField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'color' | 'number' | 'select' | 'image';
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface CatalogManagerProps {
  title: string;
  tableName: string;
  fields: CatalogField[];
  hasImage?: boolean;
  imageSubdir?: 'muscles' | 'equipment' | 'exercises' | 'other';
  renderItem?: (item: CatalogRecord) => React.ReactNode;
}

// Estado inicial vacío para el formulario
function buildEmptyForm(fields: CatalogField[]): Record<string, unknown> {
  const form: Record<string, unknown> = {};
  for (const f of fields) {
    if (f.type === 'number') form[f.key] = '';
    else form[f.key] = '';
  }
  return form;
}

export function CatalogManager({
  title,
  tableName,
  fields,
  hasImage = false,
  imageSubdir = 'other',
  renderItem,
}: CatalogManagerProps) {
  const [items, setItems] = useState<CatalogRecord[]>([]);
  const [filtered, setFiltered] = useState<CatalogRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Estado del modal de formulario
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogRecord | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);

  // Estado del modal de confirmación de eliminación
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<CatalogRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Imagen seleccionada en el formulario (path + dataUrl para preview)
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [pickingImage, setPickingImage] = useState(false);

  // Carga todos los ítems activos de la tabla
  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await catalogRepo.getAll(tableName, true);
      setItems(data);
    } catch (err) {
      console.error('[CatalogManager] Error al cargar:', err);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [tableName]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Filtrado client-side por nombre
  useEffect(() => {
    if (!search.trim()) {
      setFiltered(items);
    } else {
      const q = search.toLowerCase();
      setFiltered(items.filter((i) => String(i.name ?? '').toLowerCase().includes(q)));
    }
  }, [search, items]);

  // Abre el modal para crear un nuevo ítem
  function openCreateModal() {
    setEditingItem(null);
    setFormData(buildEmptyForm(fields));
    setImagePreview(null);
    setImagePath(null);
    setModalOpen(true);
  }

  // Abre el modal precargando los datos del ítem a editar
  async function openEditModal(item: CatalogRecord) {
    setEditingItem(item);
    const form: Record<string, unknown> = {};
    for (const f of fields) {
      form[f.key] = item[f.key] ?? '';
    }
    setFormData(form);
    setImagePath(null);
    setImagePreview(null);

    // Cargar preview de la imagen existente
    if (hasImage && item.image_path) {
      const url = await getImageDisplayUrl(String(item.image_path));
      setImagePreview(url);
      setImagePath(String(item.image_path));
    }
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingItem(null);
    setFormData({});
    setImagePreview(null);
    setImagePath(null);
  }

  // Actualiza un campo del formulario
  function handleFieldChange(key: string, value: unknown) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  // Selecciona una imagen usando mediaService
  async function handlePickImage() {
    setPickingImage(true);
    try {
      const result = await pickImage(imageSubdir);
      setImagePreview(result.dataUrl);
      setImagePath(result.path);
    } catch (err) {
      // El usuario puede cancelar la selección; solo mostrar error si no fue cancelación
      const msg = err instanceof Error ? err.message : '';
      if (!msg.includes('cancelad') && !msg.includes('cancel')) {
        toast.error('Error al seleccionar la imagen');
      }
    } finally {
      setPickingImage(false);
    }
  }

  // Guarda el ítem (create o update)
  async function handleSave() {
    // Validar campos requeridos
    for (const f of fields) {
      if (f.required && !formData[f.key]) {
        toast.error(`El campo "${f.label}" es requerido`);
        return;
      }
    }

    setSaving(true);
    try {
      const data: Record<string, unknown> = {};
      for (const f of fields) {
        if (f.type === 'number') {
          const val = formData[f.key];
          data[f.key] = val !== '' && val !== null && val !== undefined ? Number(val) : null;
        } else {
          data[f.key] = formData[f.key] ?? null;
        }
      }

      // Incluir image_path si aplica
      if (hasImage) {
        data.image_path = imagePath ?? (editingItem ? editingItem.image_path : null);
      }

      if (editingItem) {
        await catalogRepo.update(tableName, String(editingItem.id), data);
        toast.success('Registro actualizado');
      } else {
        await catalogRepo.create(tableName, data);
        toast.success('Registro creado');
      }

      closeModal();
      await loadItems();
    } catch (err) {
      console.error('[CatalogManager] Error al guardar:', err);
      toast.error('Error al guardar el registro');
    } finally {
      setSaving(false);
    }
  }

  // Abre el modal de confirmación de eliminación
  function openDeleteModal(item: CatalogRecord) {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  }

  // Ejecuta el borrado lógico del ítem
  async function handleDelete() {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      // Eliminar imagen asociada si existe
      if (hasImage && itemToDelete.image_path) {
        await deleteImage(String(itemToDelete.image_path));
      }
      await catalogRepo.softDelete(tableName, String(itemToDelete.id));
      toast.success('Registro eliminado');
      setDeleteModalOpen(false);
      setItemToDelete(null);
      await loadItems();
    } catch (err) {
      console.error('[CatalogManager] Error al eliminar:', err);
      toast.error('Error al eliminar el registro');
    } finally {
      setDeleting(false);
    }
  }

  // Mueve un ítem hacia arriba en el orden
  async function handleMoveUp(item: CatalogRecord) {
    try {
      await catalogRepo.moveUp(tableName, String(item.id));
      await loadItems();
    } catch {
      toast.error('Error al reordenar');
    }
  }

  // Mueve un ítem hacia abajo en el orden
  async function handleMoveDown(item: CatalogRecord) {
    try {
      await catalogRepo.moveDown(tableName, String(item.id));
      await loadItems();
    } catch {
      toast.error('Error al reordenar');
    }
  }

  // Renderiza un campo del formulario según su tipo
  function renderFormField(field: CatalogField) {
    const value = formData[field.key];

    if (field.type === 'color') {
      return (
        <div key={field.key} className="space-y-2">
          <label className="text-sm text-gray-300 font-medium">{field.label}</label>
          <ColorPicker
            value={String(value ?? '')}
            onChange={(c) => handleFieldChange(field.key, c)}
          />
          {!!value && (
            <div className="flex items-center gap-2 mt-1">
              <div
                className="w-5 h-5 rounded-full border border-gray-700"
                style={{ backgroundColor: String(value) }}
              />
              <span className="text-xs text-gray-400">{String(value)}</span>
            </div>
          )}
        </div>
      );
    }

    if (field.type === 'select') {
      return (
        <div key={field.key} className="space-y-1.5">
          <label className="text-sm text-gray-300 font-medium">{field.label}</label>
          <select
            value={String(value ?? '')}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            className="w-full bg-gray-800 text-white rounded-xl px-3 py-2.5 text-sm border border-gray-700 focus:outline-none focus:border-primary-500"
          >
            <option value="">Seleccionar...</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (field.type === 'textarea') {
      return (
        <div key={field.key} className="space-y-1.5">
          <label className="text-sm text-gray-300 font-medium">{field.label}</label>
          <textarea
            value={String(value ?? '')}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            className="w-full bg-gray-800 text-white placeholder-gray-500 rounded-xl px-3 py-2.5 text-sm border border-gray-700 focus:outline-none focus:border-primary-500 resize-none"
          />
        </div>
      );
    }

    // text y number
    return (
      <div key={field.key} className="space-y-1.5">
        <label className="text-sm text-gray-300 font-medium">
          {field.label}
          {field.required && <span className="text-primary-500 ml-1">*</span>}
        </label>
        <input
          type={field.type === 'number' ? 'number' : 'text'}
          value={String(value ?? '')}
          onChange={(e) => handleFieldChange(field.key, e.target.value)}
          placeholder={field.placeholder}
          className="w-full bg-gray-800 text-white placeholder-gray-500 rounded-xl px-3 py-2.5 text-sm border border-gray-700 focus:outline-none focus:border-primary-500"
        />
      </div>
    );
  }

  return (
    <>
      <Header
        title={title}
        rightAction={
          <button
            onClick={openCreateModal}
            className="w-9 h-9 flex items-center justify-center bg-primary-600 hover:bg-primary-500 rounded-xl transition-colors"
          >
            <Plus size={20} className="text-white" />
          </button>
        }
      />

      <div className="p-4 space-y-4">
        {/* Buscador */}
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder={`Buscar en ${title.toLowerCase()}...`}
        />

        {/* Estado de carga */}
        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 size={32} className="text-primary-500 animate-spin" />
          </div>
        )}

        {/* Lista vacía */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-sm">
              {search ? 'Sin resultados para la búsqueda' : 'No hay registros aún'}
            </p>
          </div>
        )}

        {/* Lista de ítems */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-2">
            {filtered.map((item, index) => (
              <div
                key={String(item.id)}
                className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex items-center gap-3"
              >
                {/* Thumbnail de imagen */}
                {hasImage && !!item.image_path && (
                  <ImageThumbnail path={String(item.image_path)} />
                )}

                {/* Contenido principal o render custom */}
                <div className="flex-1 min-w-0">
                  {renderItem ? (
                    renderItem(item)
                  ) : (
                    <DefaultItemContent item={item} fields={fields} />
                  )}
                </div>

                {/* Botones de acción */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Reordenar */}
                  <button
                    onClick={() => handleMoveUp(item)}
                    disabled={index === 0}
                    className="p-1.5 text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    onClick={() => handleMoveDown(item)}
                    disabled={index === filtered.length - 1}
                    className="p-1.5 text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronDown size={16} />
                  </button>

                  {/* Editar */}
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1.5 text-gray-400 hover:text-primary-400 transition-colors"
                  >
                    <Pencil size={16} />
                  </button>

                  {/* Eliminar */}
                  <button
                    onClick={() => openDeleteModal(item)}
                    className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de formulario */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingItem ? `Editar ${title}` : `Nuevo en ${title}`}
        footer={
          <div className="flex gap-3 justify-end">
            <button
              onClick={closeModal}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Guardar
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Campos del formulario */}
          {fields.map((f) => renderFormField(f))}

          {/* Selector de imagen */}
          {hasImage && (
            <div className="space-y-2">
              <label className="text-sm text-gray-300 font-medium">Foto</label>
              {imagePreview ? (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-24 h-24 object-cover rounded-xl border border-gray-700"
                  />
                  <button
                    type="button"
                    onClick={() => { setImagePreview(null); setImagePath(null); }}
                    className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-500"
                  >
                    ×
                  </button>
                </div>
              ) : null}
              <button
                type="button"
                onClick={handlePickImage}
                disabled={pickingImage}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 hover:border-gray-600 text-gray-300 text-sm rounded-xl transition-colors"
              >
                {pickingImage ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ImagePlus size={16} />
                )}
                {imagePreview ? 'Cambiar foto' : 'Seleccionar foto'}
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal de confirmación de eliminación */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirmar eliminación"
        footer={
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-5 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
            >
              {deleting && <Loader2 size={14} className="animate-spin" />}
              Eliminar
            </button>
          </div>
        }
      >
        <p className="text-gray-300 text-sm">
          ¿Eliminar <span className="text-white font-medium">{String(itemToDelete?.name ?? '')}</span>?
        </p>
        <p className="text-gray-500 text-xs mt-1">Esta acción no se puede deshacer.</p>
      </Modal>
    </>
  );
}

// ─── Sub-componentes internos ────────────────────────────────────────────────

// Muestra el contenido por defecto de un ítem (nombre + campos con color/badge)
function DefaultItemContent({
  item,
  fields,
}: {
  item: CatalogRecord;
  fields: CatalogField[];
}) {
  // Buscar si hay campo de color
  const colorField = fields.find((f) => f.type === 'color');
  const color = colorField ? String(item[colorField.key] ?? '') : undefined;

  // Campos secundarios a mostrar (todos excepto el nombre y el color)
  const secondaryFields = fields.filter(
    (f) => f.key !== 'name' && f.type !== 'color' && f.type !== 'textarea' && f.type !== 'image'
  );

  return (
    <div className="flex items-center gap-2 flex-wrap min-w-0">
      <span className="text-white text-sm font-medium truncate">{String(item.name ?? '')}</span>
      {color && <Badge label={color} color={color} size="sm" />}
      {secondaryFields.map((f) => {
        const val = item[f.key];
        if (!val && val !== 0) return null;

        // Mostrar label descriptivo si es un select
        if (f.type === 'select' && f.options) {
          const opt = f.options.find((o) => o.value === String(val));
          return opt ? (
            <span key={f.key} className="text-xs text-gray-400">{opt.label}</span>
          ) : null;
        }

        return (
          <span key={f.key} className="text-xs text-gray-400">{String(val)}</span>
        );
      })}
    </div>
  );
}

// Thumbnail de imagen con carga lazy via hook
function ImageThumbnail({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    getImageDisplayUrl(path).then(setUrl).catch(() => null);
  }, [path]);

  if (!url) return null;

  return (
    <img
      src={url}
      alt=""
      className="w-10 h-10 object-cover rounded-lg border border-gray-700 shrink-0"
    />
  );
}

