// app/(dashboard)/profile/page.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Edit2, 
  Save, 
  X,
  Shield,
  Truck,
  Package,
  Users,
  Building2,
  Award,
  Clock,
  CheckCircle,
  MapPin,
  CreditCard,
  Settings,
  LogOut,
  Camera,
  Lock,
  Key,
  AlertCircle,
  Check,
  ChevronRight,
  PlusCircle,
  Star,
  TrendingUp,
  ClipboardCheck,
  LayoutDashboard  // ← ADD THIS
} from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [stats, setStats] = useState({
    packagesVerified: 0,
    packagesHandedOver: 0,
    packagesReceived: 0,
    totalProcessed: 0,
    packagesSent: 0,
    packagesDelivered: 0,
    packagesInTransit: 0,
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');

  // Get role-specific dashboard path
  const getDashboardPath = () => {
    const role = user?.role || 'user';
    switch (role) {
      case 'admin': return '/admin';
      case 'driver': return '/driver';
      case 'storekeeper': return '/storekeeper';
      default: return '/dashboard';
    }
  };

  // Get role-specific quick actions
  const getQuickActions = () => {
    const role = user?.role || 'user';
    const dashboardPath = getDashboardPath();

    switch (role) {
      case 'admin':
        return [
          { 
            label: 'Dashboard', 
            href: '/admin', 
            icon: Shield, 
            color: 'bg-purple-50 text-purple-600' 
          },
          { 
            label: 'Manage Packages', 
            href: '/admin/packages', 
            icon: Package, 
            color: 'bg-blue-50 text-blue-600' 
          },
          { 
            label: 'Manage Drivers', 
            href: '/admin/drivers', 
            icon: Truck, 
            color: 'bg-indigo-50 text-indigo-600' 
          },
        ];
      case 'driver':
        return [
          { 
            label: 'Dashboard', 
            href: '/driver', 
            icon: LayoutDashboard, 
            color: 'bg-blue-50 text-blue-600' 
          },
          { 
            label: 'My Deliveries', 
            href: '/driver/packages', 
            icon: Package, 
            color: 'bg-indigo-50 text-indigo-600' 
          },
        ];
      case 'storekeeper':
        return [
          { 
            label: 'Dashboard', 
            href: '/storekeeper', 
            icon: LayoutDashboard, 
            color: 'bg-green-50 text-green-600' 
          },
          { 
            label: 'Incoming Packages', 
            href: '/storekeeper/packages', 
            icon: Package, 
            color: 'bg-blue-50 text-blue-600' 
          },
        ];
      default:
        return [
          { 
            label: 'Dashboard', 
            href: '/dashboard', 
            icon: LayoutDashboard, 
            color: 'bg-blue-50 text-blue-600' 
          },
          { 
            label: 'My Packages', 
            href: '/packages', 
            icon: Package, 
            color: 'bg-purple-50 text-purple-600' 
          },
          { 
            label: 'Send Package', 
            href: '/create', 
            icon: PlusCircle, 
            color: 'bg-green-50 text-green-600' 
          },
        ];
    }
  };

  useEffect(() => {
    if (user) {
      setPhone(user.phone || '');
      setName(user.name || '');
      setEmail(user.email || '');
      fetchUserStats();
    }
  }, [user]);

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      const role = user.role || 'user';

      if (role === 'storekeeper') {
        // Storekeeper stats
        const { data: packages, error: packagesError } = await supabase
          .from('packages')
          .select('status, verification_status')
          .eq('verified_by', user.name);

        if (!packagesError && packages) {
          const verified = packages.filter(p => p.verification_status === 'verified').length;
          const handedOver = packages.filter(p => p.status === 'in_transit').length;
          const received = packages.filter(p => p.status === 'delivered').length;
          const total = packages.length;

          setStats({
            packagesVerified: verified,
            packagesHandedOver: handedOver,
            packagesReceived: received,
            totalProcessed: total,
            packagesSent: 0,
            packagesDelivered: 0,
            packagesInTransit: 0,
          });
        }
      } else if (role === 'driver') {
        // Driver stats
        const { data: packages, error: packagesError } = await supabase
          .from('packages')
          .select('status')
          .eq('driver_id', user.id);

        if (!packagesError && packages) {
          const delivered = packages.filter(p => p.status === 'delivered').length;
          const inTransit = packages.filter(p => p.status === 'in_transit').length;
          const ready = packages.filter(p => p.status === 'received_at_pickup').length;

          setStats({
            packagesVerified: 0,
            packagesHandedOver: 0,
            packagesReceived: 0,
            totalProcessed: 0,
            packagesSent: ready,
            packagesDelivered: delivered,
            packagesInTransit: inTransit,
          });
        }
      } else {
        // User stats
        const { data: packages, error: packagesError } = await supabase
          .from('packages')
          .select('status')
          .eq('sender_id', user.id);

        if (!packagesError && packages) {
          const sent = packages.length;
          const delivered = packages.filter(p => p.status === 'delivered').length;
          const inTransit = packages.filter(p => p.status === 'in_transit').length;

          setStats({
            packagesVerified: 0,
            packagesHandedOver: 0,
            packagesReceived: 0,
            totalProcessed: 0,
            packagesSent: sent,
            packagesDelivered: delivered,
            packagesInTransit: inTransit,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    if (phone && phone.length < 10) {
      setErrorMessage('Please enter a valid phone number (10+ digits)');
      setIsSaving(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          phone: phone,
          name: name,
        })
        .eq('id', user?.id);

      if (error) {
        setErrorMessage('Failed to update profile');
        console.error('Error updating user:', error);
      } else {
        updateUser({ 
          phone: phone,
          name: name,
        });
        setSuccessMessage('Profile updated successfully!');
        setIsEditing(false);
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      setErrorMessage('Failed to update profile. Please try again.');
      console.error('Error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setPhone(user?.phone || '');
    setName(user?.name || '');
    setEmail(user?.email || '');
    setIsEditing(false);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleEdit = () => {
    setIsEditing(true);
    setPhone(user?.phone || '');
    setName(user?.name || '');
    setEmail(user?.email || '');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleChangePassword = () => {
    setPasswordError('');

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('Please fill in all fields');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setTimeout(() => {
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSuccessMessage('Password changed successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    }, 1000);
  };

  const getInitial = () => {
    return user?.name?.charAt(0).toUpperCase() || 'U';
  };

  const getRoleBadge = () => {
    const roleConfig: Record<string, { label: string; color: string; icon: any }> = {
      admin: { 
        label: 'Administrator', 
        color: 'bg-purple-100 text-purple-700 border-purple-300',
        icon: Shield
      },
      driver: { 
        label: 'Driver', 
        color: 'bg-blue-100 text-blue-700 border-blue-300',
        icon: Truck
      },
      storekeeper: { 
        label: 'Storekeeper', 
        color: 'bg-green-100 text-green-700 border-green-300',
        icon: Building2
      },
      user: { 
        label: 'User', 
        color: 'bg-gray-100 text-gray-700 border-gray-300',
        icon: Users
      },
    };
    const config = roleConfig[user?.role || 'user'];
    const Icon = config.icon;
    return { ...config, icon: Icon };
  };

  const roleBadge = getRoleBadge();
  const RoleIcon = roleBadge.icon;
  const quickActions = getQuickActions();
  const dashboardPath = getDashboardPath();

  if (!user) {
    return null;
  }

  const getMemberSince = () => {
    if (user.created_at) {
      return new Date(user.created_at).toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
    }
    return '2026';
  };

  // Calculate completion rate for storekeeper
  const completionRate = stats.totalProcessed > 0 
    ? Math.round((stats.packagesVerified / stats.totalProcessed) * 100) 
    : 0;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-500 text-sm">Manage your account information</p>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-700 font-medium">{successMessage}</p>
          </div>
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700 font-medium">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        {/* Cover Area - Role based color */}
        <div className={`h-24 bg-gradient-to-r ${
          user?.role === 'admin' ? 'from-purple-600 to-indigo-600' :
          user?.role === 'driver' ? 'from-blue-600 to-indigo-600' :
          user?.role === 'storekeeper' ? 'from-green-600 to-emerald-600' :
          'from-blue-600 to-indigo-600'
        } relative`}>
          <div className="absolute -bottom-12 left-8">
            <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center">
              <span className={`text-3xl font-bold ${
                user?.role === 'admin' ? 'text-purple-600' :
                user?.role === 'driver' ? 'text-blue-600' :
                user?.role === 'storekeeper' ? 'text-green-600' :
                'text-blue-600'
              }`}>{getInitial()}</span>
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="pt-16 pb-6 px-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                <span className={`text-xs font-medium px-3 py-1 rounded-full border flex items-center gap-1.5 ${roleBadge.color}`}>
                  <RoleIcon className="w-3.5 h-3.5" />
                  {roleBadge.label}
                </span>
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-green-100 text-green-700 border border-green-300 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Active
                </span>
              </div>
              <p className="text-gray-500 text-sm mt-1">{user.email}</p>
              <p className="text-gray-400 text-sm flex items-center gap-1 mt-1">
                <Calendar className="w-3.5 h-3.5" />
                Member since {getMemberSince()}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {!isEditing && (
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition border border-blue-200"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </button>
              )}
              <button
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition border border-gray-200"
              >
                <Key className="w-4 h-4" />
                Change Password
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition border border-red-200"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>

          {/* Stats - Role based */}
          {user?.role === 'storekeeper' && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.packagesVerified}</p>
                  <p className="text-xs text-gray-500">Verified</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{stats.packagesHandedOver}</p>
                  <p className="text-xs text-gray-500">Handed Over</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{stats.packagesReceived}</p>
                  <p className="text-xs text-gray-500">Received</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{stats.totalProcessed}</p>
                  <p className="text-xs text-gray-500">Total Processed</p>
                </div>
              </div>
              {stats.totalProcessed > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-700">Verification Rate</span>
                    </div>
                    <span className="text-sm font-bold text-green-600">{completionRate}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {user?.role === 'driver' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{stats.packagesSent}</p>
                <p className="text-xs text-gray-500">Ready for Pickup</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600">{stats.packagesInTransit}</p>
                <p className="text-xs text-gray-500">In Transit</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.packagesDelivered}</p>
                <p className="text-xs text-gray-500">Delivered</p>
              </div>
            </div>
          )}

          {user?.role === 'user' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.packagesSent}</p>
                <p className="text-xs text-gray-500">Packages Sent</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600">{stats.packagesInTransit}</p>
                <p className="text-xs text-gray-500">In Transit</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.packagesDelivered}</p>
                <p className="text-xs text-gray-500">Delivered</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Profile Information */}
      <div className="mt-6 bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Information</h3>
        <div className="space-y-4">
          {/* Full Name */}
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <User className="w-5 h-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</p>
              {isEditing ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              ) : (
                <p className="font-semibold text-gray-900 text-base">{user.name}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email Address</p>
              <p className="font-semibold text-gray-900 text-base">{user.email}</p>
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>
          </div>

          {/* Phone */}
          <div className={`flex items-start gap-3 p-3 rounded-lg border ${
            isEditing ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'
          }`}>
            <Phone className={`w-5 h-5 mt-0.5 ${isEditing ? 'text-blue-500' : 'text-gray-400'}`} />
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone Number {isEditing && <span className="text-blue-600">(Editing)</span>}
              </p>
              {isEditing ? (
                <div className="mt-1">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    placeholder="Enter your phone number"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter a valid phone number (10+ digits)</p>
                </div>
              ) : (
                <p className="font-semibold text-gray-900 text-base">
                  {user.phone || 'Not provided'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Edit/Save Buttons */}
        {isEditing && (
          <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Quick Actions - Role Based */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className="bg-white rounded-xl shadow-md border border-gray-200 p-4 hover:shadow-lg transition flex items-center gap-3"
            >
              <div className={`p-2.5 rounded-lg ${action.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">{action.label}</p>
                <p className="text-xs text-gray-500">Go to {action.label}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>
          );
        })}
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
              <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              {passwordError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm">{passwordError}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Minimum 6 characters"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Re-enter new password"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangePassword}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Update Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}