// app/(dashboard)/admin/page.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { 
  Package, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Truck,
  UserCheck,
  Shield,
  Eye,
  RefreshCw  // ← ADD THIS
} from 'lucide-react';
import { usePackageUpdates, useUserUpdates, useDriverUpdates, useRealtimeStatus } from '@/lib/realtime';

export default function AdminPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalDrivers, setTotalDrivers] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    inTransit: 0,
    delivered: 0,
    pending: 0,
  });
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Realtime connection status
  const isConnected = useRealtimeStatus();

  useEffect(() => {
    if (user && user.role !== 'admin') {
      window.location.href = '/dashboard';
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Loading admin data...');

      // Get packages directly from Supabase
      const { data: packagesData, error: packagesError } = await supabase
        .from('packages')
        .select('*')
        .order('created_at', { ascending: false });

      if (packagesError) {
        console.error('Error fetching packages:', packagesError);
        setError('Failed to load packages: ' + packagesError.message);
        setLoading(false);
        return;
      }

      console.log('Packages loaded:', packagesData?.length || 0);
      setPackages(packagesData || []);
      setStats({
        total: packagesData?.length || 0,
        inTransit: packagesData?.filter(p => p.status === 'in_transit' || p.status === 'out_for_delivery').length || 0,
        delivered: packagesData?.filter(p => p.status === 'delivered').length || 0,
        pending: packagesData?.filter(p => p.status === 'pending_verification' || p.status === 'pending_dropoff').length || 0,
      });

      // Get users count directly from Supabase
      const { count: usersCount, error: usersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (usersError) {
        console.error('Error fetching users count:', usersError);
      } else {
        console.log('Users count:', usersCount);
        setTotalUsers(usersCount || 0);
      }

      // Get drivers count directly from Supabase
      const { count: driversCount, error: driversError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'driver');

      if (driversError) {
        console.error('Error fetching drivers count:', driversError);
      } else {
        console.log('Drivers count:', driversCount);
        setTotalDrivers(driversCount || 0);
      }

      setLastUpdated(new Date());

    } catch (error) {
      console.error('Error loading admin data:', error);
      setError('An unexpected error occurred. Please try again.');
    }

    setLoading(false);
  };

  // ========== REAL-TIME UPDATES ==========
  const handlePackageUpdate = (payload: any) => {
    console.log('📦 Admin package update received:', payload);
    loadData();
  };

  const handleUserUpdate = (payload: any) => {
    console.log('👤 Admin user update received:', payload);
    loadData();
  };

  const handleDriverUpdate = (payload: any) => {
    console.log('🚗 Admin driver update received:', payload);
    loadData();
  };

  // Subscribe to real-time updates
  usePackageUpdates(handlePackageUpdate);
  useUserUpdates(handleUserUpdate);
  useDriverUpdates(handleDriverUpdate);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      delivered: 'bg-green-100 text-green-700',
      in_transit: 'bg-blue-100 text-blue-700',
      pending_dropoff: 'bg-yellow-100 text-yellow-700',
      pending_verification: 'bg-gray-100 text-gray-700',
      received_at_pickup: 'bg-purple-100 text-purple-700',
      out_for_delivery: 'bg-orange-100 text-orange-700',
      at_destination_hub: 'bg-indigo-100 text-indigo-700',
    };
    const labels: Record<string, string> = {
      delivered: 'Delivered',
      in_transit: 'In Transit',
      pending_dropoff: 'Pending Drop-off',
      pending_verification: 'Pending Verification',
      received_at_pickup: 'Received at Pickup',
      out_for_delivery: 'Out for Delivery',
      at_destination_hub: 'At Hub',
    };
    return { className: styles[status] || 'bg-gray-100 text-gray-700', label: labels[status] || status };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const recentPackages = packages.slice(0, 5);

  const refreshData = async () => {
    await loadData();
    setLastUpdated(new Date());
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={refreshData} 
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm flex items-center gap-2">
            Oversee packages, drivers, and platform activity
            <span className={`text-xs flex items-center gap-1 px-2 py-0.5 rounded-full ${
              isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}></span>
              {isConnected ? 'Live' : 'Connecting...'}
            </span>
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Admin Access
          </div>
          <button
            onClick={refreshData}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Packages</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">In Transit</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.inTransit}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Delivered</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.delivered}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Users</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{totalUsers}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Drivers</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{totalDrivers}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href="/packages" className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-5 text-white hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">All Packages</h3>
              <p className="text-blue-100 text-sm">View and manage all shipments</p>
            </div>
            <Package className="w-8 h-8 opacity-80" />
          </div>
        </Link>
        <Link href="/admin/drivers" className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl p-5 text-white hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Manage Drivers</h3>
              <p className="text-indigo-100 text-sm">Track driver performance</p>
            </div>
            <Truck className="w-8 h-8 opacity-80" />
          </div>
        </Link>
        <Link href="/admin/users" className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-5 text-white hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Manage Users</h3>
              <p className="text-purple-100 text-sm">View platform users</p>
            </div>
            <Users className="w-8 h-8 opacity-80" />
          </div>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Package className="w-5 h-5 text-gray-500" />
            Recent Activity
          </h2>
          <Link href="/packages" className="text-sm font-medium text-blue-600 hover:text-blue-700">
            View All →
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {recentPackages.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No packages in the system yet</p>
            </div>
          ) : (
            recentPackages.map((pkg) => {
              const badge = getStatusBadge(pkg.status);
              return (
                <div key={pkg.id} className="flex items-center justify-between p-4 px-5 hover:bg-gray-50 transition">
                  <div>
                    <p className="font-mono font-medium text-blue-600">{pkg.tracking_number}</p>
                    <p className="text-sm text-gray-500">To: {pkg.receiver_name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${badge.className}`}>
                      {badge.label}
                    </span>
                    <span className="text-xs text-gray-500">{formatDate(pkg.created_at)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}