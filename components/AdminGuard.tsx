// components/AdminGuard.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = sessionStorage.getItem('sendit_user');
    if (!user) {
      router.replace('/login');
      setLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(user);
      if (parsed.role === 'admin') {
        setIsAuthorized(true);
      } else {
        // Not admin - redirect to dashboard
        router.replace('/dashboard');
      }
    } catch (e) {
      router.replace('/login');
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Authorizing...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}