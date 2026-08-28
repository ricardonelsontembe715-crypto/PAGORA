import React, { useState, useMemo } from 'react';
import { Customer, CustomerStatus } from '../../types/database';
import { useCustomers } from '../../context/CustomerContext';
import { useNavigation } from '../../context/NavigationContext';
import { useNotifications } from '../../context/NotificationContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import { Pagination } from '../ui/Pagination';
import { CustomerFormModal } from '../customers/CustomerFormModal';
import { ArchiveCustomerModal } from '../customers/ArchiveCustomerModal';
import { DeleteCustomerModal } from '../customers/DeleteCustomerModal';
import { formatCurrency, formatDate } from '../../lib/formatters';
import {
  Users,
  User,
  Building2,
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  MoreVertical,
  Mail,
  Phone,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Archive,
  RotateCcw,
  Eye,
  Edit2,
  Trash2,
  X,
  FileText,
  Briefcase,
} from 'lucide-react';

type FilterTab = 'all' | 'active' | 'clean' | 'pending' | 'overdue' | 'archived';
type SortOption =
  | 'name_asc'
  | 'name_desc'
  | 'created_desc'
  | 'created_asc'
  | 'pending_desc'
  | 'overdue_desc';

export const CustomersView: React.FC = () => {
  const {
    allAccountCustomers,
    restoreCustomer,
    getCustomerStats,
    getAccountCustomerMetrics,
    isLoading,
  } = useCustomers();
  const { navigateToCustomer } = useNavigation();
  const { showToast } = useNotifications();

  // Estados de modais
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [customerToArchive, setCustomerToArchive] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // Estados de pesquisa, filtro e ordenação
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [sortOption, setSortOption] = useState<SortOption>('created_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Métricas do topo
  const metrics = useMemo(() => getAccountCustomerMetrics(), [allAccountCustomers]);

  // Filtragem e Pesquisa com dados reais
  const filteredCustomers = useMemo(() => {
    return allAccountCustomers.filter((customer) => {
      // 1. Filtro de pesquisa textual
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = customer.name.toLowerCase().includes(q);
        const matchesEmail = customer.email?.toLowerCase().includes(q) || false;
        const matchesPhone = customer.phone?.toLowerCase().includes(q) || false;
        const matchesTaxId = customer.taxId?.toLowerCase().includes(q) || false;
        const matchesCity = customer.city?.toLowerCase().includes(q) || false;

        if (!matchesName && !matchesEmail && !matchesPhone && !matchesTaxId && !matchesCity) {
          return false;
        }
      }

      // 2. Filtro de estado / financeiro
      const stats = getCustomerStats(customer.id);

      switch (activeFilter) {
        case 'active':
          return customer.status === 'active';
        case 'archived':
          return customer.status === 'archived';
        case 'clean':
          return customer.status === 'active' && stats.totalPending === 0 && stats.totalOverdue === 0;
        case 'pending':
          return customer.status === 'active' && stats.totalPending > 0;
        case 'overdue':
          return customer.status === 'active' && stats.totalOverdue > 0;
        case 'all':
        default:
          // 'all' mostra clientes ativos por defeito a menos que arquivados seja selecionado
          return true;
      }
    });
  }, [allAccountCustomers, searchQuery, activeFilter]);

  // Ordenação dos clientes
  const sortedCustomers = useMemo(() => {
    return [...filteredCustomers].sort((a, b) => {
      const statsA = getCustomerStats(a.id);
      const statsB = getCustomerStats(b.id);

      switch (sortOption) {
        case 'name_asc':
          return a.name.localeCompare(b.name, 'pt-PT', { sensitivity: 'base' });
        case 'name_desc':
          return b.name.localeCompare(a.name, 'pt-PT', { sensitivity: 'base' });
        case 'created_asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'pending_desc':
          return statsB.totalPending - statsA.totalPending;
        case 'overdue_desc':
          return statsB.totalOverdue - statsA.totalOverdue;
        case 'created_desc':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [filteredCustomers, sortOption]);

  // Paginação real
  const totalPages = Math.ceil(sortedCustomers.length / itemsPerPage);
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedCustomers.slice(start, start + itemsPerPage);
  }, [sortedCustomers, currentPage, itemsPerPage]);

  // Reset de página quando muda filtro ou pesquisa
  const handleFilterChange = (filter: FilterTab) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setActiveFilter('all');
    setSortOption('created_desc');
    setCurrentPage(1);
  };

  const isFiltered = searchQuery.trim() !== '' || activeFilter !== 'all';

  // Restauração direta de cliente arquivado
  const handleRestore = async (id: string, name: string) => {
    const res = await restoreCustomer(id);
    if (res.success) {
      showToast({
        type: 'success',
        title: 'Cliente restaurado.',
        message: `${name} foi reativado e voltou à lista principal.`,
      });
    } else {
      showToast({
        type: 'error',
        title: 'Não foi possível restaurar',
        message: res.error || 'Tente novamente.',
      });
    }
  };

  // Se a conta não tem qualquer cliente registado: Empty State da Secção 3
  const isAccountEmpty = allAccountCustomers.length === 0;

  return (
    <div className="space-y-6">
      {/* Header Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Clientes</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize os seus clientes e mantenha todas as informações importantes num só lugar.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setCustomerToEdit(null);
            setIsFormModalOpen(true);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          + Adicionar cliente
        </Button>
      </div>

      {/* Indicadores do Topo (Apenas com dados reais) */}
      {!isAccountEmpty && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <Card hoverable className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total de clientes</span>
              <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1.5">{metrics.totalCustomers}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {metrics.activeCustomers} ativos • {metrics.archivedCustomers} arquivados
            </div>
          </Card>

          <Card hoverable className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Clientes ativos</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-700 mt-1.5">
              {metrics.activeCustomers}
            </div>
            <div className="text-[11px] text-emerald-600 mt-0.5 font-medium">Em atividade regular</div>
          </Card>

          <Card hoverable className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Com valores pendentes</span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1.5">
              {metrics.customersWithPending}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">A aguardar liquidação</div>
          </Card>

          <Card hoverable className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Com valores em atraso</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-amber-700 mt-1.5">
              {metrics.customersWithOverdue}
            </div>
            <div className="text-[11px] text-amber-700 mt-0.5 font-medium">
              Requer atenção de cobrança
            </div>
          </Card>
        </div>
      )}

      {/* Caso vazio inicial da conta */}
      {isAccountEmpty ? (
        <Card className="p-8 text-center sm:p-12">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-8 ring-indigo-50/50">
            <Users className="w-7 h-7" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Comece pelo seu primeiro cliente
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1.5 leading-relaxed">
            Adicione um cliente para começar a organizar as suas cobranças.
          </p>
          <div className="mt-6 flex justify-center">
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setCustomerToEdit(null);
                setIsFormModalOpen(true);
              }}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              + Adicionar cliente
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Barra de Pesquisa, Filtros e Ordenação */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              {/* Pesquisa em tempo real */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome, e-mail ou telefone..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs text-slate-900 bg-slate-50/60 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => handleSearchChange('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    aria-label="Limpar pesquisa"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Ordenação */}
              <div className="flex items-center gap-2 shrink-0">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="text-xs text-slate-700 bg-slate-50/60 border border-slate-200 rounded-lg py-2 px-2.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="created_desc">Mais recentes</option>
                  <option value="created_asc">Mais antigos</option>
                  <option value="name_asc">Nome (A - Z)</option>
                  <option value="name_desc">Nome (Z - A)</option>
                  <option value="pending_desc">Maior valor em aberto</option>
                  <option value="overdue_desc">Maior atraso</option>
                </select>

                {isFiltered && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="text-slate-500 text-xs hover:text-slate-900"
                  >
                    Limpar filtros
                  </Button>
                )}
              </div>
            </div>

            {/* Abas / Filtros Rápidos */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none pt-1 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1 shrink-0">
                <Filter className="w-3 h-3" />
                Filtros:
              </span>

              {[
                { id: 'all', label: 'Todos' },
                { id: 'active', label: 'Ativos' },
                { id: 'clean', label: 'Sem valores em aberto' },
                { id: 'pending', label: 'Com valores pendentes' },
                { id: 'overdue', label: 'Com pagamentos em atraso' },
                { id: 'archived', label: 'Arquivados' },
              ].map((tab) => {
                const isActive = activeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleFilterChange(tab.id as FilterTab)}
                    className={`text-xs px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lista Vazia por Pesquisa/Filtro */}
          {sortedCustomers.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Não encontrámos clientes</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Tente pesquisar por outro nome, e-mail ou telefone, ou limpe os filtros ativos.
              </p>
              <div className="mt-4">
                <Button variant="outline" size="sm" onClick={handleClearFilters}>
                  Limpar filtros de pesquisa
                </Button>
              </div>
            </Card>
          ) : (
            <>
              {/* Tabela Desktop (visível a partir de md:) */}
              <div className="hidden md:block bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Cliente</th>
                      <th className="py-3 px-4">Contacto</th>
                      <th className="py-3 px-4 text-right">Total em aberto</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4">Última atividade</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {paginatedCustomers.map((customer) => {
                      const stats = getCustomerStats(customer.id);
                      const isArchived = customer.status === 'archived';

                      return (
                        <tr
                          key={customer.id}
                          className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                          onClick={() => navigateToCustomer(customer.id)}
                        >
                          {/* Coluna Cliente */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                                  customer.type === 'company'
                                    ? 'bg-indigo-50 text-indigo-700'
                                    : 'bg-emerald-50 text-emerald-700'
                                }`}
                              >
                                {customer.type === 'company' ? (
                                  <Building2 className="w-4 h-4" />
                                ) : (
                                  <User className="w-4 h-4" />
                                )}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                                  <span>{customer.name}</span>
                                  {customer.type === 'company' ? (
                                    <span className="text-[10px] text-slate-400 font-normal">
                                      (Empresa)
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 font-normal">
                                      (Pessoa)
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5">
                                  {customer.taxId ? `NIF: ${customer.taxId}` : 'Sem NIF'}
                                  {customer.city ? ` • ${customer.city}` : ''}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Coluna Contacto */}
                          <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                            <div className="space-y-0.5 text-[11px]">
                              {customer.email ? (
                                <a
                                  href={`mailto:${customer.email}`}
                                  className="text-slate-600 hover:text-indigo-600 flex items-center gap-1.5 truncate max-w-[200px]"
                                >
                                  <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate">{customer.email}</span>
                                </a>
                              ) : (
                                <span className="text-slate-400 italic">Sem e-mail</span>
                              )}
                              {customer.phone && (
                                <a
                                  href={`tel:${customer.phone}`}
                                  className="text-slate-600 hover:text-indigo-600 flex items-center gap-1.5"
                                >
                                  <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>{customer.phone}</span>
                                </a>
                              )}
                            </div>
                          </td>

                          {/* Coluna Total em Aberto */}
                          <td className="py-3.5 px-4 text-right">
                            {stats.totalOverdue > 0 ? (
                              <div>
                                <div className="font-bold text-amber-700">
                                  {formatCurrency(stats.totalOverdue + stats.totalPending)}
                                </div>
                                <div className="text-[10px] text-amber-600 font-medium">
                                  {formatCurrency(stats.totalOverdue)} em atraso
                                </div>
                              </div>
                            ) : stats.totalPending > 0 ? (
                              <div>
                                <div className="font-bold text-slate-900">
                                  {formatCurrency(stats.totalPending)}
                                </div>
                                <div className="text-[10px] text-slate-400">Pendente</div>
                              </div>
                            ) : (
                              <div className="font-semibold text-emerald-600 flex items-center justify-end gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>0,00 €</span>
                              </div>
                            )}
                          </td>

                          {/* Coluna Estado */}
                          <td className="py-3.5 px-4">
                            {isArchived ? (
                              <Badge variant="neutral" size="sm">
                                Arquivado
                              </Badge>
                            ) : (
                              <Badge variant="success" size="sm">
                                Ativo
                              </Badge>
                            )}
                          </td>

                          {/* Coluna Última Atividade */}
                          <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                            {customer.updatedAt
                              ? formatDate(customer.updatedAt)
                              : formatDate(customer.createdAt)}
                          </td>

                          {/* Coluna Ações */}
                          <td
                            className="py-3.5 px-4 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigateToCustomer(customer.id)}
                                title="Ver perfil do cliente"
                                className="p-1.5 text-slate-500 hover:text-indigo-600"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setCustomerToEdit(customer);
                                  setIsFormModalOpen(true);
                                }}
                                title="Editar dados"
                                className="p-1.5 text-slate-500 hover:text-slate-900"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>

                              {isArchived ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRestore(customer.id, customer.name)}
                                  title="Restaurar cliente"
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-50"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setCustomerToArchive(customer)}
                                  title="Arquivar cliente"
                                  className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                                >
                                  <Archive className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Lista em Cartões Mobile (< md:) */}
              <div className="md:hidden space-y-3">
                {paginatedCustomers.map((customer) => {
                  const stats = getCustomerStats(customer.id);
                  const isArchived = customer.status === 'archived';

                  return (
                    <div
                      key={customer.id}
                      onClick={() => navigateToCustomer(customer.id)}
                      className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-3 cursor-pointer hover:border-indigo-200 transition-colors"
                    >
                      {/* Cabeçalho do Cartão Mobile */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                              customer.type === 'company'
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {customer.type === 'company' ? (
                              <Building2 className="w-4 h-4" />
                            ) : (
                              <User className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900">{customer.name}</div>
                            <div className="text-[10px] text-slate-400">
                              {customer.taxId ? `NIF: ${customer.taxId}` : 'Sem NIF'}
                              {customer.city ? ` • ${customer.city}` : ''}
                            </div>
                          </div>
                        </div>

                        <div>
                          {isArchived ? (
                            <Badge variant="neutral" size="sm">
                              Arquivado
                            </Badge>
                          ) : (
                            <Badge variant="success" size="sm">
                              Ativo
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Contactos */}
                      {(customer.email || customer.phone) && (
                        <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2 text-[11px] text-slate-600">
                          {customer.email && (
                            <span className="flex items-center gap-1 truncate max-w-[200px]">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span className="truncate">{customer.email}</span>
                            </span>
                          )}
                          {customer.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{customer.phone}</span>
                            </span>
                          )}
                        </div>
                      )}

                      {/* Resumo e Ações Mobile */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-slate-400">Total em aberto</div>
                          <div
                            className={`text-xs font-bold ${
                              stats.totalOverdue > 0
                                ? 'text-amber-700'
                                : stats.totalPending > 0
                                ? 'text-slate-900'
                                : 'text-emerald-600'
                            }`}
                          >
                            {formatCurrency(stats.totalOverdue + stats.totalPending)}
                          </div>
                        </div>

                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigateToCustomer(customer.id)}
                            className="text-xs py-1 px-2.5"
                          >
                            Ver perfil
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCustomerToEdit(customer);
                              setIsFormModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Paginação */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </>
          )}
        </div>
      )}

      {/* Modais do Módulo */}
      <CustomerFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setCustomerToEdit(null);
        }}
        customerToEdit={customerToEdit}
      />

      <ArchiveCustomerModal
        isOpen={!!customerToArchive}
        onClose={() => setCustomerToArchive(null)}
        customer={customerToArchive}
      />

      <DeleteCustomerModal
        isOpen={!!customerToDelete}
        onClose={() => setCustomerToDelete(null)}
        customer={customerToDelete}
        onOpenArchiveInstead={() => {
          if (customerToDelete) setCustomerToArchive(customerToDelete);
        }}
      />
    </div>
  );
};
