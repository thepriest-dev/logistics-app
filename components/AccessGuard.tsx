// components/AccessGuard.tsx

'use client';

import { useState, useEffect } from 'react';
import { Lock, Shield, Eye, EyeOff } from 'lucide-react';

export function AccessGuard({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if already authenticated in this session
    const sessionAuth = sessionStorage.getItem('app_authenticated');
    if (sessionAuth === 'true') {
      setIsAuthenticated(true);
      return;
    }

    // Check if we're in development/local mode
    const isLocal = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1';
    
    // Check if password protection is enabled
    const isProtected = process.env.NEXT_PUBLIC_APP_ACCESS_PASSWORD && 
                        process.env.NEXT_PUBLIC_APP_ENV === 'development';
    
    // If not protected or not local, skip password
    if (!isProtected || !isLocal) {
      setIsAuthenticated(true);
      return;
    }
    
    setIsAuthenticated(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = process.env.NEXT_PUBLIC_APP_ACCESS_PASSWORD || 'sendit2024';
    
    if (password === correctPassword) {
      sessionStorage.setItem('app_authenticated', 'true');
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Only show password screen in local development
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
          <div className="text-center mb-6">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Developer Access</h1>
            <p className="text-gray-500 text-sm mt-1">This is a protected development environment</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter access password"
                className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {error && (
              <p className="text-red-500 text-sm mt-2">{error}</p>
            )}

            <button
              type="submit"
              className="w-full mt-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition"
            >
              Access Application
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-4">
            Development Environment • Protected
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}