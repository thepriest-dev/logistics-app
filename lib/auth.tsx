// lib/auth.tsx

'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from './supabase';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin' | 'driver' | 'storekeeper';
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, phone: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hardcoded users for testing
const TEST_USERS = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '1234567890',
    password: 'password123',
    role: 'user' as const,
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '0987654321',
    password: 'password123',
    role: 'user' as const,
    created_at: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Driver User',
    email: 'driver@sendit.com',
    phone: '1112223333',
    password: 'driver123',
    role: 'driver' as const,
    created_at: new Date().toISOString()
  },
  {
    id: '4',
    name: 'Storekeeper User',
    email: 'storekeeper@sendit.com',
    phone: '4445556666',
    password: 'storekeeper123',
    role: 'storekeeper' as const,
    created_at: new Date().toISOString()
  },
  {
    id: '5',
    name: 'Admin User',
    email: 'admin@sendit.com',
    phone: '7778889999',
    password: 'admin123',
    role: 'admin' as const,
    created_at: new Date().toISOString()
  }
];

// Helper function to get redirect path based on role
const getRedirectPath = (role: string): string => {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'driver':
      return '/driver';
    case 'storekeeper':
      return '/storekeeper';
    default:
      return '/dashboard';
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('sendit_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        sessionStorage.removeItem('sendit_user');
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login for:', email);

      // First try to get user from Supabase
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .maybeSingle();

        if (!error && data) {
          // Check password
          if (data.password === password) {
            const userData: User = {
              id: data.id,
              name: data.name,
              email: data.email,
              phone: data.phone,
              role: data.role || 'user',
              created_at: data.created_at,
            };
            sessionStorage.setItem('sendit_user', JSON.stringify(userData));
            setUser(userData);
            console.log('Login successful from DB for:', data.name);
            
            // Redirect based on role
            const redirectPath = getRedirectPath(data.role);
            window.location.href = redirectPath;
            
            return { success: true };
          }
        }
      } catch (dbError) {
        console.log('DB lookup failed, trying hardcoded users...');
      }

      // Fallback: Check hardcoded users
      const hardcodedUser = TEST_USERS.find(
        u => u.email === email && u.password === password
      );

      if (hardcodedUser) {
        const userData: User = {
          id: hardcodedUser.id,
          name: hardcodedUser.name,
          email: hardcodedUser.email,
          phone: hardcodedUser.phone,
          role: hardcodedUser.role,
          created_at: hardcodedUser.created_at,
        };
        sessionStorage.setItem('sendit_user', JSON.stringify(userData));
        setUser(userData);
        console.log('Login successful from hardcoded users for:', hardcodedUser.name);
        
        // Redirect based on role
        const redirectPath = getRedirectPath(hardcodedUser.role);
        window.location.href = redirectPath;
        
        return { success: true };
      }

      return { success: false, error: 'Invalid email or password' };

    } catch (error) {
      console.error('Login exception:', error);
      return { success: false, error: 'Something went wrong. Please try again.' };
    }
  };

  const register = async (name: string, email: string, password: string, phone: string) => {
    try {
      // Check if user already exists in hardcoded list
      const existingHardcoded = TEST_USERS.find(u => u.email === email);
      if (existingHardcoded) {
        return { success: false, error: 'User with this email already exists' };
      }

      // Try to insert into Supabase
      try {
        const { data, error } = await supabase
          .from('users')
          .insert([{
            name,
            email,
            password,
            phone: phone || '',
            role: 'user',
            status: 'active'
          }])
          .select()
          .maybeSingle();

        if (!error && data) {
          const userData: User = {
            id: data.id,
            name: data.name,
            email: data.email,
            phone: data.phone,
            role: data.role || 'user',
            created_at: data.created_at,
          };
          sessionStorage.setItem('sendit_user', JSON.stringify(userData));
          setUser(userData);
          console.log('Registration successful from DB for:', data.name);
          return { success: true };
        }
      } catch (dbError) {
        console.log('DB insert failed, using hardcoded fallback...');
      }

      // Fallback: Just create a local session (no DB)
      const newUser: User = {
        id: Date.now().toString(),
        name,
        email,
        phone: phone || '',
        role: 'user',
        created_at: new Date().toISOString(),
      };
      sessionStorage.setItem('sendit_user', JSON.stringify(newUser));
      setUser(newUser);
      console.log('Registration successful (local) for:', name);
      return { success: true };

    } catch (error) {
      console.error('Registration exception:', error);
      return { success: false, error: 'Something went wrong. Please try again.' };
    }
  };

  const logout = () => {
    sessionStorage.removeItem('sendit_user');
    setUser(null);
    window.location.href = '/login';
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      sessionStorage.setItem('sendit_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}