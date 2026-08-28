import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { MessageTone, MessageChannel, PaymentMethod } from '../../types/database';
import {
  User,
  Building2,
  Lock,
  Receipt,
  MessageSquare,
  Zap,
  Bell,
  Layers,
  Shield,
  Smartphone,
  Globe,
  Mail,
  Phone,
  MapPin,
  Clock,
  Save,
  Check,
  AlertCircle,
  Plus,
  LogOut,
  Laptop,
} from 'lucide-react';

type SettingsTab =
  | 'profile'
  | 'security'
  | 'company'
  | 'billing_settings'
  | 'messages_settings'
  | 'automations_settings'
  | 'notifications_settings'
  | 'workspaces';

export const SettingsView: React.FC = () => {
  const {
    user,
    account,
    accounts,
    switchAccount,
    createWorkspace,
    userProfile,
    updateUserProfile,
    companySettings,
    updateCompanySettings,
    billingSettings,
    updateBillingSettings,
    messageSettings,
    updateMessageSettings,
    automationSettings,
    updateAutomationSettings,
    notificationPreferences,
    updateNotificationPreferences,
    sessions,
    terminateOtherSessions,
    resetPassword,
  } = useAuth();

  const { showToast } = useNotifications();

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Estados locais para edição dos formulários
  const [profileForm, setProfileForm] = useState(userProfile);
  const [companyForm, setCompanyForm] = useState(companySettings);
  const [billingForm, setBillingForm] = useState(billingSettings);
  const [messageForm, setMessageForm] = useState(messageSettings);
  const [automationForm, setAutomationForm] = useState(automationSettings);
  const [notifForm, setNotifForm] = useState(notificationPreferences);

  // Alteração de palavra-passe
  const [pwdCurrent, setPwdCurrent] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [pwdError, setPwdError] = useState<string | null>(null);

  // Modal Novo Espaço de Trabalho
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceTaxId, setNewWorkspaceTaxId] = useState('');
  const [newWorkspaceActivity, setNewWorkspaceActivity] = useState('');
  const [workspaceLoading, setWorkspaceLoading] = useState(false);

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'Perfil de Utilizador', icon: <User className="w-4 h-4" /> },
    { id: 'security', label: 'Segurança & Sessões', icon: <Lock className="w-4 h-4" /> },
    { id: 'company', label: 'Empresa & Identidade', icon: <Building2 className="w-4 h-4" /> },
    { id: 'billing_settings', label: 'Regras de Cobrança', icon: <Receipt className="w-4 h-4" /> },
    { id: 'messages_settings', label: 'Modelos & Comunicação', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'automations_settings', label: 'Regras de Automação', icon: <Zap className="w-4 h-4" /> },
    { id: 'notifications_settings', label: 'Preferências de Alertas', icon: <Bell className="w-4 h-4" /> },
    { id: 'workspaces', label: 'Espaços de Trabalho', icon: <Layers className="w-4 h-4" /> },
  ];

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(profileForm);
    showToast('Perfil de utilizador atualizado com sucesso.', 'success');
  };

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanySettings(companyForm);
    showToast('Identidade da empresa guardada com sucesso.', 'success');
  };

  const handleSaveBilling = (e: React.FormEvent) => {
    e.preventDefault();
    updateBillingSettings(billingForm);
    showToast('Regras de cobrança atualizadas.', 'success');
  };

  const handleSaveMessages = (e: React.FormEvent) => {
    e.preventDefault();
    updateMessageSettings(messageForm);
    showToast('Preferências de comunicação guardadas.', 'success');
  };

  const handleSaveAutomations = (e: React.FormEvent) => {
    e.preventDefault();
    updateAutomationSettings(automationForm);
    showToast('Regras de automação atualizadas.', 'success');
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    updateNotificationPreferences(notifForm);
    showToast('Preferências de alertas guardadas.', 'success');
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);

    if (pwdNew.length < 6) {
      setPwdError('A nova palavra-passe deve conter no mínimo 6 caracteres.');
      return;
    }

    if (pwdNew !== pwdConfirm) {
      setPwdError('A confirmação da nova palavra-passe não coincide.');
      return;
    }

    const res = await resetPassword(pwdNew);
    if (res.success) {
      setPwdCurrent('');
      setPwdNew('');
      setPwdConfirm('');
      showToast('Palavra-passe alterada com sucesso.', 'success');
    } else {
      setPwdError(res.error || 'Erro ao alterar palavra-passe.');
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    setWorkspaceLoading(true);
    const res = await createWorkspace({
      name: newWorkspaceName.trim(),
      taxId: newWorkspaceTaxId.trim() || undefined,
      activityType: newWorkspaceActivity.trim() || 'Serviços',
    });
    setWorkspaceLoading(false);

    if (res.success) {
      setIsWorkspaceModalOpen(false);
      setNewWorkspaceName('');
      setNewWorkspaceTaxId('');
      setNewWorkspaceActivity('');
      showToast('Novo espaço de trabalho criado e ativado.', 'success');
    } else {
      showToast(res.error || 'Erro ao criar espaço de trabalho.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Definições & Configuração
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Faça a gestão da sua conta, segurança, dados da empresa, regras de negócio e preferências operacionais.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Menu Lateral de Tabs */}
        <Card className="p-2 bg-white border-slate-200 lg:sticky lg:top-24">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors text-left ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className={isActive ? 'text-indigo-600' : 'text-slate-400'}>
                    {tab.icon}
                  </span>
                  <span className="flex-1 truncate">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </Card>

        {/* Conteúdo da Tab Ativa */}
        <div className="lg:col-span-3">
          {/* TAB 1: PERFIL */}
          {activeTab === 'profile' && (
            <Card className="p-6 bg-white border-slate-200 shadow-xs">
              <div className="border-b border-slate-100 pb-4 mb-6">
                <h2 className="text-base font-bold text-slate-900">Perfil de Utilizador</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Informações pessoais do titular da conta e identificação na plataforma.
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 border-2 border-indigo-200 flex items-center justify-center text-xl font-bold">
                    {profileForm.name ? profileForm.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{profileForm.name}</h3>
                    <p className="text-xs text-slate-500">{profileForm.email}</p>
                    <span className="inline-block mt-1 text-[11px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {profileForm.roleTitle || 'Administrador da Conta'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nome Completo
                    </label>
                    <Input
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Endereço de E-mail
                    </label>
                    <Input
                      value={profileForm.email}
                      disabled
                      className="bg-slate-100 text-slate-500 cursor-not-allowed"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      O e-mail principal está protegido. Contacte o suporte para alterar.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Telemóvel / Contacto
                    </label>
                    <Input
                      value={profileForm.phone || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="912 345 678"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Cargo / Função
                    </label>
                    <Input
                      value={profileForm.roleTitle || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, roleTitle: e.target.value })}
                      placeholder="Ex: Diretor Financeiro"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Idioma
                    </label>
                    <select
                      value={profileForm.language}
                      disabled
                      className="w-full text-xs bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-slate-600"
                    >
                      <option value="pt-PT">Português (Portugal)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Fuso Horário
                    </label>
                    <select
                      value={profileForm.timezone}
                      onChange={(e) => setProfileForm({ ...profileForm, timezone: e.target.value })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="Europe/Lisbon (UTC+0 / UTC+1)">Lisboa (UTC+0 / WET/WEST)</option>
                      <option value="Atlantic/Azores (UTC-1)">Açores (UTC-1 / AZOT)</option>
                      <option value="Atlantic/Madeira (UTC+0)">Madeira (UTC+0 / WET)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <Button type="submit" variant="primary" className="gap-1.5">
                    <Save className="w-4 h-4" />
                    Guardar Perfil
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* TAB 2: SEGURANÇA */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Alteração de Palavra-passe */}
              <Card className="p-6 bg-white border-slate-200 shadow-xs">
                <div className="border-b border-slate-100 pb-4 mb-6">
                  <h2 className="text-base font-bold text-slate-900">Segurança da Conta</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Altere a sua palavra-passe e controle as definições de acesso seguro.
                  </p>
                </div>

                {pwdError && (
                  <div className="p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {pwdError}
                  </div>
                )}

                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Palavra-passe Atual
                    </label>
                    <Input
                      type="password"
                      value={pwdCurrent}
                      onChange={(e) => setPwdCurrent(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nova Palavra-passe
                    </label>
                    <Input
                      type="password"
                      value={pwdNew}
                      onChange={(e) => setPwdNew(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Confirmar Nova Palavra-passe
                    </label>
                    <Input
                      type="password"
                      value={pwdConfirm}
                      onChange={(e) => setPwdConfirm(e.target.value)}
                      placeholder="Confirme a nova palavra-passe"
                      required
                    />
                  </div>

                  <Button type="submit" variant="secondary" className="gap-1.5 mt-2">
                    <Shield className="w-4 h-4 text-indigo-600" />
                    Atualizar Palavra-passe
                  </Button>
                </form>
              </Card>

              {/* Sessões Ativas */}
              <Card className="p-6 bg-white border-slate-200 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Sessões Ativas</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Dispositivos com sessão iniciada na sua conta Pagora.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      terminateOtherSessions();
                      showToast('Todas as outras sessões foram encerradas.', 'info');
                    }}
                    className="text-xs text-red-600 hover:text-red-700 gap-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Terminar outras sessões
                  </Button>
                </div>

                <div className="space-y-3">
                  {sessions.map((sess) => (
                    <div
                      key={sess.id}
                      className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                          {sess.device.includes('iPhone') ? (
                            <Smartphone className="w-4 h-4" />
                          ) : (
                            <Laptop className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 flex items-center gap-2">
                            {sess.device} — {sess.browser}
                            {sess.isCurrent && (
                              <Badge variant="success" size="sm">Sessão Atual</Badge>
                            )}
                          </div>
                          <div className="text-slate-400 text-[11px] mt-0.5">
                            IP: {sess.ipAddress} • {sess.location} • Ativo recentemente
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* TAB 3: EMPRESA & IDENTIDADE */}
          {activeTab === 'company' && (
            <Card className="p-6 bg-white border-slate-200 shadow-xs">
              <div className="border-b border-slate-100 pb-4 mb-6">
                <h2 className="text-base font-bold text-slate-900">Identidade da Empresa</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Estes dados são apresentados nos relatórios, faturas e comunicações aos seus clientes.
                </p>
              </div>

              <form onSubmit={handleSaveCompany} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nome da Empresa / Espaço de Trabalho
                    </label>
                    <Input
                      value={companyForm.name}
                      onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nome Comercial / Designação Social
                    </label>
                    <Input
                      value={companyForm.commercialName || ''}
                      onChange={(e) => setCompanyForm({ ...companyForm, commercialName: e.target.value })}
                      placeholder="Ex: Estúdio Design Lda."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      NIF / Número de Identificação Fiscal (Portugal)
                    </label>
                    <Input
                      value={companyForm.taxId || ''}
                      onChange={(e) => setCompanyForm({ ...companyForm, taxId: e.target.value })}
                      placeholder="PT509123456"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      E-mail de Contacto / Cobrança
                    </label>
                    <Input
                      type="email"
                      value={companyForm.email || ''}
                      onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                      placeholder="financeiro@empresa.pt"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Telemóvel / Telefone
                    </label>
                    <Input
                      value={companyForm.phone || ''}
                      onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                      placeholder="210 000 000 / 912 345 678"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Website
                    </label>
                    <Input
                      value={companyForm.website || ''}
                      onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                      placeholder="https://empresa.pt"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Morada Completa
                    </label>
                    <Input
                      value={companyForm.address || ''}
                      onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                      placeholder="Rua, Número, Andar"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Cidade
                    </label>
                    <Input
                      value={companyForm.city || ''}
                      onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                      placeholder="Lisboa"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Código Postal
                    </label>
                    <Input
                      value={companyForm.postalCode || ''}
                      onChange={(e) => setCompanyForm({ ...companyForm, postalCode: e.target.value })}
                      placeholder="1250-142"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <Button type="submit" variant="primary" className="gap-1.5">
                    <Save className="w-4 h-4" />
                    Guardar Identidade da Empresa
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* TAB 4: REGRAS DE COBRANÇA */}
          {activeTab === 'billing_settings' && (
            <Card className="p-6 bg-white border-slate-200 shadow-xs">
              <div className="border-b border-slate-100 pb-4 mb-6">
                <h2 className="text-base font-bold text-slate-900">Regras e Parâmetros de Cobrança</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Defina padrões para referências de faturas, tolerância de atraso e prazos de pagamento.
                </p>
              </div>

              <form onSubmit={handleSaveBilling} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Prefixo Padrão de Faturas
                    </label>
                    <Input
                      value={billingForm.invoicePrefix}
                      onChange={(e) => setBillingForm({ ...billingForm, invoicePrefix: e.target.value })}
                      placeholder="FT 2026/"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Exemplo: FT 2026/001</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Prazo Padrão de Vencimento (Dias)
                    </label>
                    <select
                      value={billingForm.defaultDueDays}
                      onChange={(e) => setBillingForm({ ...billingForm, defaultDueDays: Number(e.target.value) })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value={7}>7 dias (Pronto pagamento)</option>
                      <option value={15}>15 dias</option>
                      <option value={30}>30 dias (Padrão comercial)</option>
                      <option value={45}>45 dias</option>
                      <option value={60}>60 dias</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Método de Pagamento Preferencial
                    </label>
                    <select
                      value={billingForm.preferredPaymentMethod}
                      onChange={(e) => setBillingForm({ ...billingForm, preferredPaymentMethod: e.target.value as PaymentMethod })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="mbway">MB WAY</option>
                      <option value="bank_transfer">Transferência Bancária (IBAN)</option>
                      <option value="multibanco">Entidade e Referência Multibanco</option>
                      <option value="cash">Numerário / Presencial</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tolerância de Graça para Atraso (Dias)
                    </label>
                    <Input
                      type="number"
                      min={0}
                      max={30}
                      value={billingForm.overdueGracePeriodDays}
                      onChange={(e) => setBillingForm({ ...billingForm, overdueGracePeriodDays: Number(e.target.value) })}
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Dias após o vencimento antes de considerar o alerta prioritário.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <Button type="submit" variant="primary" className="gap-1.5">
                    <Save className="w-4 h-4" />
                    Guardar Regras de Cobrança
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* TAB 5: MODELOS & COMUNICAÇÃO */}
          {activeTab === 'messages_settings' && (
            <Card className="p-6 bg-white border-slate-200 shadow-xs">
              <div className="border-b border-slate-100 pb-4 mb-6">
                <h2 className="text-base font-bold text-slate-900">Definições de Comunicação e Mensagens</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure o tom de comunicação padrão e as variáveis anexadas às mensagens geradas.
                </p>
              </div>

              <form onSubmit={handleSaveMessages} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tom de Comunicação Padrão
                    </label>
                    <select
                      value={messageForm.defaultTone}
                      onChange={(e) => setMessageForm({ ...messageForm, defaultTone: e.target.value as MessageTone })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="cordial">Cordial (Amigável e compreensivo)</option>
                      <option value="professional">Profissional (Equilibrado e claro)</option>
                      <option value="direct">Direto (Focado no prazo e valor)</option>
                      <option value="formal">Formal (Solene e corporativo)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Canal Preferencial de Envio
                    </label>
                    <select
                      value={messageForm.defaultChannel}
                      onChange={(e) => setMessageForm({ ...messageForm, defaultChannel: e.target.value as MessageChannel })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="whatsapp">WhatsApp</option>
                      <option value="email">Correio Eletrónico (E-mail)</option>
                      <option value="sms">SMS</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-xs font-semibold text-slate-800 mb-2">
                    Inclusão Automática de Dados na Mensagem:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                    <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={messageForm.includeReference}
                        onChange={(e) => setMessageForm({ ...messageForm, includeReference: e.target.checked })}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      Número / Referência da Fatura
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={messageForm.includeAmount}
                        onChange={(e) => setMessageForm({ ...messageForm, includeAmount: e.target.checked })}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      Valor em dívida (€)
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={messageForm.includeDueDate}
                        onChange={(e) => setMessageForm({ ...messageForm, includeDueDate: e.target.checked })}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      Data limite de vencimento
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={messageForm.includeBankDetails}
                        onChange={(e) => setMessageForm({ ...messageForm, includeBankDetails: e.target.checked })}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      Dados de pagamento (IBAN / MB WAY)
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dados de Pagamento Anexados (IBAN / MB WAY)
                  </label>
                  <textarea
                    rows={3}
                    value={messageForm.customPaymentDetails || ''}
                    onChange={(e) => setMessageForm({ ...messageForm, customPaymentDetails: e.target.value })}
                    placeholder="IBAN: PT50 0000 ...&#10;MB WAY: 912 345 678"
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <Button type="submit" variant="primary" className="gap-1.5">
                    <Save className="w-4 h-4" />
                    Guardar Preferências de Mensagens
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* TAB 6: REGRAS DE AUTOMAÇÃO */}
          {activeTab === 'automations_settings' && (
            <Card className="p-6 bg-white border-slate-200 shadow-xs">
              <div className="border-b border-slate-100 pb-4 mb-6">
                <h2 className="text-base font-bold text-slate-900">Motor de Automações e Lembretes</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure o processamento diário de tarefas, verificação de prazos e resolução automática.
                </p>
              </div>

              <form onSubmit={handleSaveAutomations} className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Motor Global de Automações Ativo
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Permite a execução agendada de regras e lembretes configurados.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={automationForm.globalEnabled}
                      onChange={(e) => setAutomationForm({ ...automationForm, globalEnabled: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer pt-3 border-t border-slate-200/80">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Apenas em Dias Úteis (Segunda a Sexta)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Evita gerar tarefas de cobrança aos fins de semana.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={automationForm.businessDaysOnly}
                      onChange={(e) => setAutomationForm({ ...automationForm, businessDaysOnly: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer pt-3 border-t border-slate-200/80">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Auto-resolução ao Registar Pagamento
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Marca automaticamente os lembretes pendentes da fatura como concluídos.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={automationForm.autoResolveOnPayment}
                      onChange={(e) => setAutomationForm({ ...automationForm, autoResolveOnPayment: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Horário de Execução Diária
                    </label>
                    <select
                      value={automationForm.preferredRunHour}
                      onChange={(e) => setAutomationForm({ ...automationForm, preferredRunHour: Number(e.target.value) })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value={8}>08:00 (Início da manhã)</option>
                      <option value={9}>09:00 (Recomendado)</option>
                      <option value={10}>10:00</option>
                      <option value={14}>14:00 (Início da tarde)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Prioridade Padrão de Novos Lembretes
                    </label>
                    <select
                      value={automationForm.defaultReminderPriority}
                      onChange={(e) => setAutomationForm({ ...automationForm, defaultReminderPriority: e.target.value as any })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="low">Baixa</option>
                      <option value="medium">Média (Padrão)</option>
                      <option value="high">Alta</option>
                      <option value="urgent">Urgente</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <Button type="submit" variant="primary" className="gap-1.5">
                    <Save className="w-4 h-4" />
                    Guardar Regras de Automação
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* TAB 7: PREFERÊNCIAS DE ALERTAS */}
          {activeTab === 'notifications_settings' && (
            <Card className="p-6 bg-white border-slate-200 shadow-xs">
              <div className="border-b border-slate-100 pb-4 mb-6">
                <h2 className="text-base font-bold text-slate-900">Preferências de Alertas e Notificações</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Escolha os eventos operacionais que geram alertas imediatos no Centro de Notificações.
                </p>
              </div>

              <form onSubmit={handleSaveNotifications} className="space-y-3">
                <div className="space-y-2">
                  <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">
                        Faturas com Vencimento no Dia
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Alerta matinal de faturas que vencem hoje.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifForm.notifyInvoiceDueToday}
                      onChange={(e) => setNotifForm({ ...notifForm, notifyInvoiceDueToday: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">
                        Cobranças Vencidas em Atraso
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Alerta prioritário quando uma fatura ultrapassa a data limite.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifForm.notifyOverdueInvoices}
                      onChange={(e) => setNotifForm({ ...notifForm, notifyOverdueInvoices: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">
                        Pagamentos Recebidos
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Notificação imediata após registo ou confirmação de pagamento.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifForm.notifyPaymentsReceived}
                      onChange={(e) => setNotifForm({ ...notifForm, notifyPaymentsReceived: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">
                        Promessas de Pagamento e Quebras de Acordo
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Alertas quando um cliente tem um acordo para hoje ou quebrou a data acordada.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifForm.notifyPromisesDue}
                      onChange={(e) => setNotifForm({ ...notifForm, notifyPromisesDue: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">
                        Resumo Financeiro Semanal
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Síntese consolidada do volume faturado, recebido e pendente da semana.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifForm.notifyWeeklyReport}
                      onChange={(e) => setNotifForm({ ...notifForm, notifyWeeklyReport: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  </label>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs opacity-75">
                    <div>
                      <span className="font-semibold text-slate-800 block">
                        Alertas Críticos de Segurança e Faturação
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Permanecem sempre ativos por motivos de conformidade e segurança da conta.
                      </span>
                    </div>
                    <Badge variant="neutral" size="sm">Obrigatório</Badge>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <Button type="submit" variant="primary" className="gap-1.5">
                    <Save className="w-4 h-4" />
                    Guardar Preferências
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* TAB 8: ESPAÇOS DE TRABALHO */}
          {activeTab === 'workspaces' && (
            <div className="space-y-6">
              <Card className="p-6 bg-white border-slate-200 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Espaços de Trabalho (Multi-Tenant)</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Alterne facilmente entre diferentes empresas ou crie um novo espaço independente.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsWorkspaceModalOpen(true)}
                    className="gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    Novo Espaço de Trabalho
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {accounts.map((acc) => {
                    const isCurrent = acc.id === account?.id;
                    return (
                      <div
                        key={acc.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isCurrent
                            ? 'bg-indigo-50/40 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`p-2 rounded-lg ${isCurrent ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="text-xs font-bold text-slate-900">{acc.name}</h3>
                              <p className="text-[11px] text-slate-400">
                                {acc.taxId || 'NIF não configurado'}
                              </p>
                            </div>
                          </div>
                          <Badge variant={acc.plan === 'pro' ? 'success' : acc.plan === 'plus' ? 'primary' : 'neutral'} size="sm">
                            {acc.plan.toUpperCase()}
                          </Badge>
                        </div>

                        <div className="text-[11px] text-slate-500 mb-3">
                          {acc.activityType || 'Atividade Geral'}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          {isCurrent ? (
                            <span className="text-xs font-semibold text-indigo-700 flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              Espaço Ativo
                            </span>
                          ) : (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                switchAccount(acc.id);
                                showToast(`Alternado para o espaço "${acc.name}".`, 'info');
                              }}
                              className="text-xs h-7"
                            >
                              Mudar para este espaço
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Modal Criar Novo Espaço de Trabalho */}
      <Modal
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
        title="Criar Novo Espaço de Trabalho"
      >
        <form onSubmit={handleCreateWorkspace} className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Cada espaço de trabalho tem a sua própria base isolada de clientes, faturas, modelos e relatórios.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nome da Empresa / Espaço *
            </label>
            <Input
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              placeholder="Ex: Comercial Sul Lda."
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              NIF (Opcional)
            </label>
            <Input
              value={newWorkspaceTaxId}
              onChange={(e) => setNewWorkspaceTaxId(e.target.value)}
              placeholder="PT509000111"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Setor de Atividade
            </label>
            <Input
              value={newWorkspaceActivity}
              onChange={(e) => setNewWorkspaceActivity(e.target.value)}
              placeholder="Ex: Serviços, Construção, Retalho..."
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsWorkspaceModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={workspaceLoading}
            >
              {workspaceLoading ? 'A criar...' : 'Criar Espaço'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
