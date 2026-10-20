// lib/packages.ts
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

// Get all packages for a user (sender)
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

// Get packages assigned to a driver
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

// Get all packages (for admin)
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

// Get packages at a pickup point (for storekeeper)
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

// Get a single package by tracking number
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

// Create a new package
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

  // Create initial tracking event
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

// Update package status
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

  // Add tracking event
  await supabase
    .from('tracking_events')
    .insert([{
      package_id: packageId,
      status,
      notes: notes || `Package status updated to ${status}`,
    }]);

  return { success: true };
}

// Get tracking events for a package
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