// app/(dashboard)/storekeeper/packages/page.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { 
  Package, 
  ClipboardCheck, 
  Truck, 
  Search,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  MapPin,
  X,
  Printer,
  Phone,
  User,
  QrCode,
  Shield,
  FileCheck,
  RefreshCw,
  ArrowUpDown,
  ArrowLeft,
  ArrowRight,
  PackageCheck
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
  pickup_point_name?: string;
  pickup_address?: string;
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
  const [activeTab, setActiveTab] = useState<'all' | 'outgoing' | 'incoming' | 'in_transit' | 'delivered'>('all');

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
      // Fetch ALL packages that a storekeeper needs to see:
      // 1. Packages pending verification (outgoing)
      // 2. Packages ready for pickup (outgoing)
      // 3. Packages received at pickup (outgoing)
      // 4. Packages in transit (incoming/outgoing)
      // 5. Packages delivered (completed)
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

  // Real-time updates
  const handlePackageUpdate = (payload: any) => {
    console.log('📦 Storekeeper package update received:', payload);
    fetchPackages();
  };

  usePackageUpdates(handlePackageUpdate);

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

  // ========== STOREKEEPER ACTIONS ==========

  // 1. Verify package (outgoing)
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
        console.error('Error verifying package:', error);
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
      console.error('Error:', error);
      alert('Failed to verify package');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Reject package (outgoing)
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
        console.error('Error rejecting package:', error);
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
      console.error('Error:', error);
      alert('Failed to reject package');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Receive package from user (outgoing)
  const handleReceiveFromUser = async (pkgId: string) => {
    try {
      const { error } = await supabase
        .from('packages')
        .update({ status: 'received_at_pickup' })
        .eq('id', pkgId);

      if (error) {
        console.error('Error receiving package:', error);
        alert('Failed to receive package');
      } else {
        alert('✅ Package received from user!');
        fetchPackages();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to receive package');
    }
  };

  // 4. Handover to driver (outgoing)
  const handleHandoverToDriver = async (pkgId: string) => {
    try {
      const { error } = await supabase
        .from('packages')
        .update({ status: 'in_transit' })
        .eq('id', pkgId);

      if (error) {
        console.error('Error handing over package:', error);
        alert('Failed to handover package');
      } else {
        alert('✅ Package handed over to driver!');
        fetchPackages();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to handover package');
    }
  };

  // 5. Receive package from driver (incoming)
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
        console.error('Error receiving from driver:', error);
        alert('Failed to receive package from driver');
      } else {
        alert('✅ Package received from driver! Delivery complete!');
        fetchPackages();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to receive package from driver');
    }
  };

  // 6. Mark as delivered to final recipient
  const handleMarkDelivered = async (pkgId: string) => {
    try {
      const { error } = await supabase
        .from('packages')
        .update({ 
          status: 'delivered',
          delivered_at: new Date().toISOString()
        })
        .eq('id', pkgId);

      if (error) {
        console.error('Error marking delivered:', error);
        alert('Failed to mark package as delivered');
      } else {
        alert('✅ Package marked as delivered!');
        fetchPackages();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to mark package as delivered');
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
      delivered: 'Delivered ✅',
      in_transit: 'In Transit 🚚',
      pending_dropoff: 'Ready for Pickup 📦',
      pending_verification: 'Pending Verification ⏳',
      received_at_pickup: 'Received at Pickup 📍',
      cancelled: 'Cancelled ❌',
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
      verified: 'Verified ✅',
      pending: 'Pending',
      rejected: 'Rejected ❌',
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

  const stats = {
    pendingVerification: packages.filter(p => p.status === 'pending_verification').length,
    pendingDropoff: packages.filter(p => p.status === 'pending_dropoff').length,
    receivedAtPickup: packages.filter(p => p.status === 'received_at_pickup').length,
    inTransit: packages.filter(p => p.status === 'in_transit').length,
    delivered: packages.filter(p => p.status === 'delivered').length,
    total: packages.length,
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
    } else if (activeTab === 'in_transit') {
      matchesTab = pkg.status === 'in_transit';
    } else if (activeTab === 'delivered') {
      matchesTab = pkg.status === 'delivered';
    }
    
    const matchesStatus = filterStatus === 'all' || pkg.status === filterStatus;
    
    return matchesSearch && matchesTab && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading packages...</p>
        </div>
      </div>
    );
  }

  if (!user || (user.role !== 'storekeeper' && user.role !== 'admin')) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📦 Package Management</h1>
          <p className="text-gray-500 text-sm flex items-center gap-2">
            Verify outgoing, receive incoming, and track all packages
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
          <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
            <PackageCheck className="w-4 h-4" />
            {stats.total} Total
          </div>
          <button
            onClick={fetchPackages}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Pending Verify</p>
          <p className="text-2xl font-bold text-gray-600">{stats.pendingVerification}</p>
          <p className="text-xs text-gray-400">📤 Outgoing</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Ready for Pickup</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pendingDropoff}</p>
          <p className="text-xs text-gray-400">📤 Outgoing</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Received at Pickup</p>
          <p className="text-2xl font-bold text-purple-600">{stats.receivedAtPickup}</p>
          <p className="text-xs text-gray-400">📤 Outgoing</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">In Transit</p>
          <p className="text-2xl font-bold text-blue-600">{stats.inTransit}</p>
          <p className="text-xs text-gray-400">📥 Incoming/Outgoing</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Delivered</p>
          <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
          <p className="text-xs text-gray-400">✅ Completed</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All Packages
        </button>
        <button
          onClick={() => setActiveTab('outgoing')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1 ${
            activeTab === 'outgoing'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <ArrowRight className="w-4 h-4" />
          Outgoing
        </button>
        <button
          onClick={() => setActiveTab('incoming')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1 ${
            activeTab === 'incoming'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          Incoming
        </button>
        <button
          onClick={() => setActiveTab('in_transit')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'in_transit'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          🚚 In Transit
        </button>
        <button
          onClick={() => setActiveTab('delivered')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'delivered'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          ✅ Delivered
        </button>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by tracking number, sender, receiver, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">All Status</option>
            <option value="pending_verification">Pending Verification</option>
            <option value="pending_dropoff">Ready for Pickup</option>
            <option value="received_at_pickup">Received at Pickup</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>
      </div>

      {/* Packages Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Package</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Sender</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Receiver</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Verification</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredPackages.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-gray-500">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p>No packages found</p>
                  </td>
                </tr>
              ) : (
                filteredPackages.map((pkg) => {
                  const badge = getStatusBadge(pkg.status);
                  const verificationBadge = getVerificationBadge(pkg.verification_status || 'pending');
                  const isOutgoing = ['pending_verification', 'pending_dropoff', 'received_at_pickup'].includes(pkg.status);
                  const isIncoming = ['in_transit', 'delivered'].includes(pkg.status);
                  
                  return (
                    <tr key={pkg.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-3">
                        <div>
                          <p className="font-mono font-semibold text-blue-600 text-sm">
                            {pkg.tracking_number || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-400">{pkg.destination_city}</p>
                          {isOutgoing && (
                            <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">📤 Outgoing</span>
                          )}
                          {isIncoming && (
                            <span className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded">📥 Incoming</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium text-gray-900">{pkg.sender_name}</p>
                        <p className="text-xs text-gray-500">{pkg.sender_phone}</p>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-sm text-gray-700">{pkg.receiver_name}</p>
                        <p className="text-xs text-gray-500">{pkg.receiver_phone}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${verificationBadge.className}`}>
                          {verificationBadge.label}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {pkg.driver_name ? (
                          <span className="text-sm text-blue-600">{pkg.driver_name}</span>
                        ) : (
                          <span className="text-sm text-gray-400">Unassigned</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 flex-wrap">
                          {/* Outgoing Actions */}
                          {pkg.status === 'pending_verification' && (
                            <>
                              <button
                                onClick={() => handleVerifyPackage(pkg)}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition"
                              >
                                <FileCheck className="w-3.5 h-3.5 inline mr-1" />
                                Verify
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedPackage(pkg);
                                  setShowRejectModal(true);
                                }}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition"
                              >
                                <X className="w-3.5 h-3.5 inline mr-1" />
                                Reject
                              </button>
                            </>
                          )}
                          {pkg.status === 'pending_dropoff' && (
                            <button
                              onClick={() => handleReceiveFromUser(pkg.id)}
                              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-lg transition"
                            >
                              <CheckCircle className="w-3.5 h-3.5 inline mr-1" />
                              Receive
                            </button>
                          )}
                          {pkg.status === 'received_at_pickup' && (
                            <button
                              onClick={() => handleHandoverToDriver(pkg.id)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition"
                            >
                              <Truck className="w-3.5 h-3.5 inline mr-1" />
                              Handover
                            </button>
                          )}
                          {/* Incoming Actions */}
                          {pkg.status === 'in_transit' && (
                            <button
                              onClick={() => handleReceiveFromDriver(pkg.id)}
                              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg transition"
                            >
                              <PackageCheck className="w-3.5 h-3.5 inline mr-1" />
                              Receive from Driver
                            </button>
                          )}
                          {pkg.status === 'delivered' && (
                            <button
                              onClick={() => handleMarkDelivered(pkg.id)}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition"
                            >
                              <CheckCircle className="w-3.5 h-3.5 inline mr-1" />
                              Confirm Delivery
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedPackage(pkg);
                              setShowDetailsModal(true);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
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

      <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm text-gray-500">
        <span>Showing {filteredPackages.length} of {packages.length} package{packages.length !== 1 ? 's' : ''}</span>
        <div className="flex flex-wrap items-center gap-4">
          <span>Total: {packages.length}</span>
          <span>Verified: {packages.filter(p => p.verification_status === 'verified').length}</span>
          <span>Outgoing: {packages.filter(p => ['pending_verification', 'pending_dropoff', 'received_at_pickup'].includes(p.status)).length}</span>
          <span>Incoming: {packages.filter(p => ['in_transit', 'delivered'].includes(p.status)).length}</span>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedPackage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Package Details</h2>
                <p className="text-sm text-gray-500">Complete package information</p>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Tracking Number</p>
                  <p className="font-mono font-bold text-blue-600">{selectedPackage.tracking_number || 'N/A'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Status</p>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusBadge(selectedPackage.status).className}`}>
                    {getStatusBadge(selectedPackage.status).label}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Sender</p>
                  <p className="font-medium">{selectedPackage.sender_name}</p>
                  <p className="text-xs text-gray-500">{selectedPackage.sender_phone}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Receiver</p>
                  <p className="font-medium">{selectedPackage.receiver_name}</p>
                  <p className="text-xs text-gray-500">{selectedPackage.receiver_phone}</p>
                </div>
                <div className="col-span-2 p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Description</p>
                  <p className="font-medium">{selectedPackage.description}</p>
                  <p className="text-xs text-gray-500">{selectedPackage.weight_kg} kg</p>
                </div>
                <div className="col-span-2 p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Delivery Address</p>
                  <p className="font-medium">{selectedPackage.delivery_address}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Created</p>
                  <p className="text-sm">{formatDate(selectedPackage.created_at)}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Driver</p>
                  <p className="font-medium">{selectedPackage.driver_name || 'Not assigned'}</p>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verify Modal */}
      {showVerifyModal && selectedPackage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Verify Package</h2>
                <p className="text-sm text-gray-500">Confirm package details before verification</p>
              </div>
              <button onClick={() => setShowVerifyModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Tracking</p>
                  <p className="font-mono font-bold text-blue-600">{selectedPackage.tracking_number || 'N/A'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Weight</p>
                  <p className="font-medium">{selectedPackage.weight_kg} kg</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Sender</p>
                  <p className="font-medium">{selectedPackage.sender_name}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Receiver</p>
                  <p className="font-medium">{selectedPackage.receiver_name}</p>
                </div>
                <div className="col-span-2 p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Description</p>
                  <p className="font-medium">{selectedPackage.description}</p>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowVerifyModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmVerification}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <FileCheck className="w-4 h-4" />
                  Verify Package
                </button>
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
              Please provide a reason for rejecting package <span className="font-mono font-bold">{selectedPackage.tracking_number}</span>
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
                {isSubmitting ? 'Rejecting...' : 'Reject Package'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}