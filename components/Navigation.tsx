// components/Navigation.tsx

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
  Home,
  Package,
  Plus,
  User,
  Settings,
  Bell,
  Truck,
  ClipboardList,
  BarChart3,
  Users,
  LogOut,
  Menu,
  X,
  LayoutDashboard
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactElement;
}

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (path: string) => {
    if (path === '/') return pathname === path;
    return pathname?.startsWith(path);
  };

  const getNavItems = (): NavItem[] => {
    const role = user?.role || 'user';

    // Admin navigation
    if (role === 'admin') {
      return [
        { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
        { label: 'Packages', href: '/admin/packages', icon: <Package className="w-5 h-5" /> },
        { label: 'Drivers', href: '/admin/drivers', icon: <Truck className="w-5 h-5" /> },
        { label: 'Users', href: '/admin/users', icon: <Users className="w-5 h-5" /> },
        { label: 'Analytics', href: '/admin/analytics', icon: <BarChart3 className="w-5 h-5" /> },
        { label: 'Settings', href: '/admin/settings', icon: <Settings className="w-5 h-5" /> },
      ];
    }

    // Driver navigation - ONLY DASHBOARD (everything is on the dashboard)
    if (role === 'driver') {
      return [
        { label: 'Dashboard', href: '/driver', icon: <LayoutDashboard className="w-5 h-5" /> },
        // ✅ No "My Deliveries" or "Packages" - everything is on the dashboard
      ];
    }

    // Storekeeper navigation
    if (role === 'storekeeper') {
      return [
        { label: 'Dashboard', href: '/storekeeper', icon: <LayoutDashboard className="w-5 h-5" /> },
        { label: 'Packages', href: '/storekeeper/packages', icon: <Package className="w-5 h-5" /> },
      ];
    }

    // User navigation (default)
    return [
      { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
      { label: 'Packages', href: '/packages', icon: <Package className="w-5 h-5" /> },
      { label: 'Send Package', href: '/create', icon: <Plus className="w-5 h-5" /> },
    ];
  };

  const getCommonItems = (): NavItem[] => {
    const items: NavItem[] = [
      { label: 'Profile', href: '/profile', icon: <User className="w-5 h-5" /> },
    ];
    
    if (user?.role !== 'admin') {
      items.unshift({ label: 'Notifications', href: '/notifications', icon: <Bell className="w-5 h-5" /> });
    }
    
    return items;
  };

  const navItems = getNavItems();
  const commonItems = getCommonItems();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (!mounted) {
    return (
      <div className="w-64 h-screen bg-white border-r border-gray-200 flex-shrink-0 hidden lg:block">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">Partum</span>
          </div>
        </div>
        <div className="p-4">
          <div className="animate-pulse space-y-2">
            <div className="h-10 bg-gray-200 rounded-lg"></div>
            <div className="h-10 bg-gray-200 rounded-lg"></div>
            <div className="h-10 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-200"
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <nav
        className={`
          fixed lg:sticky top-0 left-0 z-40
          w-64 h-screen bg-white border-r border-gray-200 flex-shrink-0
          transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          overflow-y-auto
        `}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-200">
          <Link 
            href={user?.role === 'admin' ? '/admin' : user?.role === 'driver' ? '/driver' : '/dashboard'} 
            className="flex items-center gap-2"
          >
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-bold text-xl text-gray-900">Partum</span>
              <p className="text-xs text-gray-500 capitalize">{user?.role || 'User'}</p>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <div className="p-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Menu</p>
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg transition
                  ${isActive(item.href)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <span className={isActive(item.href) ? 'text-blue-600' : 'text-gray-400'}>
                  {item.icon}
                </span>
                <span className="text-sm font-medium">{item.label}</span>
                {isActive(item.href) && (
                  <span className="ml-auto w-1.5 h-6 bg-blue-600 rounded-full"></span>
                )}
              </Link>
            ))}
          </div>

          {/* Common Items */}
          {commonItems.length > 0 && (
            <>
              <div className="border-t border-gray-200 my-3"></div>
              <div className="space-y-1">
                {commonItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg transition
                      ${isActive(item.href)
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    <span className={isActive(item.href) ? 'text-blue-600' : 'text-gray-400'}>
                      {item.icon}
                    </span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* Logout */}
          <div className="border-t border-gray-200 mt-3 pt-3">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <p className="text-xs text-gray-400 text-center">Partum v2.0</p>
        </div>
      </nav>
    </>
  );
}