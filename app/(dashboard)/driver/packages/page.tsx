// app/(dashboard)/driver/packages/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import {
  Package,
  Search,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MapPin,
  User,
  Phone,
  Calendar,
  RefreshCw,
  ChevronRight,
  Check,
  ClipboardList,
  Navigation,
  Home,
  Award,
  TrendingUp,
  BarChart3
} from 'lucide-react';

interface PackageType {
  id: string;
  tracking_number: string;
  status: string;
  sender_id: string;
  sender_name: string;
  sender_email: string;
  receiver_name: string;
  receiver_phone: string;
  delivery_address: string;
  destination_city: string;
  weight_kg: number;
  description?: string;
  created_at: string;
  driver_id?: string;
  driver_name?: string;
  driver_email?: string;
}

export default function DriverPackagesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'driver') {
      router.push('/dashboard');
      return;
    }
  }, [user, router]);

  const fetchDriverPackages = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('packages')
        .select('*')
        .eq('driver_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.log('No packages assigned yet');
        setPackages([]);
        setLoading(false);
        return;
      }

      setPackages(data || []);

    } catch (err) {
      console.error('Error fetching driver packages:', err);
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverPackages();
  }, [user]);

  const updatePackageStatus = async (packageId: string, newStatus: string) => {
    if (!user) return;

    try {
      setUpdating(true);

      const { error: updateError } = await supabase
        .from('packages')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', packageId)
        .eq('driver_id', user.id);

      if (updateError) {
        alert('Failed to update package status');
        return;
      }

      setPackages(prev =>
        prev.map(pkg =>
          pkg.id === packageId
            ? { ...pkg, status: newStatus }
            : pkg
        )
      );

      alert(`✅ Package status updated successfully!`);

    } catch (err) {
      console.error('Error updating package:', err);
      alert('Failed to update package');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusInfo = (status: string) => {
    const map: Record<string, { color: string; icon: React.ReactElement; bg: string; label: string }> = {
      received_at_pickup: {
        color: 'text-blue-600',
        icon: <Clock className="w-4 h-4" />,
        bg: 'bg-blue-50',
        label: 'Ready for Pickup'
      },
      in_transit: {
        color: 'text-indigo-600',
        icon: <Truck className="w-4 h-4" />,
        bg: 'bg-indigo-50',
        label: 'In Transit'
      },
      delivered: {
        color: 'text-green-600',
        icon: <CheckCircle className="w-4 h-4" />,
        bg: 'bg-green-50',
        label: 'Delivered ✅'
      },
      cancelled: {
        color: 'text-red-600',
        icon: <XCircle className="w-4 h-4" />,
        bg: 'bg-red-50',
        label: 'Cancelled ❌'
      }
    };
    return map[status] || map.received_at_pickup;
  };

  const formatDate = (date: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTimeAgo = (date: string) => {
    if (!date) return 'N/A';
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const filteredPackages = packages.filter(pkg => {
    const matchesSearch = 
      (pkg.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pkg.receiver_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pkg.tracking_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pkg.destination_city || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || pkg.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Driver performance stats
  const totalDelivered = packages.filter(p => p.status === 'delivered').length;
  const totalInTransit = packages.filter(p => p.status === 'in_transit').length;
  const totalReady = packages.filter(p => p.status === 'received_at_pickup').length;
  const completionRate = packages.length > 0 ? Math.round((totalDelivered / packages.length) * 100) : 0;

  if (!user || user.role !== 'driver') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Truck className="w-8 h-8 text-blue-600" />
                My Deliveries
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                {packages.length === 0 
                  ? "You don't have any assigned deliveries yet" 
                  : `You have ${packages.length} package${packages.length > 1 ? 's' : ''} to deliver`
                }
              </p>
            </div>
            <button
              onClick={fetchDriverPackages}
              disabled={loading}
              className="mt-3 md:mt-0 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Driver Stats Cards - More driver-focused */}
        {packages.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <ClipboardList className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Total</p>
                  <p className="text-xl font-bold text-gray-900">{packages.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-100 p-2 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Ready</p>
                  <p className="text-xl font-bold text-yellow-600">{totalReady}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 p-2 rounded-lg">
                  <Truck className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">In Transit</p>
                  <p className="text-xl font-bold text-indigo-600">{totalInTransit}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Award className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Delivered</p>
                  <p className="text-xl font-bold text-green-600">{totalDelivered}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Completion Rate Progress */}
        {packages.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Delivery Progress</span>
              </div>
              <span className="text-sm font-bold text-blue-600">{completionRate}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {completionRate === 100 ? '🎉 All packages delivered!' : `${totalDelivered} of ${packages.length} packages delivered`}
            </p>
          </div>
        )}

        {/* Search & Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by receiver, tracking number, or city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white min-w-[140px]"
              >
                <option value="all">All Status</option>
                <option value="received_at_pickup">Ready for Pickup</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-500 text-sm">Loading your deliveries...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchDriverPackages}
              className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              Try again
            </button>
          </div>
        ) : filteredPackages.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">No deliveries assigned</h3>
            <p className="text-gray-500 text-sm">
              You don't have any packages assigned to you yet.
            </p>
            <p className="text-gray-400 text-xs mt-2">
              Packages will appear here once the storekeeper assigns them to you.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredPackages.map((pkg) => {
              const statusInfo = getStatusInfo(pkg.status);
              const canPickup = pkg.status === 'received_at_pickup';
              const canDeliver = pkg.status === 'in_transit';
              
              return (
                <div
                  key={pkg.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition p-5"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">📦</div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">
                          {pkg.description || 'Package'}
                        </h3>
                        <p className="text-xs text-gray-500">{pkg.tracking_number}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <User className="w-3 h-3 text-gray-400 mt-0.5" />
                      <span className="text-gray-700 font-medium">{pkg.receiver_name}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Phone className="w-3 h-3 text-gray-400 mt-0.5" />
                      <span className="text-gray-600">{pkg.receiver_phone}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3 h-3 text-gray-400 mt-0.5" />
                      <span className="text-gray-600 truncate">{pkg.delivery_address}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="w-3 h-3 text-gray-400 mt-0.5" />
                      <span className="text-gray-400">{getTimeAgo(pkg.created_at)}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400">{pkg.weight_kg} kg</span>
                    <div className="flex gap-2">
                      {canPickup && (
                        <button
                          onClick={() => updatePackageStatus(pkg.id, 'in_transit')}
                          disabled={updating}
                          className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                        >
                          <Check className="w-3 h-3" />
                          Confirm Pickup
                        </button>
                      )}
                      {canDeliver && (
                        <button
                          onClick={() => updatePackageStatus(pkg.id, 'delivered')}
                          disabled={updating}
                          className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Mark Delivered
                        </button>
                      )}
                      <a
                        href={`/track/${pkg.id}`}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                      >
                        Details <ChevronRight className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}