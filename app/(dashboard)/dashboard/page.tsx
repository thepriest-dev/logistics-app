// app/(dashboard)/dashboard/page.tsx

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Search,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  LayoutGrid,
  List,
  RefreshCw,
  User,
  Calendar
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { usePackageUpdates, useRealtimeStatus } from '@/lib/realtime';

interface Package {
  id: string;
  tracking_number: string;
  status: string;
  sender_id: string;
  sender_name: string;
  sender_phone: string;
  sender_email: string;
  receiver_name: string;
  receiver_phone: string;
  receiver_phone_alt?: string;
  receiver_email?: string;
  pickup_point_name: string;
  pickup_address: string;
  delivery_address: string;
  destination_city: string;
  weight_kg: number;
  description?: string;
  driver_id?: string;
  driver_name?: string;
  driver_email?: string;
  created_at: string;
  estimated_delivery?: string;
  delivered_at?: string;
  fee?: number;
  payment_status?: string;
  verification_status?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [packages, setPackages] = useState<Package[]>([]);
  const [filteredPackages, setFilteredPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Realtime connection status
  const isConnected = useRealtimeStatus();

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Get current date
  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusInfo = (status: string) => {
    const map: Record<string, { color: string; icon: React.ReactElement; bg: string; label: string; progress: number }> = {
      pending_verification: {
        color: 'text-yellow-600',
        icon: <Clock className="w-4 h-4" />,
        bg: 'bg-yellow-50 border-yellow-200',
        label: 'Pending Verification',
        progress: 10
      },
      pending_dropoff: {
        color: 'text-purple-600',
        icon: <Clock className="w-4 h-4" />,
        bg: 'bg-purple-50 border-purple-200',
        label: 'Ready for Pickup',
        progress: 25
      },
      received_at_pickup: {
        color: 'text-blue-600',
        icon: <Truck className="w-4 h-4" />,
        bg: 'bg-blue-50 border-blue-200',
        label: 'Assigned to Driver',
        progress: 50
      },
      in_transit: {
        color: 'text-indigo-600',
        icon: <Truck className="w-4 h-4" />,
        bg: 'bg-indigo-50 border-indigo-200',
        label: 'In Transit',
        progress: 75
      },
      delivered: {
        color: 'text-green-600',
        icon: <CheckCircle className="w-4 h-4" />,
        bg: 'bg-green-50 border-green-200',
        label: 'Delivered',
        progress: 100
      },
      cancelled: {
        color: 'text-red-600',
        icon: <XCircle className="w-4 h-4" />,
        bg: 'bg-red-50 border-red-200',
        label: 'Cancelled',
        progress: 0
      },
      returned: {
        color: 'text-gray-600',
        icon: <Package className="w-4 h-4" />,
        bg: 'bg-gray-50 border-gray-200',
        label: 'Returned',
        progress: 0
      }
    };
    return map[status] || map.pending_verification;
  };

  const getPackageEmoji = (description: string = ''): string => {
    const lower = description?.toLowerCase() || '';
    if (lower.includes('laptop') || lower.includes('macbook') || lower.includes('computer')) return '💻';
    if (lower.includes('iphone') || lower.includes('phone') || lower.includes('smartphone')) return '📱';
    if (lower.includes('headphone') || lower.includes('airpods') || lower.includes('earphone')) return '🎧';
    if (lower.includes('tv') || lower.includes('television') || lower.includes('monitor')) return '📺';
    if (lower.includes('shoe') || lower.includes('nike') || lower.includes('jordan')) return '👟';
    if (lower.includes('watch') || lower.includes('apple watch')) return '⌚';
    if (lower.includes('camera') || lower.includes('gopro')) return '📷';
    if (lower.includes('speaker') || lower.includes('sound')) return '🔊';
    if (lower.includes('book') || lower.includes('textbook')) return '📚';
    if (lower.includes('clothes') || lower.includes('shirt') || lower.includes('dress')) return '👕';
    if (lower.includes('food') || lower.includes('snack')) return '🍕';
    if (lower.includes('toy') || lower.includes('game')) return '🎮';
    return '📦';
  };

  const getStatusStep = (status: string): number => {
    const steps = ['pending_verification', 'pending_dropoff', 'received_at_pickup', 'in_transit', 'delivered'];
    const index = steps.indexOf(status);
    if (index === -1) return 0;
    return (index / (steps.length - 1)) * 100;
  };

  // ========== FETCH PACKAGES ==========
  const fetchPackages = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: packagesData, error: packagesError } = await supabase
        .from('packages')
        .select('*')
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false });

      if (packagesError) {
        console.log('No packages table yet, showing empty state');
        setPackages([]);
        setFilteredPackages([]);
        setLoading(false);
        return;
      }

      setPackages(packagesData || []);
      setFilteredPackages(packagesData || []);

    } catch (err) {
      console.error('Error fetching packages:', err);
      setPackages([]);
      setFilteredPackages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchPackages();
  }, [user]);

  // ========== REAL-TIME UPDATES ==========
  const handlePackageUpdate = (payload: any) => {
    console.log('📦 Package update received:', payload);
    
    // Check if the update is for this user's packages
    if (payload.new?.sender_id === user?.id || payload.old?.sender_id === user?.id) {
      fetchPackages();
      setLastUpdated(new Date());
      
      // Show notification for status changes
      if (payload.eventType === 'UPDATE' && payload.new?.status !== payload.old?.status) {
        console.log(`📦 Package status changed from ${payload.old?.status} to ${payload.new?.status}`);
      }
    }
  };

  // Subscribe to real-time updates
  usePackageUpdates(handlePackageUpdate);

  // ========== FILTERS ==========
  useEffect(() => {
    let result = packages;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(pkg =>
        (pkg.description || '').toLowerCase().includes(term) ||
        (pkg.receiver_name || '').toLowerCase().includes(term) ||
        (pkg.tracking_number || '').toLowerCase().includes(term) ||
        pkg.id.toLowerCase().includes(term)
      );
    }
    
    if (statusFilter !== 'all') {
      result = result.filter(pkg => pkg.status === statusFilter);
    }
    
    setFilteredPackages(result);
  }, [searchTerm, statusFilter, packages]);

  const stats = useMemo(() => {
    const total = packages.length;
    const delivered = packages.filter(p => p.status === 'delivered').length;
    const inTransit = packages.filter(p => p.status === 'in_transit').length;
    const pending = packages.filter(p => p.status === 'pending_verification' || p.status === 'pending_dropoff').length;
    const assigned = packages.filter(p => p.status === 'received_at_pickup').length;
    const cancelled = packages.filter(p => p.status === 'cancelled').length;
    const returned = packages.filter(p => p.status === 'returned').length;
    
    return { total, delivered, inTransit, pending, assigned, cancelled, returned };
  }, [packages]);

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

  const refreshData = async () => {
    await fetchPackages();
    setLastUpdated(new Date());
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* ========== WELCOME GREETING SECTION ========== */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-lg p-6 mb-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl hidden sm:block">
                <User className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-bold">
                    {getGreeting()}, {user?.name || 'User'}! 👋
                  </h1>
                  <span className="bg-white/20 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                    {user?.role || 'User'}
                  </span>
                  <span className={`text-xs flex items-center gap-1 px-2 py-1 rounded-full ${
                    isConnected ? 'bg-green-500/30 text-green-200' : 'bg-red-500/30 text-red-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                    }`}></span>
                    {isConnected ? 'Live' : 'Connecting...'}
                  </span>
                </div>
                <p className="text-blue-100 text-sm mt-1 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {getCurrentDate()}
                </p>
                <p className="text-blue-100 text-sm mt-0.5">
                  {packages.length === 0 
                    ? "You don't have any packages yet. Send one today! 📦" 
                    : `You have ${packages.length} package${packages.length > 1 ? 's' : ''} in total`}
                  <span className="text-blue-200 text-xs ml-2">
                    • Updated {getTimeAgo(lastUpdated.toISOString())}
                  </span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 mt-3 md:mt-0">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
                <p className="text-xs text-blue-100">In Transit</p>
                <p className="text-lg font-bold">{stats.inTransit}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
                <p className="text-xs text-blue-100">Pending</p>
                <p className="text-lg font-bold">{stats.pending}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
                <p className="text-xs text-blue-100">Delivered</p>
                <p className="text-lg font-bold">{stats.delivered}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by description, receiver, or tracking number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white min-w-[150px]"
              >
                <option value="all">All Status</option>
                <option value="pending_verification">Pending Verification</option>
                <option value="pending_dropoff">Ready for Pickup</option>
                <option value="received_at_pickup">Assigned to Driver</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="returned">Returned</option>
              </select>

              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {filteredPackages.length > 0 && (
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">
              {filteredPackages.length} package{filteredPackages.length !== 1 ? 's' : ''} found
            </p>
            <button
              onClick={refreshData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-500 text-sm">Loading your packages...</p>
          </div>
        ) : filteredPackages.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">No packages found</h3>
            <p className="text-gray-500 text-sm">You haven't sent any packages yet</p>
            <a
              href="/create"
              className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Send a Package
            </a>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredPackages.map((pkg) => {
              const statusInfo = getStatusInfo(pkg.status);
              const progress = getStatusStep(pkg.status);
              const showProgress = pkg.status !== 'cancelled' && pkg.status !== 'returned' && pkg.status !== 'delivered';
              return (
                <div
                  key={pkg.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer group"
                  onClick={() => {
                    setSelectedPackage(pkg);
                    setShowModal(true);
                  }}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{getPackageEmoji(pkg.description || '')}</div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">
                            {pkg.description || 'Package'}
                          </h3>
                          <p className="text-xs text-gray-500">{pkg.tracking_number}</p>
                        </div>
                      </div>
                      <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color} border`}>
                        {statusInfo.label}
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Receiver</span>
                        <span className="font-medium text-gray-700 truncate max-w-[120px]">{pkg.receiver_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Weight</span>
                        <span className="font-medium text-gray-700">{pkg.weight_kg} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Created</span>
                        <span className="font-medium text-gray-700">{getTimeAgo(pkg.created_at)}</span>
                      </div>
                    </div>

                    {showProgress && (
                      <div className="mt-3">
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              pkg.status === 'in_transit' ? 'bg-indigo-500' :
                              pkg.status === 'received_at_pickup' ? 'bg-blue-500' :
                              pkg.status === 'pending_dropoff' ? 'bg-purple-500' :
                              'bg-yellow-500'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-gray-400">{statusInfo.label}</span>
                          <span className="text-xs font-medium text-gray-600">{Math.round(progress)}%</span>
                        </div>
                      </div>
                    )}

                    <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
                      <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                        Track Package
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {filteredPackages.map((pkg) => {
                const statusInfo = getStatusInfo(pkg.status);
                return (
                  <div
                    key={pkg.id}
                    className="p-4 hover:bg-gray-50 transition cursor-pointer flex items-center justify-between"
                    onClick={() => {
                      setSelectedPackage(pkg);
                      setShowModal(true);
                    }}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="text-2xl">{getPackageEmoji(pkg.description || '')}</div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">
                          {pkg.description || 'Package'}
                        </h3>
                        <p className="text-xs text-gray-500 truncate">{pkg.tracking_number}</p>
                      </div>
                    </div>
                    <div className="hidden md:flex items-center gap-4 flex-1">
                      <span className="text-sm text-gray-600 truncate max-w-[100px]">{pkg.receiver_name}</span>
                      <span className="text-sm text-gray-600">{pkg.weight_kg} kg</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color} border`}>
                        {statusInfo.label}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showModal && selectedPackage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{getPackageEmoji(selectedPackage.description || '')}</div>
                <div>
                  <h2 className="font-semibold text-gray-900">{selectedPackage.description || 'Package'}</h2>
                  <p className="text-xs text-gray-500">{selectedPackage.tracking_number}</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition"
              >
                <XCircle className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className={`p-3 rounded-lg ${getStatusInfo(selectedPackage.status).bg} border ${getStatusInfo(selectedPackage.status).color}`}>
                <div className="flex items-center gap-2">
                  {getStatusInfo(selectedPackage.status).icon}
                  <span className="font-medium">{getStatusInfo(selectedPackage.status).label}</span>
                  <span className="ml-auto text-sm">{getTimeAgo(selectedPackage.created_at)}</span>
                </div>
              </div>

              {selectedPackage.status !== 'cancelled' && selectedPackage.status !== 'returned' && selectedPackage.status !== 'delivered' && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Delivery Progress</span>
                    <span className="font-medium">{Math.round(getStatusStep(selectedPackage.status))}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        selectedPackage.status === 'in_transit' ? 'bg-indigo-500' :
                        selectedPackage.status === 'received_at_pickup' ? 'bg-blue-500' :
                        selectedPackage.status === 'pending_dropoff' ? 'bg-purple-500' :
                        'bg-yellow-500'
                      }`}
                      style={{ width: `${getStatusStep(selectedPackage.status)}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">Package Details</h3>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Receiver</p>
                    <p className="text-gray-700 font-medium">{selectedPackage.receiver_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Weight</p>
                    <p className="text-gray-700">{selectedPackage.weight_kg} kg</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 uppercase">Delivery Address</p>
                    <p className="text-gray-700 text-sm">{selectedPackage.delivery_address}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 uppercase">City</p>
                    <p className="text-gray-700">{selectedPackage.destination_city}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Receiver Phone</p>
                    <p className="text-gray-700">{selectedPackage.receiver_phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Created</p>
                    <p className="text-gray-700">{formatDate(selectedPackage.created_at)}</p>
                  </div>
                  {selectedPackage.estimated_delivery && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Est. Delivery</p>
                      <p className="text-gray-700">{formatDate(selectedPackage.estimated_delivery)}</p>
                    </div>
                  )}
                  {selectedPackage.delivered_at && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Delivered</p>
                      <p className="text-green-600 font-medium">{formatDate(selectedPackage.delivered_at)}</p>
                    </div>
                  )}
                  {selectedPackage.fee && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Fee</p>
                      <p className="text-gray-700">${selectedPackage.fee.toFixed(2)}</p>
                    </div>
                  )}
                  {selectedPackage.payment_status && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Payment</p>
                      <p className={`font-medium ${selectedPackage.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                        {selectedPackage.payment_status}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {selectedPackage.tracking_number && (
                <a
                  href={`/track/${selectedPackage.id}`}
                  className="block w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm text-center"
                >
                  Track Package
                </a>
              )}
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