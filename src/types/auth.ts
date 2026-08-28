import { User, Account, PlanType } from './database';

export interface AuthState {
  user: User | null;
  account: Account | null;
  accounts: Account[];
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface SignInCredentials {
  email: string;
  password: string; // Inserida pelo utilizador; validada no backend/serviço
  rememberMe?: boolean;
}

export interface SignUpCredentials {
  name: string;
  email: string;
  accountName: string;
  companyName?: string;
  password: string;
  passwordConfirm?: string;
  acceptTerms: boolean;
}

export interface OnboardingData {
  accountName?: string;
  activityType?: string;
  usagePurpose?: string;
  taxId?: string;
  phone?: string;
}

export interface CreateWorkspaceData {
  name: string;
  taxId?: string;
  activityType?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ProfileUpdateData {
  name?: string;
  phone?: string;
  accountName?: string;
  taxId?: string;
  address?: string;
  website?: string;
}

export interface RegisteredUserRecord {
  user: User;
  passwordHash: string; // Simulação de hash seguro
  accounts: Account[];
  primaryAccountId: string;
  resetToken?: string;
  resetTokenExpiry?: string;
}
