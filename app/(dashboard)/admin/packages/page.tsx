// app/(dashboard)/admin/packages/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { 
  Package, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  MapPin,
  Calendar,
  Filter,
  X,
  Save,
  User,
  Phone,
  Mail,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface PackageItem {
  id: string;
  tracking_number: string;
  status: string;
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
  description: string;
  driver_name?: string;
  driver_email?: string;
  created_at: string;
  estimated_delivery?: string;
  delivered_at?: string;
  fee?: number;
  payment_status?: string;
  verification_status?: string;
  verification_notes?: string;
  verified_by?: string;
  verified_at?: string;
}

export default function AdminPackagesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPackage, setSelectedPackage] = useState<PackageItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Edit form state
  const [formData, setFormData] = useState({
    status: '',
    driver_name: '',
    driver_email: '',
    payment_status: '',
    verification_status: '',
  });

  useEffect(() => {
    if (user && user.role !== 'admin') {
      window.location.href = '/dashboard';
      return;
    }
    loadPackages();
  }, [user]);

  const loadPackages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching packages:', error);
      setPackages([]);
    } else {
      setPackages(data || []);
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      delivered: 'bg-green-100 text-green-700',
      in_transit: 'bg-blue-100 text-blue-700',
      pending_dropoff: 'bg-yellow-100 text-yellow-700',
      pending_verification: 'bg-gray-100 text-gray-700',
      received_at_pickup: 'bg-purple-100 text-purple-700',
      out_for_delivery: 'bg-orange-100 text-orange-700',
      at_destination_hub: 'bg-indigo-100 text-indigo-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    const labels: Record<string, string> = {
      delivered: 'Delivered',
      in_transit: 'In Transit',
      pending_dropoff: 'Pending Drop-off',
      pending_verification: 'Pending Verification',
      received_at_pickup: 'Received at Pickup',
      out_for_delivery: 'Out for Delivery',
      at_destination_hub: 'At Hub',
      cancelled: 'Cancelled ❌',
    };
    return { className: styles[status] || 'bg-gray-100 text-gray-700', label: labels[status] || status };
  };

  const getPaymentBadge = (status: string) => {
    const styles: Record<string, string> = {
      paid: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      unpaid: 'bg-red-100 text-red-700',
    };
    const labels: Record<string, string> = {
      paid: 'Paid',
      pending: 'Pending',
      unpaid: 'Unpaid',
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

  const handleEditPackage = (pkg: PackageItem) => {
    setSelectedPackage(pkg);
    setFormData({
      status: pkg.status,
      driver_name: pkg.driver_name || '',
      driver_email: pkg.driver_email || '',
      payment_status: pkg.payment_status || 'pending',
      verification_status: pkg.verification_status || 'pending',
    });
    setShowEditModal(true);
  };

  const handleUpdatePackage = async () => {
    if (!selectedPackage) return;
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const { error } = await supabase
        .from('packages')
        .update({
          status: formData.status,
          driver_name: formData.driver_name,
          driver_email: formData.driver_email,
          payment_status: formData.payment_status,
          verification_status: formData.verification_status,
        })
        .eq('id', selectedPackage.id);

      if (error) {
        setErrorMessage('Failed to update package');
        console.error('Error updating package:', error);
      } else {
        setSuccessMessage('Package updated successfully');
        loadPackages();
        setShowEditModal(false);
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      setErrorMessage('An error occurred');
      console.error('Error:', error);
    }
    setSaving(false);
  };

  const handleDeletePackage = async () => {
    if (!selectedPackage) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('packages')
        .delete()
        .eq('id', selectedPackage.id);

      if (error) {
        setErrorMessage('Failed to delete package');
        console.error('Error deleting package:', error);
      } else {
        setSuccessMessage('Package deleted successfully');
        loadPackages();
        setShowDeleteModal(false);
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      setErrorMessage('An error occurred');
      console.error('Error:', error);
    }
    setSaving(false);
  };

  const handleViewDetails = (pkg: PackageItem) => {
    setSelectedPackage(pkg);
    setShowDetailsModal(true);
  };

  const filteredPackages = packages.filter(pkg => {
    const matchesSearch = pkg.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          pkg.sender_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          pkg.receiver_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || pkg.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: packages.length,
    delivered: packages.filter(p => p.status === 'delivered').length,
    inTransit: packages.filter(p => p.status === 'in_transit' || p.status === 'out_for_delivery').length,
    pending: packages.filter(p => p.status === 'pending_verification' || p.status === 'pending_dropoff').length,
    cancelled: packages.filter(p => p.status === 'cancelled').length,
    atHub: packages.filter(p => p.status === 'at_destination_hub').length,
  };

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

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Packages</h1>
          <p className="text-gray-500 text-sm">Manage all packages in the system</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition"
          >
            {viewMode === 'list' ? '📊 Grid' : '📋 List'}
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <p className="text-green-700 font-medium">{successMessage}</p>
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-700 font-medium">{errorMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Delivered</p>
          <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">In Transit</p>
          <p className="text-2xl font-bold text-blue-600">{stats.inTransit}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Cancelled</p>
          <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by tracking number, sender, or receiver..."
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
            <option value="delivered">Delivered</option>
            <option value="in_transit">In Transit</option>
            <option value="pending_dropoff">Pending Drop-off</option>
            <option value="pending_verification">Pending Verification</option>
            <option value="received_at_pickup">Received at Pickup</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {filteredPackages.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No packages found</h3>
          <p className="text-gray-500 text-sm mt-1">
            {searchTerm || filterStatus !== 'all' ? 'Try adjusting your search or filters' : 'No packages in the system yet'}
          </p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tracking</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Sender/Receiver</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredPackages.map((pkg) => {
                  const badge = getStatusBadge(pkg.status);
                  const paymentBadge = getPaymentBadge(pkg.payment_status || 'pending');
                  return (
                    <tr key={pkg.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-3">
                        <p className="font-mono font-semibold text-blue-600 text-sm">{pkg.tracking_number}</p>
                      </td>
                      <td className="px-5 py-3">
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">From: {pkg.sender_name}</p>
                          <p className="text-gray-500">To: {pkg.receiver_name}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${paymentBadge.className}`}>
                          {paymentBadge.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">
                        {formatDate(pkg.created_at)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleViewDetails(pkg)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditPackage(pkg)}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                            title="Edit Package"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPackage(pkg);
                              setShowDeleteModal(true);
                            }}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete Package"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPackages.map((pkg) => {
            const badge = getStatusBadge(pkg.status);
            const paymentBadge = getPaymentBadge(pkg.payment_status || 'pending');
            return (
              <div key={pkg.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-3">
                  <p className="font-mono font-semibold text-blue-600 text-sm">{pkg.tracking_number}</p>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${badge.className}`}>
                    {badge.label}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-700">
                    <span className="font-medium">From:</span> {pkg.sender_name}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">To:</span> {pkg.receiver_name}
                  </p>
                  <p className="text-gray-500 flex items-center gap-1">
                    <Package className="w-3.5 h-3.5" />
                    {pkg.description} ({pkg.weight_kg} kg)
                  </p>
                  <p className="text-gray-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {pkg.pickup_point_name} → {pkg.destination_city}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${paymentBadge.className}`}>
                      {paymentBadge.label}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs">
                    <Calendar className="w-3.5 h-3.5 inline mr-1" />
                    {formatDate(pkg.created_at)}
                  </p>
                  {pkg.driver_name && (
                    <p className="text-gray-500 text-xs flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5" />
                      Driver: {pkg.driver_name}
                    </p>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end gap-1">
                  <button
                    onClick={() => handleViewDetails(pkg)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEditPackage(pkg)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPackage(pkg);
                      setShowDeleteModal(true);
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredPackages.length > 0 && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Showing {filteredPackages.length} of {packages.length} package{packages.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* View Details Modal */}
      {showDetailsModal && selectedPackage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Package Details</h2>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Tracking Number</p>
                  <p className="font-mono font-bold text-blue-600">{selectedPackage.tracking_number}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Status</p>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusBadge(selectedPackage.status).className}`}>
                    {getStatusBadge(selectedPackage.status).label}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Sender</p>
                  <p className="font-medium">{selectedPackage.sender_name}</p>
                  <p className="text-xs text-gray-500">{selectedPackage.sender_phone}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Receiver</p>
                  <p className="font-medium">{selectedPackage.receiver_name}</p>
                  <p className="text-xs text-gray-500">{selectedPackage.receiver_phone}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Pickup Point</p>
                  <p className="font-medium">{selectedPackage.pickup_point_name}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Destination</p>
                  <p className="font-medium">{selectedPackage.destination_city}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Weight</p>
                  <p className="font-medium">{selectedPackage.weight_kg} kg</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Description</p>
                  <p className="font-medium">{selectedPackage.description || 'N/A'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Payment Status</p>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getPaymentBadge(selectedPackage.payment_status || 'pending').className}`}>
                    {getPaymentBadge(selectedPackage.payment_status || 'pending').label}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Created At</p>
                  <p className="font-medium">{formatDate(selectedPackage.created_at)}</p>
                </div>
              </div>
              {selectedPackage.driver_name && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Assigned Driver</p>
                  <p className="font-medium">{selectedPackage.driver_name}</p>
                  <p className="text-xs text-gray-500">{selectedPackage.driver_email}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Package Modal */}
      {showEditModal && selectedPackage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Edit Package</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending_verification">Pending Verification</option>
                  <option value="pending_dropoff">Pending Drop-off</option>
                  <option value="received_at_pickup">Received at Pickup</option>
                  <option value="in_transit">In Transit</option>
                  <option value="at_destination_hub">At Hub</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name</label>
                <input
                  type="text"
                  value={formData.driver_name}
                  onChange={(e) => setFormData({...formData, driver_name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Driver Email</label>
                <input
                  type="email"
                  value={formData.driver_email}
                  onChange={(e) => setFormData({...formData, driver_email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                <select
                  value={formData.payment_status}
                  onChange={(e) => setFormData({...formData, payment_status: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Verification Status</label>
                <select
                  value={formData.verification_status}
                  onChange={(e) => setFormData({...formData, verification_status: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdatePackage}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Package Modal */}
      {showDeleteModal && selectedPackage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Delete Package</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete package <span className="font-mono font-bold text-gray-900">{selectedPackage.tracking_number}</span>? 
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePackage}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {saving ? 'Deleting...' : 'Delete Package'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}