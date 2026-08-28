/**
 * Camada de armazenamento e persistência com validação de isolamento multi-tenant
 * Garante que qualquer consulta ou escrita é estritamente vinculada ao accountId ativo.
 */

const STORAGE_PREFIX = 'pagora_v1_';

function getItem<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    return item ? (JSON.parse(item) as T) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
  } catch (e) {
    console.error('Erro ao gravar no armazenamento local:', e);
  }
}

function removeItem(key: string): void {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  } catch (e) {
    console.error('Erro ao remover do armazenamento local:', e);
  }
}

export const storage = {
  get: getItem,
  set: setItem,
  remove: removeItem,

  // Operações com chave de isolamento de conta (Account ID)
  getTenantData<T>(accountId: string, resourceKey: string, fallback: T): T {
    if (!accountId) return fallback;
    return getItem<T>(`acc_${accountId}_${resourceKey}`, fallback);
  },

  setTenantData<T>(accountId: string, resourceKey: string, value: T): void {
    if (!accountId) return;
    setItem<T>(`acc_${accountId}_${resourceKey}`, value);
  },
};

