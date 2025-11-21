import { createContext, useContext, useState } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock user data
    const mockUser: User = {
      id: '1',
      email,
      name: email.split('@')[0],
    };
    
    setUser(mockUser);
    setAccessToken("mock-access-token");
    localStorage.setItem('wellness-user', JSON.stringify(mockUser));
    localStorage.setItem('wellness-token', "mock-access-token");
    setIsLoading(false);
  };

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockUser: User = {
      id: '1',
      email,
      name,
    };
    
    setUser(mockUser);
    setAccessToken("mock-access-token");
    localStorage.setItem('wellness-user', JSON.stringify(mockUser));
    localStorage.setItem('wellness-token', "mock-access-token");
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('wellness-user');
    localStorage.removeItem('wellness-token');
  };

  // Check for existing user on mount
  useState(() => {
    const stored = localStorage.getItem('wellness-user');
    const storedToken = localStorage.getItem('wellness-token');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
        if (storedToken) setAccessToken(storedToken);
      } catch (e) {
        localStorage.removeItem('wellness-user');
        localStorage.removeItem('wellness-token');
      }
    }
  });

  return (
    <AuthContext.Provider value={{ user, accessToken, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
