export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  bloodGroup: string;
  abhaNumber: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  name: string;
  phone?: string;
  bloodGroup?: string;
  dateOfBirth?: string;
  gender?: 'Male' | 'Female' | 'Other';
}

export interface AuthState {
  user: Patient | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextType extends AuthState {
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  updateUser: (user: Patient) => void;
  logout: () => void;
  clearError: () => void;
}
