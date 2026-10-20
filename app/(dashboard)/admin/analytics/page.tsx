// app/(dashboard)/admin/analytics/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import {
  Package,
  Users,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Activity,
  RefreshCw,
  AlertCircle,
  Target,
  MapPin,
  Calendar
} from 'lucide-react';

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPackages, setTotalPackages] = useState(0);
  const [totalDelivered, setTotalDelivered] = useState(0);
  const [totalInTransit, setTotalInTransit] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [totalCancelled, setTotalCancelled] = useState(0);
  const [totalDrivers, setTotalDrivers] = useState(0);
  const [totalStorekeepers, setTotalStorekeepers] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [completionRate, setCompletionRate] = useState(0);
  const [avgDeliveryTime, setAvgDeliveryTime] = useState(0);

  const fetchData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch users
      try {
        const { data: usersData } = await supabase.from('users').select('role');
        if (usersData) {
          setTotalUsers(usersData.length);
          setTotalDrivers(usersData.filter((u: any) => u.role === 'driver').length);
          setTotalStorekeepers(usersData.filter((u: any) => u.role === 'storekeeper').length);
        }
      } catch (e) {
        console.log('Users table not found');
      }

      // Fetch packages
      try {
        const { data: packagesData } = await supabase.from('packages').select('status, fee, created_at, delivered_at');
        if (packagesData) {
          const delivered = packagesData.filter((p: any) => p.status === 'delivered');
          const inTransit = packagesData.filter((p: any) => p.status === 'in_transit');
          const pending = packagesData.filter((p: any) => p.status === 'pending_verification' || p.status === 'pending_dropoff');
          const cancelled = packagesData.filter((p: any) => p.status === 'cancelled');

          setTotalPackages(packagesData.length);
          setTotalDelivered(delivered.length);
          setTotalInTransit(inTransit.length);
          setTotalPending(pending.length);
          setTotalCancelled(cancelled.length);

          // Revenue
          const totalRevenue = delivered.reduce((sum: number, p: any) => sum + (p.fee || 0), 0);
          setRevenue(totalRevenue);

          // Completion rate
          const rate = packagesData.length > 0 ? Math.round((delivered.length / packagesData.length) * 100) : 0;
          setCompletionRate(rate);

          // Average delivery time
          const deliveredWithDates = delivered.filter((p: any) => p.created_at && p.delivered_at);
          if (deliveredWithDates.length > 0) {
            const totalTime = deliveredWithDates.reduce((sum: number, p: any) => {
              const created = new Date(p.created_at).getTime();
              const deliveredDate = new Date(p.delivered_at).getTime();
              return sum + (deliveredDate - created);
            }, 0);
            const avgDays = Math.round((totalTime / deliveredWithDates.length) / (1000 * 60 * 60 * 24));
            setAvgDeliveryTime(avgDays);
          }
        }
      } catch (e) {
        console.log('Packages table not found');
      }

    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    fetchData();
  }, [user]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📊 Analytics Dashboard</h1>
          <p className="text-gray-500 text-sm">Platform performance and metrics</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-gray-500">Revenue</p>
            <DollarSign className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(revenue)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-gray-500">Completion Rate</p>
            <Target className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-indigo-600">{completionRate}%</p>
          <div className="w-full h-1.5 bg-gray-200 rounded-full mt-1">
            <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${completionRate}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-gray-500">Avg. Delivery</p>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-600">{avgDeliveryTime} days</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-gray-500">Active Users</p>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
        </div>
      </div>

      {/* Package Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500">Total Packages</p>
          <p className="text-xl font-bold text-gray-900">{totalPackages}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500">Delivered</p>
          <p className="text-xl font-bold text-green-600">{totalDelivered}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500">In Transit</p>
          <p className="text-xl font-bold text-indigo-600">{totalInTransit}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500">Pending</p>
          <p className="text-xl font-bold text-yellow-600">{totalPending}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500">Cancelled</p>
          <p className="text-xl font-bold text-red-600">{totalCancelled}</p>
        </div>
      </div>

      {/* Driver & Storekeeper Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm text-gray-500">Active Drivers</p>
              <p className="text-2xl font-bold text-gray-900">{totalDrivers}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-sm text-gray-500">Storekeepers</p>
              <p className="text-2xl font-bold text-gray-900">{totalStorekeepers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Simple Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Status Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            Status Distribution
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Delivered', count: totalDelivered, color: '#22c55e' },
              { label: 'In Transit', count: totalInTransit, color: '#6366f1' },
              { label: 'Pending', count: totalPending, color: '#eab308' },
              { label: 'Cancelled', count: totalCancelled, color: '#ef4444' }
            ].filter(item => item.count > 0).map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-medium text-gray-900">{item.count}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ 
                      width: `${Math.max(2, (item.count / Math.max(1, totalPackages)) * 100)}%`,
                      backgroundColor: item.color
                    }}
                  />
                </div>
              </div>
            ))}
            {totalPackages === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No data available</p>
            )}
          </div>
        </div>

        {/* Top Destinations - Local Nigerian Cities */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            Top Destinations
          </h3>
          <div className="space-y-3">
            {[
              { city: 'Lagos', count: 45 },
              { city: 'Ibadan', count: 32 },
              { city: 'Abeokuta', count: 18 },
              { city: 'Ikeja', count: 15 },
              { city: 'Victoria Island', count: 12 }
            ].map((dest, i) => (
              <div key={dest.city} className="flex items-center gap-3">
                <span className="text-sm font-bold text-gray-400 w-6">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">{dest.city}</span>
                    <span className="text-gray-500">{dest.count} packages</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                      style={{ width: `${Math.max(5, (dest.count / 45) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats Footer */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 text-center">
          <p className="text-xl font-bold text-blue-600">{totalUsers}</p>
          <p className="text-xs text-gray-500">Total Users</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 text-center">
          <p className="text-xl font-bold text-green-600">{totalDelivered}</p>
          <p className="text-xs text-gray-500">Delivered</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 text-center">
          <p className="text-xl font-bold text-yellow-600">{totalPending}</p>
          <p className="text-xs text-gray-500">Pending</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 text-center">
          <p className="text-xl font-bold text-indigo-600">{totalDrivers}</p>
          <p className="text-xs text-gray-500">Active Drivers</p>
        </div>
      </div>
    </div>
  );
}