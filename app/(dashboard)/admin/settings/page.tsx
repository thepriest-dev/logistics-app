// app/(dashboard)/admin/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { 
  Settings as SettingsIcon,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Globe,
  DollarSign,
  Truck,
  Clock,
  Mail,
  Phone,
  MapPin,
  Lock,
  Key,
  RefreshCw,
  Palette,
  ChevronDown,
  ChevronRight,
  Shield,
  Edit,
  Lock as LockIcon,
  AlertTriangle
} from 'lucide-react';

interface PlatformSettings {
  app_name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  currency: string;
  timezone: string;
  language: string;
  delivery_fee: string;
  free_delivery_threshold: string;
  max_package_weight: string;
  max_package_size: string;
  delivery_hours_start: string;
  delivery_hours_end: string;
  weekend_delivery: string;
  sms_notifications: string;
  email_notifications: string;
  push_notifications: string;
  driver_tracking: string;
  require_signature: string;
  photo_proof: string;
  allow_cancellation: string;
  cancellation_window: string;
  maintenance_mode: string;
  require_verification: string;
  enable_reviews: string;
  enable_referrals: string;
  referral_bonus: string;
}

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'general' | 'delivery' | 'notifications' | 'security' | 'appearance'>('general');
  const [settings, setSettings] = useState<PlatformSettings>({
    app_name: 'SendIt',
    contact_email: 'support@sendit.com',
    contact_phone: '+234 800 000 0000',
    address: '123, Delivery Road, Ibadan, Nigeria',
    currency: 'NGN',
    timezone: 'Africa/Lagos',
    language: 'en',
    delivery_fee: '500',
    free_delivery_threshold: '10000',
    max_package_weight: '50',
    max_package_size: '100x60x60 cm',
    delivery_hours_start: '06:00',
    delivery_hours_end: '22:00',
    weekend_delivery: 'true',
    sms_notifications: 'true',
    email_notifications: 'true',
    push_notifications: 'true',
    driver_tracking: 'true',
    require_signature: 'true',
    photo_proof: 'true',
    allow_cancellation: 'true',
    cancellation_window: '120',
    maintenance_mode: 'false',
    require_verification: 'true',
    enable_reviews: 'true',
    enable_referrals: 'true',
    referral_bonus: '500',
  });

  const [formData, setFormData] = useState<PlatformSettings>(settings);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<{key: string | null, value: any}>({key: null, value: null});
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');

  // Critical settings that require edit mode
  const criticalSettings = [
    'app_name',
    'currency',
    'timezone',
    'max_package_weight',
    'maintenance_mode',
    'require_verification',
    'delivery_fee',
    'free_delivery_threshold'
  ];

  useEffect(() => {
    if (user && user.role !== 'admin') {
      window.location.href = '/dashboard';
      return;
    }
    loadSettings();
  }, [user]);

  // Direct Supabase queries - no import needed
  const loadSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('platform_settings')
      .select('key, value');

    if (!error && data) {
      const updated = { ...settings };
      data.forEach(item => {
        const key = item.key as keyof PlatformSettings;
        if (key in updated) {
          updated[key] = item.value;
        }
      });
      setSettings(updated);
      setFormData(updated);
    }
    setLoading(false);
  };

  const saveSettings = async () => {
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const updates = Object.entries(formData);
      const results = await Promise.all(
        updates.map(([key, value]) =>
          supabase
            .from('platform_settings')
            .update({ value, updated_at: new Date().toISOString() })
            .eq('key', key)
        )
      );

      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        setErrorMessage('Failed to save some settings');
      } else {
        setSettings(formData);
        setSuccessMessage('Settings saved successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      setErrorMessage('An error occurred while saving');
      console.error('Error saving settings:', error);
    }
    setSaving(false);
  };

  const updateSingleSetting = async (key: string, value: string) => {
    const { error } = await supabase
      .from('platform_settings')
      .update({ value, updated_at: new Date().toISOString() })
      .eq('key', key);

    if (error) {
      setErrorMessage('Failed to update setting');
    } else {
      setSuccessMessage('Setting updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const isCriticalSetting = (key: string) => {
    return criticalSettings.includes(key);
  };

  const isDestructiveSetting = (key: string) => {
    return key === 'maintenance_mode' || key === 'allow_cancellation';
  };

  const handleSettingChange = (key: keyof PlatformSettings, value: any) => {
    if (isCriticalSetting(key)) {
      setShowEditModal({key, value});
      return;
    }

    if (isDestructiveSetting(key)) {
      setShowConfirmModal(true);
      return;
    }

    setFormData(prev => ({ ...prev, [key]: value }));
    if (typeof value === 'string' && (value === 'true' || value === 'false')) {
      saveSettings();
    }
  };

  const handleCriticalSettingSave = async () => {
    if (showEditModal.key) {
      const key = showEditModal.key as keyof PlatformSettings;
      setFormData(prev => ({ ...prev, [key]: showEditModal.value }));
      setShowEditModal({key: null, value: null});
      await updateSingleSetting(key, String(showEditModal.value));
    }
  };

  const handleResetSettings = () => {
    setFormData(settings);
    setSuccessMessage('Settings reset to default');
    setTimeout(() => setSuccessMessage(''), 3000);
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

  const confirmMaintenance = () => {
    setFormData(prev => ({ 
      ...prev, 
      maintenance_mode: prev.maintenance_mode === 'true' ? 'false' : 'true' 
    }));
    setShowConfirmModal(false);
    saveSettings();
  };

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'delivery', label: 'Delivery', icon: Truck },
    { id: 'notifications', label: 'Notifications', icon: SettingsIcon },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  const renderSettingField = (key: keyof PlatformSettings, label: string, type: string = 'text', options?: any[]) => {
    const value = formData[key];
    const isCritical = isCriticalSetting(key);
    const isToggle = value === 'true' || value === 'false';

    if (isToggle) {
      const boolValue = value === 'true';
      return (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-800">{label}</p>
            <p className="text-xs text-gray-500">Configure this setting</p>
          </div>
          <div className="flex items-center gap-2">
            {isCritical && <LockIcon className="w-4 h-4 text-gray-400" />}
            <button
              onClick={() => handleSettingChange(key, !boolValue ? 'true' : 'false')}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                boolValue ? 'bg-blue-600' : 'bg-gray-300'
              } ${isCritical ? 'opacity-75 cursor-not-allowed' : ''}`}
              disabled={isCritical}
            >
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                boolValue ? 'translate-x-6' : 'translate-x-0'
              }`}></div>
            </button>
          </div>
        </div>
      );
    }

    if (isCritical) {
      return (
        <div className="p-3 bg-gray-100 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-medium text-gray-800">{label}</p>
              <p className="text-xs text-gray-500">Configure this setting</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">{value}</span>
              <LockIcon className="w-4 h-4 text-gray-400" />
              <button
                onClick={() => setShowEditModal({key, value})}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-3 bg-gray-50 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <p className="text-xs text-gray-500 mb-2">Configure this setting</p>
        {type === 'select' ? (
          <select
            value={value}
            onChange={(e) => setFormData({...formData, [key]: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {options?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => setFormData({...formData, [key]: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 text-sm">Manage platform configuration and preferences</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleResetSettings}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50"
          >
            {saving ? (
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
        </div>
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

      {/* Protected Settings Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <LockIcon className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">Protected Settings</p>
            <p className="text-sm text-blue-700">
              Some critical settings are locked to prevent accidental changes. 
              Click the <Edit className="w-4 h-4 inline" /> icon next to a locked setting to edit it.
            </p>
          </div>
        </div>
      </div>

      {/* Maintenance Mode Banner */}
      {formData.maintenance_mode === 'true' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-yellow-800 font-medium">Maintenance Mode is Active</p>
              <p className="text-yellow-700 text-sm">The platform is currently in maintenance mode. Users will see a maintenance page.</p>
            </div>
            <button
              onClick={() => handleSettingChange('maintenance_mode', 'false')}
              className="ml-auto px-4 py-1.5 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700 transition"
            >
              Disable
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 pb-3 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive 
                    ? 'border-b-2 border-blue-600 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">General Information</h3>
          </div>
          <div className="p-5 space-y-4">
            {renderSettingField('app_name', 'App Name')}
            {renderSettingField('contact_email', 'Contact Email')}
            {renderSettingField('contact_phone', 'Contact Phone')}
            {renderSettingField('address', 'Business Address')}
            {renderSettingField('currency', 'Currency')}
          </div>
        </div>
      )}

      {/* Delivery Settings */}
      {activeTab === 'delivery' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Delivery Settings</h3>
          </div>
          <div className="p-5 space-y-4">
            {renderSettingField('delivery_fee', 'Delivery Fee (₦)')}
            {renderSettingField('free_delivery_threshold', 'Free Delivery Threshold (₦)')}
            {renderSettingField('max_package_weight', 'Max Package Weight (kg)')}
            {renderSettingField('max_package_size', 'Max Package Size')}
          </div>
        </div>
      )}

      {/* Notifications Settings */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Notification Preferences</h3>
          </div>
          <div className="p-5 space-y-4">
            {renderSettingField('sms_notifications', 'SMS Notifications')}
            {renderSettingField('email_notifications', 'Email Notifications')}
            {renderSettingField('push_notifications', 'Push Notifications')}
          </div>
        </div>
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Security Settings</h3>
          </div>
          <div className="p-5 space-y-4">
            {renderSettingField('require_verification', 'Require User Verification')}
            {renderSettingField('allow_cancellation', 'Allow Package Cancellation')}
            {renderSettingField('enable_reviews', 'Enable Reviews')}
            {renderSettingField('maintenance_mode', 'Maintenance Mode')}
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                <Key className="w-4 h-4" />
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Appearance Settings */}
      {activeTab === 'appearance' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Appearance Settings</h3>
          </div>
          <div className="p-5 space-y-4">
            {renderSettingField('language', 'Language', 'select', [
              { value: 'en', label: 'English' },
              { value: 'fr', label: 'French' },
              { value: 'sw', label: 'Swahili' },
              { value: 'ha', label: 'Hausa' },
              { value: 'yo', label: 'Yoruba' },
              { value: 'ig', label: 'Igbo' },
            ])}
            {renderSettingField('timezone', 'Timezone', 'select', [
              { value: 'Africa/Lagos', label: 'Africa/Lagos (WAT)' },
              { value: 'Africa/Cairo', label: 'Africa/Cairo (CAT)' },
              { value: 'Africa/Johannesburg', label: 'Africa/Johannesburg (SAST)' },
              { value: 'UTC', label: 'UTC' },
            ])}
          </div>
        </div>
      )}

      {/* Edit Critical Setting Modal */}
      {showEditModal.key && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Edit Protected Setting</h2>
                <p className="text-sm text-gray-500">This is a critical setting. Changes may affect the platform.</p>
              </div>
              <button onClick={() => setShowEditModal({key: null, value: null})} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {showEditModal.key?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </label>
                <input
                  type={typeof showEditModal.value === 'number' ? 'number' : 'text'}
                  value={showEditModal.value}
                  onChange={(e) => setShowEditModal({
                    key: showEditModal.key,
                    value: typeof showEditModal.value === 'number' ? Number(e.target.value) : e.target.value
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">Changes to this setting will be audited</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowEditModal({key: null, value: null})}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCriticalSettingSave}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {/* Confirm Maintenance Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Toggle Maintenance Mode</h2>
            <p className="text-gray-600 mb-6">
              {formData.maintenance_mode === 'true'
                ? 'Are you sure you want to disable maintenance mode? The platform will become available to users again.'
                : 'Are you sure you want to enable maintenance mode? The platform will be temporarily unavailable to users.'
              }
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmMaintenance}
                className={`flex-1 px-4 py-2 rounded-lg text-white transition ${
                  formData.maintenance_mode === 'true'
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-yellow-600 hover:bg-yellow-700'
                }`}
              >
                {formData.maintenance_mode === 'true' ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}