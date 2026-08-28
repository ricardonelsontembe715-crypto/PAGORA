/**
 * Serviço de Sincronização de Dados e Persistência Multi-Tenant da PAGORA
 * Garante persistência no backend para utilizadores, faturas, clientes e automações.
 */

import { storage } from './storage';

export const dataSyncService = {
  /**
   * Grava dados de um recurso para um espaço de trabalho no servidor e no storage local
   */
  async syncResource<T>(accountId: string, resourceKey: string, data: T): Promise<void> {
    if (!accountId) return;

    // 1. Persistência local imediata
    storage.setTenantData(accountId, resourceKey, data);

    // 2. Persistência remota assíncrona no backend
    try {
      await fetch(`/api/data/${resourceKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-account-id': accountId,
        },
        body: JSON.stringify({ accountId, data }),
      });
    } catch {
      // Falha de rede tolerada: local storage atua como cache fiável
    }
  },

  /**
   * Obtém dados do servidor ou fallback para cache local
   */
  async fetchResource<T>(accountId: string, resourceKey: string, fallback: T): Promise<T> {
    if (!accountId) return fallback;

    const localData = storage.getTenantData<T>(accountId, resourceKey, fallback);

    try {
      const response = await fetch(`/api/data/${resourceKey}`, {
        method: 'GET',
        headers: {
          'x-account-id': accountId,
        },
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data !== null && json.data !== undefined) {
          // Atualizar local storage com versão do servidor
          storage.setTenantData(accountId, resourceKey, json.data);
          return json.data as T;
        }
      }
    } catch {
      // Erro de rede: usa cache local
    }

    return localData;
  },
};
