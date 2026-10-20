// app/(dashboard)/driver/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import {
  Package,
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
  Search,
  Check,
  ClipboardList
} from 'lucide-react';
import { usePackageUpdates, useRealtimeStatus } from '@/lib/realtime';

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

export default function DriverDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPackage, setSelectedPackage] = useState<PackageType | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Realtime connection status
  const isConnected = useRealtimeStatus();

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

  // ========== REAL-TIME UPDATES ==========
  const handlePackageUpdate = (payload: any) => {
    console.log('📦 Package update received:', payload);
    
    // Check if the update is for this driver
    if (payload.new?.driver_id === user?.id || payload.old?.driver_id === user?.id) {
      fetchDriverPackages();
      setLastUpdated(new Date());
      
      // Show notification for new assignments
      if (payload.eventType === 'INSERT') {
        console.log('📦 New package assigned to you!');
        alert('📦 New package assigned to you!');
      } else if (payload.eventType === 'UPDATE' && payload.new?.status !== payload.old?.status) {
        console.log(`📦 Package status changed from ${payload.old?.status} to ${payload.new?.status}`);
      }
    }
  };

  // Subscribe to real-time updates
  usePackageUpdates(handlePackageUpdate);

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
    const map: Record<string, { color: string; icon: React.ReactElement; bg: string; label: string; actions: string[] }> = {
      received_at_pickup: {
        color: 'text-blue-600',
        icon: <Clock className="w-4 h-4" />,
        bg: 'bg-blue-50',
        label: 'Ready for Pickup',
        actions: ['pickup']
      },
      in_transit: {
        color: 'text-indigo-600',
        icon: <Truck className="w-4 h-4" />,
        bg: 'bg-indigo-50',
        label: 'In Transit',
        actions: ['deliver']
      },
      delivered: {
        color: 'text-green-600',
        icon: <CheckCircle className="w-4 h-4" />,
        bg: 'bg-green-50',
        label: 'Delivered ✅',
        actions: []
      },
      cancelled: {
        color: 'text-red-600',
        icon: <XCircle className="w-4 h-4" />,
        bg: 'bg-red-50',
        label: 'Cancelled ❌',
        actions: []
      }
    };
    return map[status] || map.received_at_pickup;
  };

  const getStatusActions = (status: string) => {
    const actions: Record<string, { label: string; nextStatus: string; icon: React.ReactElement }> = {
      pickup: {
        label: 'Confirm Pickup',
        nextStatus: 'in_transit',
        icon: <Truck className="w-4 h-4" />
      },
      deliver: {
        label: 'Mark Delivered',
        nextStatus: 'delivered',
        icon: <Check className="w-4 h-4" />
      }
    };
    return actions[status] || null;
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

  const refreshData = async () => {
    await fetchDriverPackages();
    setLastUpdated(new Date());
  };

  if (!user || user.role !== 'driver') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🚚 Driver Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
              Manage your assigned deliveries
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
          <button
            onClick={refreshData}
            disabled={loading}
            className="mt-3 md:mt-0 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs text-gray-500 font-medium">Total Assigned</p>
            <p className="text-2xl font-bold text-gray-900">{packages.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs text-gray-500 font-medium">Ready for Pickup</p>
            <p className="text-2xl font-bold text-blue-600">
              {packages.filter(p => p.status === 'received_at_pickup').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs text-gray-500 font-medium">In Transit</p>
            <p className="text-2xl font-bold text-indigo-600">
              {packages.filter(p => p.status === 'in_transit').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs text-gray-500 font-medium">Delivered</p>
            <p className="text-2xl font-bold text-green-600">
              {packages.filter(p => p.status === 'delivered').length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search assigned packages..."
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
              onClick={refreshData}
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
              const action = getStatusActions(statusInfo.actions[0] || '');
              
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
                      <span className="text-gray-700">{pkg.receiver_name}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Phone className="w-3 h-3 text-gray-400 mt-0.5" />
                      <span className="text-gray-700">{pkg.receiver_phone}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3 h-3 text-gray-400 mt-0.5" />
                      <span className="text-gray-700">{pkg.delivery_address}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="w-3 h-3 text-gray-400 mt-0.5" />
                      <span className="text-gray-700">{getTimeAgo(pkg.created_at)}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400">{pkg.weight_kg} kg</span>
                    <div className="flex gap-2">
                      {action && pkg.status !== 'delivered' && pkg.status !== 'cancelled' && (
                        <button
                          onClick={() => updatePackageStatus(pkg.id, action.nextStatus)}
                          disabled={updating}
                          className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                        >
                          {action.icon}
                          {action.label}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedPackage(pkg);
                          setShowModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                      >
                        Details <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Package Details Modal */}
      {showModal && selectedPackage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-start">
              <div>
                <h2 className="font-semibold text-gray-900">{selectedPackage.description || 'Package'}</h2>
                <p className="text-xs text-gray-500">{selectedPackage.tracking_number}</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition"
              >
                <XCircle className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📦</span>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusInfo(selectedPackage.status).bg} ${getStatusInfo(selectedPackage.status).color}`}>
                  {getStatusInfo(selectedPackage.status).label}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Receiver</p>
                  <p className="font-medium">{selectedPackage.receiver_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Phone</p>
                  <p>{selectedPackage.receiver_phone}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 uppercase">Delivery Address</p>
                  <p>{selectedPackage.delivery_address}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">City</p>
                  <p>{selectedPackage.destination_city}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Weight</p>
                  <p>{selectedPackage.weight_kg} kg</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Assigned</p>
                  <p>{formatDate(selectedPackage.created_at)}</p>
                </div>
              </div>

              <a
                href={`/track/${selectedPackage.id}`}
                className="block w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm text-center"
              >
                Track Package
              </a>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}