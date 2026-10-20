// app/(dashboard)/storekeeper/packages/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { 
  Package, 
  Search,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  PackageCheck,
  FileCheck,
  Truck,
  Filter,
  ChevronDown,
  User,
  Phone,
  Calendar,
  MapPin
} from 'lucide-react';
import { usePackageUpdates, useRealtimeStatus } from '@/lib/realtime';

interface PackageItem {
  id: string;
  tracking_number: string;
  status: string;
  sender_id: string;
  sender_name: string;
  sender_phone: string;
  sender_email: string;
  receiver_name: string;
  receiver_phone: string;
  delivery_address: string;
  destination_city: string;
  weight_kg: number;
  description: string;
  driver_id?: string;
  driver_name?: string;
  created_at: string;
  verification_status?: string;
  verified_by?: string;
  verified_at?: string;
  delivered_at?: string;
}

export default function StorekeeperPackagesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPackage, setSelectedPackage] = useState<PackageItem | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'all' | 'outgoing' | 'incoming'>('all');

  const isConnected = useRealtimeStatus();

  useEffect(() => {
    if (user && user.role !== 'storekeeper' && user.role !== 'admin') {
      window.location.href = '/dashboard';
      return;
    }
    if (user) {
      fetchPackages();
    }
  }, [user]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .in('status', [
          'pending_verification', 
          'pending_dropoff', 
          'received_at_pickup', 
          'in_transit', 
          'delivered'
        ])
        .order('created_at', { ascending: false });

      if (error) {
        console.log('No packages table yet');
        setPackages([]);
      } else {
        setPackages(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      setPackages([]);
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  };

  usePackageUpdates(() => fetchPackages());

  const sendNotification = async (userId: string, title: string, message: string, type: string, trackingNumber?: string) => {
    try {
      await supabase
        .from('notifications')
        .insert([{
          user_id: userId,
          title,
          message,
          type,
          tracking_number: trackingNumber,
          is_read: false,
        }]);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const handleVerifyPackage = (pkg: PackageItem) => {
    setSelectedPackage(pkg);
    setShowVerifyModal(true);
  };

  const handleConfirmVerification = async () => {
    if (!selectedPackage) return;
    setIsSubmitting(true);

    try {
      const trackingNumber = selectedPackage.tracking_number || `SND-${Math.floor(Math.random() * 90000 + 10000)}`;
      
      const { error } = await supabase
        .from('packages')
        .update({
          status: 'pending_dropoff',
          verification_status: 'verified',
          verified_by: user?.name || 'Storekeeper',
          verified_at: new Date().toISOString(),
          tracking_number: trackingNumber,
        })
        .eq('id', selectedPackage.id);

      if (error) {
        alert('Failed to verify package');
      } else {
        if (selectedPackage.sender_id) {
          await sendNotification(
            selectedPackage.sender_id,
            'Package Verified ✅',
            `Your package ${trackingNumber} has been verified and is ready for pickup.`,
            'success',
            trackingNumber
          );
        }
        alert(`✅ Package ${trackingNumber} verified successfully!`);
        fetchPackages();
        setShowVerifyModal(false);
        setSelectedPackage(null);
      }
    } catch (error) {
      alert('Failed to verify package');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectPackage = async () => {
    if (!selectedPackage || !rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('packages')
        .update({
          status: 'cancelled',
          verification_status: 'rejected',
          verification_notes: rejectReason,
          verified_by: user?.name || 'Storekeeper',
          verified_at: new Date().toISOString(),
        })
        .eq('id', selectedPackage.id);

      if (error) {
        alert('Failed to reject package');
      } else {
        if (selectedPackage.sender_id) {
          await sendNotification(
            selectedPackage.sender_id,
            'Package Rejected ❌',
            `Your package ${selectedPackage.tracking_number} was rejected. Reason: ${rejectReason}`,
            'error',
            selectedPackage.tracking_number
          );
        }
        alert(`❌ Package ${selectedPackage.tracking_number} rejected`);
        fetchPackages();
        setShowRejectModal(false);
        setShowVerifyModal(false);
        setSelectedPackage(null);
        setRejectReason('');
      }
    } catch (error) {
      alert('Failed to reject package');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReceiveFromUser = async (pkgId: string) => {
    try {
      const { error } = await supabase
        .from('packages')
        .update({ status: 'received_at_pickup' })
        .eq('id', pkgId);

      if (error) {
        alert('Failed to receive package');
      } else {
        alert('✅ Package received from user!');
        fetchPackages();
      }
    } catch (error) {
      alert('Failed to receive package');
    }
  };

  const handleHandoverToDriver = async (pkgId: string) => {
    try {
      const { error } = await supabase
        .from('packages')
        .update({ status: 'in_transit' })
        .eq('id', pkgId);

      if (error) {
        alert('Failed to handover package');
      } else {
        alert('✅ Package handed over to driver!');
        fetchPackages();
      }
    } catch (error) {
      alert('Failed to handover package');
    }
  };

  const handleReceiveFromDriver = async (pkgId: string) => {
    try {
      const { error } = await supabase
        .from('packages')
        .update({ 
          status: 'delivered',
          delivered_at: new Date().toISOString()
        })
        .eq('id', pkgId);

      if (error) {
        alert('Failed to receive package from driver');
      } else {
        alert('✅ Package received from driver!');
        fetchPackages();
      }
    } catch (error) {
      alert('Failed to receive package from driver');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      delivered: 'bg-green-100 text-green-700',
      in_transit: 'bg-blue-100 text-blue-700',
      pending_dropoff: 'bg-yellow-100 text-yellow-700',
      pending_verification: 'bg-gray-100 text-gray-700',
      received_at_pickup: 'bg-purple-100 text-purple-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    const labels: Record<string, string> = {
      delivered: 'Delivered',
      in_transit: 'In Transit',
      pending_dropoff: 'Ready for Pickup',
      pending_verification: 'Pending Verification',
      received_at_pickup: 'Received',
      cancelled: 'Cancelled',
    };
    return { className: styles[status] || 'bg-gray-100 text-gray-700', label: labels[status] || status };
  };

  const getVerificationBadge = (status: string) => {
    const styles: Record<string, string> = {
      verified: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      rejected: 'bg-red-100 text-red-700',
    };
    const labels: Record<string, string> = {
      verified: 'Verified',
      pending: 'Pending',
      rejected: 'Rejected',
    };
    return { className: styles[status] || 'bg-gray-100 text-gray-700', label: labels[status] || status };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredPackages = packages.filter(pkg => {
    const matchesSearch = pkg.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          pkg.sender_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          pkg.receiver_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          pkg.destination_city?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesTab = true;
    if (activeTab === 'outgoing') {
      matchesTab = ['pending_verification', 'pending_dropoff', 'received_at_pickup'].includes(pkg.status);
    } else if (activeTab === 'incoming') {
      matchesTab = ['in_transit', 'delivered'].includes(pkg.status);
    }
    
    const matchesStatus = filterStatus === 'all' || pkg.status === filterStatus;
    
    return matchesSearch && matchesTab && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading packages...</p>
      </div>
    );
  }

  if (!user || (user.role !== 'storekeeper' && user.role !== 'admin')) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📦 Packages</h1>
          <p className="text-gray-500 text-sm">
            Manage incoming and outgoing packages
            <span className={`ml-2 text-xs inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${
              isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}></span>
              {isConnected ? 'Live' : 'Connecting...'}
            </span>
          </p>
        </div>
        <button
          onClick={fetchPackages}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            activeTab === 'all'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab('outgoing')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition flex items-center gap-1 ${
            activeTab === 'outgoing'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <ArrowRight className="w-4 h-4" />
          Outgoing
        </button>
        <button
          onClick={() => setActiveTab('incoming')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition flex items-center gap-1 ${
            activeTab === 'incoming'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          Incoming
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by tracking number, sender, receiver..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[160px]"
          >
            <option value="all">All Status</option>
            <option value="pending_verification">Pending Verification</option>
            <option value="pending_dropoff">Ready for Pickup</option>
            <option value="received_at_pickup">Received</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tracking</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Sender/Receiver</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Verification</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPackages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p>No packages found</p>
                  </td>
                </tr>
              ) : (
                filteredPackages.map((pkg) => {
                  const badge = getStatusBadge(pkg.status);
                  const verificationBadge = getVerificationBadge(pkg.verification_status || 'pending');
                  
                  return (
                    <tr key={pkg.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <p className="font-mono font-medium text-blue-600 text-sm">
                          {pkg.tracking_number || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-400">{pkg.destination_city}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{pkg.sender_name}</p>
                        <p className="text-sm text-gray-600">→ {pkg.receiver_name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${verificationBadge.className}`}>
                          {verificationBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {pkg.driver_name ? (
                          <span className="text-sm text-blue-600">{pkg.driver_name}</span>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Outgoing Actions */}
                          {pkg.status === 'pending_verification' && (
                            <>
                              <button
                                onClick={() => handleVerifyPackage(pkg)}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition"
                              >
                                Verify
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedPackage(pkg);
                                  setShowRejectModal(true);
                                }}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {pkg.status === 'pending_dropoff' && (
                            <button
                              onClick={() => handleReceiveFromUser(pkg.id)}
                              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-lg transition"
                            >
                              Receive
                            </button>
                          )}
                          {pkg.status === 'received_at_pickup' && (
                            <button
                              onClick={() => handleHandoverToDriver(pkg.id)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition"
                            >
                              Handover
                            </button>
                          )}
                          {/* Incoming Actions */}
                          {pkg.status === 'in_transit' && (
                            <button
                              onClick={() => handleReceiveFromDriver(pkg.id)}
                              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg transition"
                            >
                              Receive
                            </button>
                          )}
                          {pkg.status === 'delivered' && (
                            <span className="text-xs text-green-600 font-medium">✅ Done</span>
                          )}
                          <button
                            onClick={() => {
                              setSelectedPackage(pkg);
                              setShowDetailsModal(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 text-sm text-gray-500 text-center">
        Showing {filteredPackages.length} of {packages.length} packages
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedPackage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Package Details</h2>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500">Tracking Number</p>
                <p className="font-mono font-bold text-blue-600">{selectedPackage.tracking_number || 'N/A'}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Sender</p>
                  <p className="font-medium">{selectedPackage.sender_name}</p>
                  <p className="text-xs text-gray-400">{selectedPackage.sender_phone}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Receiver</p>
                  <p className="font-medium">{selectedPackage.receiver_name}</p>
                  <p className="text-xs text-gray-400">{selectedPackage.receiver_phone}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Description</p>
                <p className="font-medium">{selectedPackage.description}</p>
                <p className="text-xs text-gray-400">{selectedPackage.weight_kg} kg</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Delivery Address</p>
                <p className="font-medium">{selectedPackage.delivery_address}</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Close
                </button>
                {selectedPackage.status === 'pending_verification' && (
                  <button
                    onClick={handleConfirmVerification}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                  >
                    Verify
                  </button>
                )}
                {selectedPackage.status === 'pending_dropoff' && (
                  <button
                    onClick={() => {
                      handleReceiveFromUser(selectedPackage.id);
                      setShowDetailsModal(false);
                    }}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                  >
                    Receive
                  </button>
                )}
                {selectedPackage.status === 'received_at_pickup' && (
                  <button
                    onClick={() => {
                      handleHandoverToDriver(selectedPackage.id);
                      setShowDetailsModal(false);
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Handover
                  </button>
                )}
                {selectedPackage.status === 'in_transit' && (
                  <button
                    onClick={() => {
                      handleReceiveFromDriver(selectedPackage.id);
                      setShowDetailsModal(false);
                    }}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    Receive
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedPackage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Reject Package</h2>
            <p className="text-sm text-gray-600 mb-4">
              Reason for rejecting <span className="font-mono font-bold">{selectedPackage.tracking_number}</span>
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="e.g., Package doesn't match description..."
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedPackage(null);
                  setRejectReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectPackage}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}