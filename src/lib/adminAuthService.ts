/**
 * PAGORA — Dedicated Admin Authentication Service (Part 28)
 *
 * Gere a sessão do Proprietário no Painel Administrativo.
 * A validação das credenciais e integridade das sessões é 100% realizada no backend (/api/auth/admin-*).
 * Nunca guarda a palavra-passe administrativa no navegador nem no localStorage.
 */

const ADMIN_TOKEN_STORAGE_KEY = 'pagora_admin_sess_token';

export interface AdminLoginResponse {
  success: boolean;
  isAdmin?: boolean;
  token?: string;
  adminEmail?: string;
  expiresAt?: number;
  error?: string;
  message?: string;
}

export interface AdminSessionState {
  isAuthenticated: boolean;
  token: string | null;
  adminEmail: string | null;
  expiresAt: number | null;
}

export class AdminAuthService {
  private static cachedToken: string | null = null;
  private static cachedEmail: string | null = null;
  private static cachedExpiresAt: number | null = null;

  /**
   * Obtém o token de sessão ativo (recuperando de sessionStorage se existente)
   */
  static getSessionToken(): string | null {
    if (this.cachedToken) return this.cachedToken;
    try {
      const stored = sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
      if (stored) {
        this.cachedToken = stored;
        return stored;
      }
    } catch {
      // Ignora erro em ambientes restritos
    }
    return null;
  }

  /**
   * Autentica o administrador contra o endpoint de segurança no backend
   */
  static async login(email: string, password: string): Promise<AdminLoginResponse> {
    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.token) {
        this.cachedToken = data.token;
        this.cachedEmail = data.adminEmail || email;
        this.cachedExpiresAt = data.expiresAt || Date.now() + 12 * 3600 * 1000;

        try {
          sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, data.token);
        } catch {
          // Ignora
        }

        return {
          success: true,
          isAdmin: true,
          token: data.token,
          adminEmail: this.cachedEmail || undefined,
          expiresAt: this.cachedExpiresAt || undefined,
          message: data.message,
        };
      }

      return {
        success: false,
        error: data.error || 'Credenciais de administrador inválidas.',
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na comunicação com o servidor de autenticação.';
      return {
        success: false,
        error: `Servidor indisponível ou inacessível: ${msg}`,
      };
    }
  }

  /**
   * Valida se a sessão atual do administrador ainda é válida no backend
   */
  static async verifySession(): Promise<{ isValid: boolean; email?: string; error?: string }> {
    const token = this.getSessionToken();
    if (!token) {
      return { isValid: false, error: 'Nenhuma sessão ativa.' };
    }

    try {
      const res = await fetch('/api/auth/admin-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        this.clearSession();
        return { isValid: false, error: 'Sessão expirada ou não autorizada.' };
      }

      const data = await res.json();
      if (data.success && data.isValid) {
        if (data.email) this.cachedEmail = data.email;
        if (data.expiresAt) this.cachedExpiresAt = data.expiresAt;
        return { isValid: true, email: data.email };
      }

      this.clearSession();
      return { isValid: false, error: data.error || 'Sessão inválida.' };
    } catch {
      // Se estiver offline ou backend temporariamente inatingível
      return { isValid: false, error: 'Não foi possível validar a sessão com o servidor.' };
    }
  }

  /**
   * Termina a sessão administrativa revogando no servidor
   */
  static async logout(): Promise<void> {
    const token = this.getSessionToken();
    if (token) {
      try {
        await fetch('/api/auth/admin-logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ token }),
        });
      } catch {
        // Silencioso
      }
    }
    this.clearSession();
  }

  /**
   * Limpa a sessão localmente
   */
  static clearSession(): void {
    this.cachedToken = null;
    this.cachedEmail = null;
    this.cachedExpiresAt = null;
    try {
      sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    } catch {
      // Ignora
    }
  }

  static getCachedEmail(): string {
    return this.cachedEmail || 'admin@pagora.pt';
  }
}
