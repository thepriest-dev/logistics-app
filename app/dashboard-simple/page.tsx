// app/dashboard-simple/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';

export default function SimpleDashboardPage() {
  const { user } = useAuth();
  const [localUser, setLocalUser] = useState<any>(null);

  useEffect(() => {
    // Check localStorage directly
    const stored = localStorage.getItem('sendit_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setLocalUser(parsed);
        console.log('Direct localStorage check:', parsed);
      } catch (e) {
        console.error('Error parsing localStorage:', e);
      }
    }
  }, []);

  // Log what we have
  console.log('Auth user:', user);
  console.log('Local user:', localUser);

  if (!user && !localUser) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f3f4f6',
        padding: '40px',
        textAlign: 'center',
        fontFamily: 'sans-serif'
      }}>
        <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', maxWidth: '400px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>🔍 Not Logged In</h1>
          <p style={{ color: '#6b7280', marginBottom: '16px' }}>No user found in localStorage</p>
          <a href="/login" style={{ 
            backgroundColor: '#2563eb', 
            color: 'white', 
            padding: '10px 24px',
            borderRadius: '8px',
            textDecoration: 'none',
            display: 'inline-block'
          }}>
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  const displayUser = user || localUser;

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f3f4f6',
      padding: '20px',
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '600px',
        margin: '0 auto',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
          📦 Simple Dashboard
        </h1>
        <p style={{ marginBottom: '8px' }}>
          <strong>Name:</strong> {displayUser?.name}
        </p>
        <p style={{ marginBottom: '8px' }}>
          <strong>Email:</strong> {displayUser?.email}
        </p>
        <p style={{ marginBottom: '16px' }}>
          <strong>Phone:</strong> {displayUser?.phone || 'Not provided'}
        </p>
        <button 
          onClick={() => {
            localStorage.removeItem('sendit_user');
            window.location.href = '/login';
          }}
          style={{ 
            backgroundColor: '#ef4444', 
            color: 'white', 
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            marginTop: '8px'
          }}
        >
          Logout
        </button>
        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
          <p style={{ fontSize: '12px', color: '#6b7280' }}>
            Debug: user from auth = {user ? '✅ Present' : '❌ Missing'}, 
            localStorage = {localUser ? '✅ Present' : '❌ Missing'}
          </p>
        </div>
      </div>
    </div>
  );
}