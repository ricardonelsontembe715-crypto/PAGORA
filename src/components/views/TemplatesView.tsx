import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useMessages } from '../../context/MessageContext';
import { useNotifications } from '../../context/NotificationContext';
import { useNavigation } from '../../context/NavigationContext';
import { MessageTemplate, MessageChannel, MessageCategory } from '../../types/database';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { PLANS } from '../../config/plans';
import { TemplateFormModal } from '../templates/TemplateFormModal';
import { MessageGeneratorModal } from '../messages/MessageGeneratorModal';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  FileText,
  Sparkles,
  Plus,
  Copy,
  Edit2,
  Trash2,
  Send,
  MessageSquare,
  Smartphone,
  Mail,
  UserCheck,
  Search,
  Layers,
  Lock,
  ArrowUpRight,
} from 'lucide-react';

export const TemplatesView: React.FC = () => {
  const { account } = useAuth();
  const {
    templates,
    customTemplates,
    systemTemplates,
    deleteTemplate,
    duplicateTemplate,
  } = useMessages();
  const { showToast } = useNotifications();
  const { navigate } = useNavigation();

  const [activeTab, setActiveTab] = useState<'all' | 'custom' | 'system'>('all');
  const [channelFilter, setChannelFilter] = useState<MessageChannel | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modais
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [templateToEdit, setTemplateToEdit] = useState<MessageTemplate | null>(null);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState<boolean>(false);
  const [templateToDelete, setTemplateToDelete] = useState<MessageTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const planType = account?.plan || 'free';
  const planLimits = PLANS[planType].limits;
  const maxCustomTemplates = planLimits.customTemplates;
  const canCreateMore =
    maxCustomTemplates === 'unlimited' || customTemplates.length < maxCustomTemplates;

  // Filtragem
  const filteredTemplates = useMemo(() => {
    let list: MessageTemplate[] = [];
    if (activeTab === 'custom') {
      list = customTemplates;
    } else if (activeTab === 'system') {
      list = systemTemplates;
    } else {
      list = templates;
    }

    return list.filter((tpl) => {
      if (channelFilter !== 'all' && tpl.channel !== channelFilter) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchTitle = tpl.title.toLowerCase().includes(term);
        const matchContent = tpl.content.toLowerCase().includes(term);
        const matchCategory = tpl.category.toLowerCase().includes(term);
        if (!matchTitle && !matchContent && !matchCategory) return false;
      }
      return true;
    });
  }, [activeTab, customTemplates, systemTemplates, templates, channelFilter, searchTerm]);

  const handleDuplicate = async (id: string) => {
    const res = await duplicateTemplate(id);
    if (res.success) {
      showToast('Modelo duplicado com sucesso!', 'success');
    } else {
      showToast(res.error || 'Erro ao duplicar modelo.', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!templateToDelete) return;
    setIsDeleting(true);
    const res = await deleteTemplate(templateToDelete.id);
    setIsDeleting(false);
    if (res.success) {
      showToast('Modelo eliminado com sucesso.', 'info');
      setTemplateToDelete(null);
    } else {
      showToast(res.error || 'Erro ao eliminar modelo.', 'error');
    }
  };

  const getChannelBadge = (ch: MessageChannel) => {
    switch (ch) {
      case 'whatsapp':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <MessageSquare className="w-3 h-3 text-emerald-600" />
            WhatsApp
          </span>
        );
      case 'sms':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Smartphone className="w-3 h-3 text-indigo-600" />
            SMS
          </span>
        );
      case 'email':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Mail className="w-3 h-3 text-blue-600" />
            E-mail
          </span>
        );
      case 'in_person':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <UserCheck className="w-3 h-3 text-amber-600" />
            Presencial
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Modelos de Mensagens</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Biblioteca de abordagens pré-configuradas e modelos personalizados por canal e tom.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="md"
            onClick={() => navigate('dashboard_messages')}
            leftIcon={<MessageSquare className="w-4 h-4 text-slate-600" />}
          >
            Ver Histórico
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setTemplateToEdit(null);
              setIsFormModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            + Novo modelo
          </Button>
        </div>
      </div>

      {/* Cartão de cota do plano */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-900">
              Modelos Personalizados da sua Conta
            </div>
            <div className="text-xs text-slate-500">
              {maxCustomTemplates === 'unlimited' ? (
                <span>Tem modelos personalizados <strong>ilimitados</strong> no plano {planType.toUpperCase()}.</span>
              ) : (
                <span>
                  Criou <strong>{customTemplates.length}</strong> de{' '}
                  <strong>{maxCustomTemplates}</strong> modelos permitidos no plano {planType.toUpperCase()}.
                </span>
              )}
            </div>
          </div>
        </div>

        {!canCreateMore && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('dashboard_plans')}
            leftIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
          >
            Fazer Upgrade para PLUS/PRO
          </Button>
        )}
      </div>

      {/* Barra de Filtros e Abas */}
      <Card className="bg-white border-slate-200">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Abas */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-full md:w-auto">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'all'
                    ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos ({templates.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('system')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'system'
                    ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Modelos Base ({systemTemplates.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('custom')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'custom'
                    ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Os Meus Modelos ({customTemplates.length})
              </button>
            </div>

            {/* Pesquisa */}
            <div className="relative flex-1 max-w-md w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Pesquisar modelos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grelha de Modelos */}
      {filteredTemplates.length === 0 ? (
        <Card className="bg-white border-slate-200 text-center py-12 px-4">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Nenhum modelo encontrado
            </h3>
            <p className="text-xs text-slate-500">
              Crie modelos personalizados com as suas abordagens preferidas ou explore a biblioteca base.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTemplates.map((tpl) => (
            <Card
              key={tpl.id}
              className="bg-white border-slate-200 hover:border-slate-300 transition-all hover:shadow-2xs flex flex-col justify-between"
            >
              <CardContent className="p-4 space-y-3">
                {/* Topo do Modelo */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {getChannelBadge(tpl.channel)}
                      {tpl.isDefault ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold uppercase tracking-wider">
                          Base Pagora
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-semibold uppercase tracking-wider">
                          Personalizado
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{tpl.title}</h3>
                  </div>

                  <span className="text-xs text-slate-400 font-medium capitalize">
                    Tom {tpl.tone}
                  </span>
                </div>

                {/* Assunto se for E-mail */}
                {tpl.subject && (
                  <div className="text-xs font-semibold text-slate-800 bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="text-slate-400 font-normal">Assunto: </span>
                    {tpl.subject}
                  </div>
                )}

                {/* Prévia do Conteúdo */}
                <div className="p-3 bg-slate-50/70 rounded-xl text-xs text-slate-700 font-sans whitespace-pre-wrap leading-relaxed border border-slate-100 max-h-36 overflow-y-auto">
                  {tpl.content}
                </div>

                {/* Rodapé de Ações */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    {!tpl.isDefault && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setTemplateToEdit(tpl);
                            setIsFormModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          title="Editar modelo"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setTemplateToDelete(tpl)}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                          title="Eliminar modelo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDuplicate(tpl.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                      title="Duplicar como novo modelo"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsGeneratorOpen(true)}
                    leftIcon={<Send className="w-3.5 h-3.5 text-indigo-600" />}
                  >
                    Usar no Gerador
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Formulário de Modelo */}
      {isFormModalOpen && (
        <TemplateFormModal
          isOpen={isFormModalOpen}
          onClose={() => {
            setIsFormModalOpen(false);
            setTemplateToEdit(null);
          }}
          templateToEdit={templateToEdit}
        />
      )}

      {/* Modal do Gerador de Mensagens */}
      {isGeneratorOpen && (
        <MessageGeneratorModal
          isOpen={isGeneratorOpen}
          onClose={() => setIsGeneratorOpen(false)}
        />
      )}

      {/* Modal de Confirmação de Eliminação */}
      {templateToDelete && (
        <ConfirmModal
          isOpen={!!templateToDelete}
          onClose={() => setTemplateToDelete(null)}
          onConfirm={handleConfirmDelete}
          isLoading={isDeleting}
          title={`Eliminar modelo "${templateToDelete.title}"?`}
          description="Tem a certeza de que pretende remover este modelo personalizado da sua biblioteca?"
          confirmLabel="Sim, eliminar modelo"
          cancelLabel="Cancelar"
          variant="danger"
          details={{
            willDelete: [
              `Modelo personalizado: ${templateToDelete.title}`,
              'Configurações de canal e variáveis associadas a este modelo',
            ],
            willKeep: [
              'Mensagens e comunicações já geradas anteriormente mantêm-se inalteradas no histórico',
              'Modelos padrão da plataforma Pagora',
            ],
            isIrreversible: true,
          }}
        />
      )}
    </div>
  );
};
