// lib/packages.tsx
'use client';

import { supabase } from './supabase';

export interface Package {
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
  driver_id?: string;
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

// ============================================
// PACKAGE FUNCTIONS
// ============================================

export async function getUserPackages(userId: string): Promise<Package[]> {
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .eq('sender_id', userId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching user packages:', error);
    return [];
  }
  return data || [];
}

export async function getDriverPackages(driverId: string): Promise<Package[]> {
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .eq('driver_id', driverId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching driver packages:', error);
    return [];
  }
  return data || [];
}

// Add this function to create notifications
export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error',
  trackingNumber?: string
) {
  const { error } = await supabase
    .from('notifications')
    .insert([{
      user_id: userId,
      title,
      message,
      type,
      tracking_number: trackingNumber,
      read: false,
    }]);

  if (error) {
    console.error('Error creating notification:', error);
  }
}

export async function getAllPackages(): Promise<Package[]> {
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching all packages:', error);
    return [];
  }
  return data || [];
}

export async function getStorePackages(pickupPointName: string): Promise<Package[]> {
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .eq('pickup_point_name', pickupPointName)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching store packages:', error);
    return [];
  }
  return data || [];
}

export async function getPackageByTracking(trackingNumber: string): Promise<Package | null> {
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .eq('tracking_number', trackingNumber)
    .single();
  if (error) {
    console.error('Error fetching package:', error);
    return null;
  }
  return data;
}

export async function createPackage(packageData: Omit<Package, 'id' | 'created_at'>): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase
    .from('packages')
    .insert([packageData])
    .select()
    .single();
  if (error) {
    console.error('Error creating package:', error);
    return { success: false, error: error.message };
  }
  await supabase
    .from('tracking_events')
    .insert([{
      package_id: data.id,
      status: 'pending_verification',
      notes: 'Package registered and awaiting verification',
      triggered_by: packageData.sender_name,
    }]);
  return { success: true };
}

export async function updatePackageStatus(
  packageId: string,
  status: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('packages')
    .update({ status })
    .eq('id', packageId);
  if (error) {
    console.error('Error updating package status:', error);
    return { success: false, error: error.message };
  }
  await supabase
    .from('tracking_events')
    .insert([{
      package_id: packageId,
      status,
      notes: notes || `Package status updated to ${status}`,
    }]);
  return { success: true };
}

export async function getTrackingEvents(packageId: string) {
  const { data, error } = await supabase
    .from('tracking_events')
    .select('*')
    .eq('package_id', packageId)
    .order('created_at', { ascending: true });
  if (error) {
    console.error('Error fetching tracking events:', error);
    return [];
  }
  return data || [];
}

// ============================================
// USER & DRIVER FUNCTIONS
// ============================================

export async function getUsersCount(): Promise<number> {
  const { count, error } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });
  if (error) {
    console.error('Error fetching user count:', error);
    return 0;
  }
  return count || 0;
}

export async function getDriversCount(): Promise<number> {
  const { count, error } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'driver');
  if (error) {
    console.error('Error fetching driver count:', error);
    return 0;
  }
  return count || 0;
}

export async function getAllUsers(): Promise<any[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }
  return data || [];
}

export async function updateUserRole(userId: string, role: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', userId);
  if (error) {
    console.error('Error updating user role:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function updateUserStatus(userId: string, status: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('users')
    .update({ status })
    .eq('id', userId);
  if (error) {
    console.error('Error updating user status:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);
  if (error) {
    console.error('Error deleting user:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function getAllDrivers(): Promise<any[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'driver')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching drivers:', error);
    return [];
  }
  return data || [];
}

// ============================================
// SETTINGS FUNCTIONS
// ============================================

export async function getSettings(): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('platform_settings')
    .select('key, value');

  if (error) {
    console.error('Error fetching settings:', error);
    return {};
  }

  const settings: Record<string, string> = {};
  data?.forEach(item => {
    settings[item.key] = item.value;
  });
  return settings;
}

export async function updateSetting(key: string, value: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('platform_settings')
    .update({ value, updated_at: new Date().toISOString() })
    .eq('key', key);

  if (error) {
    console.error('Error updating setting:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function updateMultipleSettings(settings: Record<string, string>): Promise<{ success: boolean; error?: string }> {
  const updates = Object.entries(settings).map(([key, value]) => {
    return supabase
      .from('platform_settings')
      .update({ value, updated_at: new Date().toISOString() })
      .eq('key', key);
  });

  const results = await Promise.all(updates);
  const errors = results.filter(r => r.error);

  if (errors.length > 0) {
    console.error('Error updating settings:', errors);
    return { success: false, error: 'Failed to update some settings' };
  }

  return { success: true };
}