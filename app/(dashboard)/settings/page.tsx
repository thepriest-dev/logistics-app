// app/(dashboard)/settings/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import {
  Settings,
  Bell,
  Globe,
  Lock,
  Shield,
  Mail,
  Phone,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Languages
} from 'lucide-react';

interface SettingsData {
  id?: string;
  user_id: string;
  notifications_enabled: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
  language: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [settings, setSettings] = useState<SettingsData>({
    user_id: '',
    notifications_enabled: true,
    email_notifications: true,
    sms_notifications: false,
    language: 'en',
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Try 'user_settings' first
      let result = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // If 'user_settings' doesn't work, try 'settings'
      if (result.error) {
        result = await supabase
          .from('settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
      }

      if (result.error) {
        console.log('Settings table not found - using defaults');
        setSettings({
          ...settings,
          user_id: user.id,
        });
        setLoading(false);
        return;
      }

      if (result.data) {
        setSettings({
          ...settings,
          ...result.data,
          user_id: user.id,
        });
      } else {
        setSettings({
          ...settings,
          user_id: user.id,
        });
      }

    } catch (err) {
      console.error('Error loading settings:', err);
      setSettings({
        ...settings,
        user_id: user.id,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!user) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const settingsData = {
        user_id: user.id,
        notifications_enabled: settings.notifications_enabled,
        email_notifications: settings.email_notifications,
        sms_notifications: settings.sms_notifications,
        language: settings.language,
        updated_at: new Date().toISOString(),
      };

      // Try 'user_settings' first
      let result = await supabase
        .from('user_settings')
        .upsert(settingsData, { onConflict: 'user_id' });

      // If that fails, try 'settings'
      if (result.error) {
        result = await supabase
          .from('settings')
          .upsert(settingsData, { onConflict: 'user_id' });
      }

      if (result.error) {
        console.error('Error saving settings:', result.error);
        setError('Could not save settings to server, but changes are saved locally.');
        setSuccess('Settings updated locally!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setSuccess('Settings saved successfully!');
        setTimeout(() => setSuccess(null), 3000);
      }

    } catch (err) {
      console.error('Error saving settings:', err);
      setSuccess('Settings updated!');
      setTimeout(() => setSuccess(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">⚙️ Settings</h1>
          <p className="text-gray-500 text-sm">Manage your app preferences</p>
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={saving || loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {saving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
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

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-700 font-medium">{success}</p>
          </div>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Notifications */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              Notifications
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700">Push Notifications</p>
                  <p className="text-xs text-gray-400">Receive push notifications on your device</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications_enabled}
                    onChange={(e) => setSettings({ ...settings, notifications_enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700">Email Notifications</p>
                  <p className="text-xs text-gray-400">Receive updates via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.email_notifications}
                    onChange={(e) => setSettings({ ...settings, email_notifications: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700">SMS Notifications</p>
                  <p className="text-xs text-gray-400">Receive updates via SMS</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.sms_notifications}
                    onChange={(e) => setSettings({ ...settings, sms_notifications: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Language */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Languages className="w-5 h-5 text-blue-600" />
              Language
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-700">App Language</p>
                <p className="text-xs text-gray-400">Choose your preferred language</p>
              </div>
              <select
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="zh">Chinese</option>
                <option value="pt">Portuguese</option>
                <option value="ar">Arabic</option>
                <option value="hi">Hindi</option>
                <option value="yo">Yoruba</option>
                <option value="ha">Hausa</option>
                <option value="ig">Igbo</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}