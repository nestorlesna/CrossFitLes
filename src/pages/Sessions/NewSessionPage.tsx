import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Search, Calendar, Star, Dumbbell, Play } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { Badge } from '../../components/ui/Badge';
import { ClassTemplate } from '../../models/ClassTemplate';
import { getAll as getAllTemplates } from '../../db/repositories/classTemplateRepo';
import { createFromTemplate } from '../../db/repositories/trainingSessionRepo';
import { toast } from 'sonner';

export function NewSessionPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<ClassTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadTemplates() {
      try {
        const data = await getAllTemplates();
        setTemplates(data);
      } catch (e) {
        toast.error('Error al cargar plantillas');
      } finally {
        setLoading(false);
      }
    }
    loadTemplates();
  }, []);

  const handleStartFromTemplate = async (templateId: string) => {
    try {
      const sessionId = await createFromTemplate(templateId);
      toast.success('Sesión iniciada');
      navigate(`/sesiones/${sessionId}/ejecutar`);
    } catch (e) {
      toast.error('Error al iniciar sesión');
    }
  };

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    (t.objective && t.objective.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <Header
        title="Nueva Sesión"
        leftAction={
          <button onClick={() => navigate(-1)} className="text-gray-400 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <ChevronLeft size={24} />
          </button>
        }
      />

      <div className="flex flex-col gap-6 p-4 pb-24">
        {/* ── Opción Sesión Libre ── */}
        <button
          onClick={() => toast.info('Funcionalidad de sesión libre próximamente')}
          className="bg-primary-600 hover:bg-primary-700 text-white rounded-2xl p-5 flex items-center justify-between transition-colors shadow-lg shadow-primary-900/20 active:scale-[0.98]"
        >
          <div className="flex flex-col items-start text-left">
            <span className="text-lg font-bold">Sesión Libre</span>
            <span className="text-xs opacity-80">Sin planificación previa, agrega ejercicios en el momento.</span>
          </div>
          <Play size={24} fill="currentColor" />
        </button>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold text-lg">Usar Plantilla</h2>
            <Badge label={`${templates.length} disponibles`} size="sm" />
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Buscar plantilla..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-500"></div>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="bg-gray-900/50 border border-gray-800 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center">
              <Dumbbell size={40} className="text-gray-700 mb-3 opacity-20" />
              <p className="text-gray-500 text-sm">No se encontraron plantillas</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleStartFromTemplate(template.id)}
                  className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-4 active:scale-[0.98] transition-all cursor-pointer hover:border-gray-700 shadow-sm group"
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center border border-gray-700 group-hover:bg-primary-500/10 group-hover:border-primary-500/50 transition-colors">
                    {template.is_favorite ? (
                      <Star size={20} className="text-amber-500" fill="currentColor" />
                    ) : (
                      <Calendar size={20} className="text-gray-500 group-hover:text-primary-500" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-sm truncate">{template.name}</h3>
                    {template.objective && (
                      <p className="text-gray-500 text-xs truncate mt-0.5">{template.objective}</p>
                    )}
                  </div>

                  <Play size={16} className="text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
