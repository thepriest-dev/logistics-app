// app/(dashboard)/packages/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import {
  Package,
  Search,
  Filter,
  ChevronDown,
  Eye,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  AlertCircle,
  MapPin,
  User,
  Phone,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Grid,
  List,
  Download,
  Printer,
  FileSpreadsheet,
  FileText
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
  fee?: number;
  payment_status?: string;
}

export default function PackagesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedPackage, setSelectedPackage] = useState<PackageType | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  // ========== REDIRECT DRIVERS AWAY ==========
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    // If user is a driver, redirect to driver dashboard
    if (user.role === 'driver') {
      router.push('/driver');
      return;
    }
  }, [user, router]);

  const loadPackages = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('packages')
        .select('*')
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.log('No packages yet');
        setPackages([]);
        setLoading(false);
        return;
      }

      setPackages(data || []);

    } catch (err) {
      console.error('Error fetching packages:', err);
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPackages();
  }, [user]);

  const getStatusInfo = (status: string) => {
    const map: Record<string, { color: string; icon: React.ReactElement; bg: string; label: string }> = {
      pending_verification: {
        color: 'text-yellow-600',
        icon: <Clock className="w-4 h-4" />,
        bg: 'bg-yellow-50',
        label: 'Pending Verification'
      },
      pending_dropoff: {
        color: 'text-purple-600',
        icon: <Clock className="w-4 h-4" />,
        bg: 'bg-purple-50',
        label: 'Ready for Pickup'
      },
      received_at_pickup: {
        color: 'text-blue-600',
        icon: <Truck className="w-4 h-4" />,
        bg: 'bg-blue-50',
        label: 'Assigned to Driver'
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
        label: 'Delivered'
      },
      cancelled: {
        color: 'text-red-600',
        icon: <XCircle className="w-4 h-4" />,
        bg: 'bg-red-50',
        label: 'Cancelled'
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

  const formatDate = (date: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  // ========== EXPORT FUNCTIONALITY ==========
  const exportPackages = (format: 'csv' | 'json' | 'print') => {
    if (packages.length === 0) {
      alert('No packages to export');
      return;
    }

    setExporting(true);

    try {
      // Prepare data for export
      const exportData = sortedPackages.map(pkg => ({
        'Tracking Number': pkg.tracking_number || 'N/A',
        'Description': pkg.description || 'N/A',
        'Status': getStatusInfo(pkg.status).label,
        'Receiver': pkg.receiver_name || 'N/A',
        'Receiver Phone': pkg.receiver_phone || 'N/A',
        'Delivery Address': pkg.delivery_address || 'N/A',
        'City': pkg.destination_city || 'N/A',
        'Weight (kg)': pkg.weight_kg || 0,
        'Created': formatDate(pkg.created_at),
        'Fee': pkg.fee ? `$${pkg.fee.toFixed(2)}` : 'N/A',
        'Payment Status': pkg.payment_status || 'N/A'
      }));

      if (format === 'csv') {
        // Export as CSV
        const headers = Object.keys(exportData[0]);
        const csvRows = [];
        csvRows.push(headers.join(','));
        
        for (const row of exportData) {
          const values = headers.map(header => {
            const val = String(row[header as keyof typeof row] || '');
            return `"${val.replace(/"/g, '""')}"`;
          });
          csvRows.push(values.join(','));
        }
        
        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `packages_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        alert(`✅ ${exportData.length} packages exported as CSV!`);
        
      } else if (format === 'json') {
        // Export as JSON
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `packages_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        alert(`✅ ${exportData.length} packages exported as JSON!`);
        
      } else if (format === 'print') {
        // Print
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Packages Export</title>
                <style>
                  body { font-family: Arial, sans-serif; padding: 20px; }
                  h1 { color: #1a202c; border-bottom: 2px solid #4299e1; padding-bottom: 10px; }
                  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                  th { background: #4299e1; color: white; padding: 10px; text-align: left; font-size: 12px; }
                  td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
                  tr:hover { background: #f7fafc; }
                  .status-badge { 
                    display: inline-block; 
                    padding: 2px 8px; 
                    border-radius: 12px; 
                    font-size: 11px;
                    font-weight: 600;
                  }
                  .status-pending { background: #fefcbf; color: #975a16; }
                  .status-delivered { background: #c6f6d5; color: #22543d; }
                  .status-transit { background: #bee3f8; color: #2a69ac; }
                  .status-cancelled { background: #fed7d7; color: #9b2c2c; }
                  .footer { margin-top: 20px; color: #718096; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 10px; }
                </style>
              </head>
              <body>
                <h1>📦 Package Export</h1>
                <p>Exported on: ${new Date().toLocaleString()}</p>
                <p>Total packages: ${exportData.length}</p>
                <table>
                  <thead>
                    <tr>
                      ${Object.keys(exportData[0]).map(key => `<th>${key}</th>`).join('')}
                    </tr>
                  </thead>
                  <tbody>
                    ${exportData.map(row => `
                      <tr>
                        ${Object.values(row).map(val => {
                          if (String(val).includes('Pending') || String(val).includes('Delivered') || 
                              String(val).includes('Transit') || String(val).includes('Cancelled')) {
                            const statusClass = String(val).toLowerCase().replace(/ /g, '-');
                            return `<td><span class="status-badge status-${statusClass}">${val}</span></td>`;
                          }
                          return `<td>${val}</td>`;
                        }).join('')}
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
                <div class="footer">
                  <p>Generated by SendIt Package Tracking System</p>
                </div>
                <script>
                  window.onload = function() { window.print(); }
                <\/script>
              </body>
            </html>
          `);
          printWindow.document.close();
        }
      }
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export packages. Please try again.');
    } finally {
      setExporting(false);
    }
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

  const sortedPackages = [...filteredPackages].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    } else if (sortBy === 'oldest') {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    } else if (sortBy === 'weight_high') {
      return b.weight_kg - a.weight_kg;
    } else if (sortBy === 'weight_low') {
      return a.weight_kg - b.weight_kg;
    }
    return 0;
  });

  if (!user) {
    return null;
  }

  // If user is driver, don't render anything (redirect happens in useEffect)
  if (user.role === 'driver') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📦 All Packages</h1>
            <p className="text-gray-500 text-sm mt-1">Complete overview of all your packages</p>
          </div>
          <div className="flex items-center gap-3 mt-3 md:mt-0 flex-wrap">
            <button
              onClick={loadPackages}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            
            {/* Export Dropdown */}
            <div className="relative group">
              <button
                disabled={exporting || packages.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                {exporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Export
                    <ChevronDown className="w-3 h-3" />
                  </>
                )}
              </button>
              {!exporting && packages.length > 0 && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <button
                    onClick={() => exportPackages('csv')}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-green-600" />
                    Export as CSV
                  </button>
                  <button
                    onClick={() => exportPackages('json')}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-blue-600" />
                    Export as JSON
                  </button>
                  <button
                    onClick={() => exportPackages('print')}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4 text-gray-600" />
                    Print / PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by description, receiver, tracking number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
              >
                <option value="all">All Status</option>
                <option value="pending_verification">Pending Verification</option>
                <option value="pending_dropoff">Ready for Pickup</option>
                <option value="received_at_pickup">Assigned to Driver</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="weight_high">Weight: High to Low</option>
                <option value="weight_low">Weight: Low to High</option>
              </select>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                >
                  <Grid className="w-4 h-4" />
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

        {/* Results Info */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-500">
            Showing <span className="font-semibold text-gray-700">{sortedPackages.length}</span> of{' '}
            <span className="font-semibold text-gray-700">{packages.length}</span> packages
          </p>
          {packages.length > 0 && (
            <p className="text-xs text-gray-400">
              {packages.length} package{packages.length > 1 ? 's' : ''} available for export
            </p>
          )}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-500 text-sm">Loading packages...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-red-600">{error}</p>
            <button
              onClick={loadPackages}
              className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              Try again
            </button>
          </div>
        ) : sortedPackages.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">No packages found</h3>
            <p className="text-gray-500 text-sm">
              {packages.length === 0 ? "You haven't sent any packages yet" : "Try adjusting your search or filters"}
            </p>
            {packages.length === 0 && (
              <a
                href="/create"
                className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Send a Package
              </a>
            )}
          </div>
        ) : viewMode === 'list' ? (
          // List View
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Package</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receiver</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Weight</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destination</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedPackages.map((pkg) => {
                    const statusInfo = getStatusInfo(pkg.status);
                    return (
                      <tr key={pkg.id} className="hover:bg-gray-50 transition cursor-pointer">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{getPackageEmoji(pkg.description)}</span>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{pkg.description || 'Package'}</p>
                              <p className="text-xs text-gray-500">{pkg.tracking_number}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-700">{pkg.receiver_name}</p>
                          <p className="text-xs text-gray-500">{pkg.receiver_phone}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 inline-flex ${statusInfo.bg} ${statusInfo.color}`}>
                            {statusInfo.icon}
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{pkg.weight_kg} kg</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{pkg.destination_city}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{getTimeAgo(pkg.created_at)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedPackage(pkg);
                              setShowModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 justify-end"
                          >
                            View <ArrowUpRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          // Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sortedPackages.map((pkg) => {
              const statusInfo = getStatusInfo(pkg.status);
              return (
                <div
                  key={pkg.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition p-4 cursor-pointer"
                  onClick={() => {
                    setSelectedPackage(pkg);
                    setShowModal(true);
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{getPackageEmoji(pkg.description)}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">{pkg.description || 'Package'}</h3>
                        <p className="text-xs text-gray-500">{pkg.tracking_number}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Receiver</span>
                      <span className="font-medium text-gray-700">{pkg.receiver_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Weight</span>
                      <span className="font-medium text-gray-700">{pkg.weight_kg} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Destination</span>
                      <span className="font-medium text-gray-700 truncate max-w-[120px]">{pkg.destination_city}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Created</span>
                      <span className="font-medium text-gray-700">{getTimeAgo(pkg.created_at)}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                      View Details <ChevronDown className="w-3 h-3" />
                    </button>
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
                <span className="text-2xl">{getPackageEmoji(selectedPackage.description)}</span>
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
                  <p className="text-xs text-gray-500 uppercase">Created</p>
                  <p>{formatDate(selectedPackage.created_at)}</p>
                </div>
                {selectedPackage.fee && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Fee</p>
                    <p>${selectedPackage.fee.toFixed(2)}</p>
                  </div>
                )}
              </div>

              <a
                href={`/track/${selectedPackage.id}`}
                className="block w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm text-center"
              >
                Track Package
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}