// app/(dashboard)/layout.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NotificationBell from '@/components/NotificationBell';
import { 
  LogOut, 
  LayoutDashboard, 
  Package, 
  PlusCircle, 
  User, 
  Truck, 
  Shield,
  Users,
  BarChart3,
  Settings,
  ClipboardCheck
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string>('user');

  useEffect(() => {
    const user = sessionStorage.getItem('sendit_user');
    console.log('Layout check: user =', user);
    
    if (!user) {
      console.log('No user found, redirecting to login');
      router.replace('/login');
      return;
    }
    
    try {
      const parsed = JSON.parse(user);
      setUserRole(parsed.role || 'user');
      setIsLoggedIn(true);
      console.log('User found, role:', parsed.role);
    } catch (e) {
      console.error('Invalid user data');
      sessionStorage.removeItem('sendit_user');
      router.replace('/login');
    }
  }, [router]);

  if (isLoggedIn === null) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f3f4f6'
      }}>
        Loading...
      </div>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  const logout = () => {
    sessionStorage.removeItem('sendit_user');
    window.location.href = '/login';
  };

  // Role-based navigation items
  const getNavItems = () => {
    // ADMIN NAVIGATION
    if (userRole === 'admin') {
      return [
        { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/admin/drivers', label: 'Drivers', icon: Truck },
        { href: '/admin/users', label: 'Users', icon: Users },
        { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
        { href: '/admin/packages', label: 'Packages', icon: Package },
        { href: '/admin/settings', label: 'Settings', icon: Settings },
        { href: '/profile', label: 'Profile', icon: User },
      ];
    }

    // DRIVER NAVIGATION
    if (userRole === 'driver') {
      return [
        { href: '/driver', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/driver/packages', label: 'My Deliveries', icon: Package },
        { href: '/profile', label: 'Profile', icon: User },
      ];
    }

    // STOREKEEPER NAVIGATION - Receives and verifies packages only
    if (userRole === 'storekeeper') {
      return [
        { href: '/storekeeper', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/storekeeper/packages', label: 'Incoming Packages', icon: Package },
        { href: '/profile', label: 'Profile', icon: User },
      ];
    }

    // REGULAR USER NAVIGATION
    return [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/packages', label: 'Packages', icon: Package },
      { href: '/create', label: 'Send', icon: PlusCircle },
      { href: '/profile', label: 'Profile', icon: User },
    ];
  };

  const navItems = getNavItems();

  // Get page title based on current path
  const getPageTitle = () => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.includes('/admin/packages')) return 'Manage Packages';
      if (path.includes('/admin/drivers')) return 'Manage Drivers';
      if (path.includes('/admin/users')) return 'Manage Users';
      if (path.includes('/admin/analytics')) return 'Analytics';
      if (path.includes('/admin/settings')) return 'Settings';
      if (path.includes('/admin')) return 'Admin Dashboard';
      if (path.includes('/driver')) return 'Driver Dashboard';
      if (path.includes('/storekeeper')) return 'Storekeeper Dashboard';
      if (path.includes('/packages')) return 'My Packages';
      if (path.includes('/create')) return 'Send Package';
      if (path.includes('/profile')) return 'Profile';
      return 'Dashboard';
    }
    return 'Dashboard';
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      {/* Top Bar */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 30
      }}>
        <Link href="/" style={{ fontSize: '20px', fontWeight: 'bold', color: '#2563eb' }}>
          Partum 
          {userRole === 'admin' && <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'normal' }}> Admin</span>}
          {userRole === 'storekeeper' && <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'normal' }}> Store</span>}
          {userRole === 'driver' && <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'normal' }}> Driver</span>}
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <NotificationBell />
          <button
            onClick={logout}
            style={{
              padding: '8px',
              borderRadius: '8px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '16px', paddingBottom: '100px', maxWidth: '1200px', margin: '0 auto' }}>
        {children}
      </div>

      {/* Bottom Navigation */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '6px 0',
        zIndex: 40,
        overflowX: 'auto'
      }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '4px 8px',
                textDecoration: 'none',
                color: '#6b7280',
                fontSize: '10px',
                minWidth: '48px'
              }}
            >
              <Icon size={20} style={{ color: '#6b7280' }} />
              <span style={{ marginTop: '2px', fontSize: '9px' }}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}