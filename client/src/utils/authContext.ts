import { createContext } from 'react';

interface AuthContextType {
  accessToken: string | null;
  login: () => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
export type { AuthContextType };